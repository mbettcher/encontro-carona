package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.entity.EquipeMontagemKit;
import br.com.paroquia.encontro.domain.enums.*;
import br.com.paroquia.encontro.dto.request.CadernoChoroCancelarRequest;
import br.com.paroquia.encontro.dto.request.CadernoChoroOcorrenciaRequest;
import br.com.paroquia.encontro.dto.request.CadernoChoroRecuperarRequest;
import br.com.paroquia.encontro.dto.request.CadernoChoroSubstituirRequest;
import br.com.paroquia.encontro.dto.response.CadernoChoroGeracaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroHistoricoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroSubstituicaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroTimelineResponse;
import br.com.paroquia.encontro.repository.CadernoChoroHistoricoRepository;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EquipeMontagemKitRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CadernoChoroService {

    private static final List<StatusCadernoChoro>
            STATUS_NAO_CONTAM_CARGA_EQUIPE = List.of(
            StatusCadernoChoro.ENTREGUE_AO_SOBRINHO,
            StatusCadernoChoro.PERDIDO,
            StatusCadernoChoro.DANIFICADO,
            StatusCadernoChoro.SUBSTITUIDO,
            StatusCadernoChoro.CANCELADO
    );

    private final CadernoChoroRepository repository;
    private final CadernoChoroHistoricoRepository historicoRepository;
    private final EventoRepository eventoRepository;
    private final DuplaTioCaronaRepository duplaRepository;
    private final SobrinhoDuplaRepository sobrinhoDuplaRepository;
    private final EquipeMontagemKitRepository equipeMontagemKitRepository;

    public CadernoChoroService(
            CadernoChoroRepository repository,
            CadernoChoroHistoricoRepository historicoRepository,
            EventoRepository eventoRepository,
            DuplaTioCaronaRepository duplaRepository,
            SobrinhoDuplaRepository sobrinhoDuplaRepository,
            EquipeMontagemKitRepository equipeMontagemKitRepository
    ) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.eventoRepository = eventoRepository;
        this.duplaRepository = duplaRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
        this.equipeMontagemKitRepository =
                equipeMontagemKitRepository;
    }

    /*
     * =========================================================================
     * GERAÇÃO INICIAL
     * =========================================================================
     */

    @Transactional
    public CadernoChoroGeracaoResponse gerar(Long eventoId) {
        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Evento não encontrado."
                        )
                );

        var vinculosAtivos =
                sobrinhoDuplaRepository
                        .findByEventoIdAndStatusOrderByDuplaCodigoAscSobrinhoNomeAsc(
                                eventoId,
                                VinculoStatus.ATIVO
                        );

        long criados = 0;
        long existentes = 0;

        for (var vinculo : vinculosAtivos) {
            var sobrinho = vinculo.getSobrinho();
            var dupla = vinculo.getDupla();

            if (sobrinho.getStatus() == SobrinhoStatus.DESISTENTE) {
                continue;
            }

            if (dupla.getStatus() != DuplaStatus.ATIVA) {
                continue;
            }

            /*
             * A geração em lote cria somente a primeira via.
             *
             * Um caderno cancelado ou substituído somente pode originar
             * outra via pelas operações específicas de retomada ou
             * substituição.
             */
            if (repository.existsByEventoIdAndSobrinhoId(
                    eventoId,
                    sobrinho.getId()
            )) {
                existentes++;
                continue;
            }

            var caderno = repository.save(
                    new CadernoChoro(
                            evento,
                            dupla,
                            sobrinho
                    )
            );

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.CADERNO_GERADO,
                    null,
                    StatusCadernoChoro.PENDENTE,
                    MotivoEmissaoCaderno.GERACAO_INICIAL.name(),
                    "Caderno de Mensagens gerado automaticamente a partir " +
                            "do vínculo ativo com a dupla."
            );

            criados++;
        }

        return new CadernoChoroGeracaoResponse(
                eventoId,
                criados,
                existentes,
                repository.countByEventoId(eventoId)
        );
    }

    /*
     * =========================================================================
     * CONSULTAS
     * =========================================================================
     */

    @Transactional(readOnly = true)
    public List<CadernoChoroResponse> listar(Long eventoId) {
        /*
         * A tela operacional atual deve trabalhar apenas com a via atual.
         *
         * Como ainda não existe uma consulta ordenada específica no
         * repositório, filtramos neste momento. No bloco de consultas e
         * frontend podemos criar uma query dedicada.
         */
        return repository
                .findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId)
                .stream()
                .filter(CadernoChoro::isViaAtual)
                .map(CadernoChoroResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroResponse> listarPorDupla(
            Long eventoId,
            Long duplaId
    ) {
        validarDuplaNoEvento(eventoId, duplaId);

        return repository
                .findByEventoIdAndDuplaIdOrderBySobrinhoNomeAsc(
                        eventoId,
                        duplaId
                )
                .stream()
                .filter(CadernoChoro::isViaAtual)
                .map(CadernoChoroResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroResponse> listarVias(
            Long eventoId,
            Long sobrinhoId
    ) {
        var vias =
                repository.findByEventoIdAndSobrinhoIdOrderByNumeroViaAsc(
                        eventoId,
                        sobrinhoId
                );

        if (vias.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Nenhum Caderno de Mensagens foi encontrado para este " +
                            "encontrista no evento."
            );
        }

        return vias.stream()
                .map(CadernoChoroResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CadernoChoroHistoricoResponse> listarHistorico(
            Long eventoId,
            Long cadernoId
    ) {
        buscarCaderno(eventoId, cadernoId);

        /*
         * Mantemos DESC para não quebrar o frontend atual.
         * A nova timeline poderá ordenar os itens em ASC.
         */
        return historicoRepository
                .findByCadernoIdOrderByOcorridoEmDesc(cadernoId)
                .stream()
                .map(CadernoChoroHistoricoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CadernoChoroTimelineResponse listarTimelineConsolidada(
            Long eventoId,
            Long sobrinhoId
    ) {
        var vias =
                repository.findByEventoIdAndSobrinhoIdOrderByNumeroViaAsc(
                        eventoId,
                        sobrinhoId
                );

        if (vias.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Nenhum Caderno de Mensagens foi encontrado para este " +
                            "encontrista no evento."
            );
        }

        var viaAtual = vias.stream()
                .filter(CadernoChoro::isViaAtual)
                .findFirst()
                .orElseGet(() -> vias.get(vias.size() - 1));

        var movimentacoes = historicoRepository
                .findByEventoIdAndSobrinhoIdOrderByOcorridoEmAsc(
                        eventoId,
                        sobrinhoId
                )
                .stream()
                .map(CadernoChoroHistoricoResponse::from)
                .toList();

        return new CadernoChoroTimelineResponse(
                eventoId,
                sobrinhoId,
                viaAtual.getSobrinho().getNome(),
                viaAtual.getNumeroVia(),
                viaAtual.getId(),
                vias.stream()
                        .map(CadernoChoroResponse::from)
                        .toList(),
                movimentacoes
        );
    }

    /*
     * =========================================================================
     * FLUXO OPERACIONAL NORMAL
     * =========================================================================
     */

    @Transactional
    public List<CadernoChoroResponse> entregarADupla(
            Long eventoId,
            Long duplaId,
            String observacao
    ) {
        validarDuplaNoEvento(eventoId, duplaId);

        var cadernos =
                repository.findByEventoIdAndDuplaIdAndViaAtualTrueAndStatusIn(
                        eventoId,
                        duplaId,
                        List.of(StatusCadernoChoro.PENDENTE)
                );

        if (cadernos.isEmpty()) {
            throw new BusinessException(
                    "Não há Cadernos de Mensagens pendentes para entregar " +
                            "a esta dupla."
            );
        }

        cadernos.forEach(caderno -> {
            var statusAnterior = caderno.getStatus();

            caderno.entregarADupla(observacao);

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.ENTREGA_A_DUPLA,
                    statusAnterior,
                    caderno.getStatus(),
                    null,
                    observacao
            );
        });

        return cadernos.stream()
                .map(CadernoChoroResponse::from)
                .toList();
    }

    @Transactional
    public List<CadernoChoroResponse> receberDaDupla(
            Long eventoId,
            Long duplaId,
            String observacao
    ) {
        validarDuplaNoEvento(eventoId, duplaId);

        var cadernos =
                repository.findByEventoIdAndDuplaIdAndViaAtualTrueAndStatusIn(
                        eventoId,
                        duplaId,
                        List.of(StatusCadernoChoro.ENTREGUE_A_DUPLA)
                );

        if (cadernos.isEmpty()) {
            throw new BusinessException(
                    "Não há Cadernos de Mensagens entregues à dupla para " +
                            "receber de volta."
            );
        }

        var equipes =
                equipeMontagemKitRepository
                        .findByEventoIdAndStatusOrderByIdAsc(
                                eventoId,
                                StatusEquipeMontagemKit.ATIVA
                        );

        if (equipes.isEmpty()) {
            throw new BusinessException(
                    "Cadastre ao menos uma equipe de montagem do kit ativa " +
                            "antes de receber Cadernos de Mensagens da dupla."
            );
        }

        var cargasPorEquipe = carregarCargasAtuais(equipes);

        cadernos.forEach(caderno -> {
            var statusAntesRecebimento = caderno.getStatus();

            caderno.receberDaDupla(observacao);

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.RECEBIMENTO_DA_DUPLA,
                    statusAntesRecebimento,
                    caderno.getStatus(),
                    null,
                    observacao
            );

            var equipe = selecionarEquipeMenosCarregada(
                    equipes,
                    cargasPorEquipe
            );

            var statusAntesDirecionamento = caderno.getStatus();

            caderno.direcionarEquipeMontagem(
                    equipe,
                    observacao
            );

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.DIRECIONAMENTO_EQUIPE,
                    statusAntesDirecionamento,
                    caderno.getStatus(),
                    null,
                    observacaoEquipe(equipe, observacao)
            );

            cargasPorEquipe.compute(
                    equipe.getId(),
                    (id, cargaAtual) ->
                            cargaAtual == null ? 1L : cargaAtual + 1L
            );
        });

        return cadernos.stream()
                .map(CadernoChoroResponse::from)
                .toList();
    }

    @Transactional
    public CadernoChoroResponse conferir(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var caderno = buscarViaAtual(eventoId, cadernoId);
        var statusAnterior = caderno.getStatus();

        caderno.conferir(observacao);

        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.CONFERENCIA,
                statusAnterior,
                caderno.getStatus(),
                null,
                observacao
        );

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse anexarAoKit(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var caderno = buscarViaAtual(eventoId, cadernoId);
        var statusAnterior = caderno.getStatus();

        caderno.anexarAoKit(observacao);

        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.ANEXACAO_KIT,
                statusAnterior,
                caderno.getStatus(),
                null,
                observacao
        );

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse entregarAoSobrinho(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var caderno = buscarViaAtual(eventoId, cadernoId);
        var statusAnterior = caderno.getStatus();

        caderno.entregarAoSobrinho(observacao);

        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.ENTREGA_ENCONTRISTA,
                statusAnterior,
                caderno.getStatus(),
                null,
                observacao
        );

        return CadernoChoroResponse.from(caderno);
    }

    /*
     * =========================================================================
     * OCORRÊNCIAS
     * =========================================================================
     */

    @Transactional
    public CadernoChoroResponse registrarOcorrencia(
            Long eventoId,
            Long cadernoId,
            CadernoChoroOcorrenciaRequest request
    ) {
        var caderno = buscarViaAtual(eventoId, cadernoId);
        var statusAnterior = caderno.getStatus();

        if (request.tipo() == TipoOcorrenciaCaderno.PERDA) {
            caderno.marcarPerdido(request.observacao());

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.PERDA_REGISTRADA,
                    statusAnterior,
                    caderno.getStatus(),
                    TipoOcorrenciaCaderno.PERDA.name(),
                    request.observacao()
            );

            return CadernoChoroResponse.from(caderno);
        }

        caderno.marcarDanificado(
                request.impedeContinuacao(),
                request.observacao()
        );

        /*
         * Dano leve não altera o status operacional.
         * Ainda assim, aparece integralmente na timeline.
         */
        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.DANO_REGISTRADO,
                statusAnterior,
                caderno.getStatus(),
                request.impedeContinuacao()
                        ? "DANO_IMPEDE_CONTINUACAO"
                        : "DANO_NAO_IMPEDE_CONTINUACAO",
                request.observacao()
        );

        return CadernoChoroResponse.from(caderno);
    }

    @Transactional
    public CadernoChoroResponse recuperar(
            Long eventoId,
            Long cadernoId,
            CadernoChoroRecuperarRequest request
    ) {
        var caderno = buscarViaAtual(eventoId, cadernoId);
        var statusAnterior = caderno.getStatus();

        caderno.recuperarDeOcorrencia(request.observacao());

        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.CADERNO_RECUPERADO,
                statusAnterior,
                caderno.getStatus(),
                statusAnterior.name(),
                request.observacao()
        );

        return CadernoChoroResponse.from(caderno);
    }

    /*
     * =========================================================================
     * SUBSTITUIÇÃO TRANSACIONAL
     * =========================================================================
     */

    @Transactional
    public CadernoChoroSubstituicaoResponse substituir(
            Long eventoId,
            Long cadernoId,
            CadernoChoroSubstituirRequest request
    ) {
        var viaAnterior = buscarViaAtual(eventoId, cadernoId);

        validarEncontristaPodeReceberNovaVia(viaAnterior);

        var vinculoAtivo =
                sobrinhoDuplaRepository
                        .findByEventoIdAndSobrinhoIdAndStatus(
                                eventoId,
                                viaAnterior.getSobrinho().getId(),
                                VinculoStatus.ATIVO
                        )
                        .orElseThrow(() ->
                                new BusinessException(
                                        "Não é possível gerar uma nova via " +
                                                "porque o encontrista não " +
                                                "possui vínculo ativo com " +
                                                "uma dupla."
                                )
                        );

        var duplaAtual = vinculoAtivo.getDupla();

        if (duplaAtual.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException(
                    "Não é possível gerar uma nova via porque a dupla " +
                            "responsável está inativa."
            );
        }

        var statusAnterior = viaAnterior.getStatus();
        var motivoEmissao = motivoEmissaoSubstituicao(request.motivo());

        /*
         * 1. Encerra a via anterior.
         */
        viaAnterior.marcarSubstituido(
                request.motivo(),
                request.observacao()
        );

        /*
         * 2. Libera o índice parcial de via atual.
         */
        viaAnterior.marcarComoViaAnterior();

        repository.save(viaAnterior);

        /*
         * Força o UPDATE antes do INSERT da nova via.
         *
         * Caso qualquer etapa posterior falhe, toda a transação será
         * revertida, inclusive esta alteração.
         */
        repository.flush();

        /*
         * 3. Cria a nova via em PENDENTE.
         */
        var novaVia = CadernoChoro.criarViaSubstituta(
                viaAnterior,
                duplaAtual,
                motivoEmissao
        );

        repository.save(novaVia);

        /*
         * 4. Registra o encerramento da via anterior.
         */
        registrarHistorico(
                viaAnterior,
                TipoMovimentacaoCaderno.CADERNO_SUBSTITUIDO,
                statusAnterior,
                StatusCadernoChoro.SUBSTITUIDO,
                request.motivo().name(),
                montarObservacaoSubstituicao(
                        request.observacao(),
                        novaVia.getNumeroVia()
                )
        );

        /*
         * 5. Inicia a timeline completa da nova via.
         */
        registrarHistorico(
                novaVia,
                TipoMovimentacaoCaderno.NOVA_VIA_GERADA,
                null,
                StatusCadernoChoro.PENDENTE,
                motivoEmissao.name(),
                montarObservacaoNovaVia(
                        viaAnterior.getNumeroVia(),
                        request.observacao()
                )
        );

        return new CadernoChoroSubstituicaoResponse(
                CadernoChoroResponse.from(viaAnterior),
                CadernoChoroResponse.from(novaVia)
        );
    }

    /*
     * Compatibilidade temporária com o endpoint atual.
     *
     * O frontend antigo espera receber somente um CadernoChoroResponse.
     * Retornamos a nova via, que será a via operacional exibida na tela.
     */
    @Transactional
    public CadernoChoroResponse marcarSubstituido(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var resultado = substituir(
                eventoId,
                cadernoId,
                new CadernoChoroSubstituirRequest(
                        MotivoSubstituicaoCaderno.OUTRO,
                        validarObservacaoLegada(
                                observacao,
                                "Informe uma observação sobre a substituição."
                        )
                )
        );

        return resultado.novaVia();
    }

    /*
     * =========================================================================
     * CANCELAMENTO
     * =========================================================================
     */

    @Transactional
    public CadernoChoroResponse cancelar(
            Long eventoId,
            Long cadernoId,
            CadernoChoroCancelarRequest request
    ) {
        var caderno = buscarViaAtual(eventoId, cadernoId);
        var statusAnterior = caderno.getStatus();

        caderno.cancelar(
                request.motivo(),
                request.observacao()
        );

        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.CADERNO_CANCELADO,
                statusAnterior,
                caderno.getStatus(),
                request.motivo().name(),
                request.observacao()
        );

        return CadernoChoroResponse.from(caderno);
    }

    /*
     * Compatibilidade temporária com o endpoint atual.
     */
    @Transactional
    public CadernoChoroResponse cancelar(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        return cancelar(
                eventoId,
                cadernoId,
                new CadernoChoroCancelarRequest(
                        MotivoCancelamentoCaderno.OUTRO,
                        validarObservacaoLegada(
                                observacao,
                                "Informe uma observação sobre o cancelamento."
                        )
                )
        );
    }

    /*
     * Compatibilidade temporária com o endpoint /perdido.
     */
    @Transactional
    public CadernoChoroResponse marcarPerdido(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        return registrarOcorrencia(
                eventoId,
                cadernoId,
                new CadernoChoroOcorrenciaRequest(
                        TipoOcorrenciaCaderno.PERDA,
                        true,
                        validarObservacaoLegada(
                                observacao,
                                "Informe uma observação sobre a perda."
                        )
                )
        );
    }

    /*
     * =========================================================================
     * APOIO
     * =========================================================================
     */

    private void validarEncontristaPodeReceberNovaVia(
            CadernoChoro viaAnterior
    ) {
        if (viaAnterior.getSobrinho().getStatus()
                == SobrinhoStatus.DESISTENTE) {
            throw new BusinessException(
                    "Não é possível gerar uma nova via porque o encontrista " +
                            "está marcado como desistente."
            );
        }

        if (viaAnterior.getStatus()
                == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            throw new BusinessException(
                    "Não é possível substituir uma via já entregue ao " +
                            "encontrista."
            );
        }

        if (viaAnterior.getStatus()
                == StatusCadernoChoro.CANCELADO) {
            throw new BusinessException(
                    "Não é possível substituir uma via cancelada. A retomada " +
                            "da participação deverá gerar uma nova via por " +
                            "operação específica."
            );
        }

        if (viaAnterior.getStatus()
                == StatusCadernoChoro.SUBSTITUIDO) {
            throw new BusinessException(
                    "Esta via já foi substituída."
            );
        }
    }

    private MotivoEmissaoCaderno motivoEmissaoSubstituicao(
            MotivoSubstituicaoCaderno motivo
    ) {
        return switch (motivo) {
            case PERDA -> MotivoEmissaoCaderno.SUBSTITUICAO_PERDA;

            case DANO, CONTEUDO_INUTILIZADO -> MotivoEmissaoCaderno.SUBSTITUICAO_DANO;

            case ERRO_DE_IMPRESSAO, ERRO_DE_MONTAGEM -> MotivoEmissaoCaderno.SUBSTITUICAO_ERRO;

            case OUTRO -> MotivoEmissaoCaderno.OUTRO;
        };
    }

    private Map<Long, Long> carregarCargasAtuais(
            List<EquipeMontagemKit> equipes
    ) {
        var cargasPorEquipe = new HashMap<Long, Long>();

        for (var equipe : equipes) {
            cargasPorEquipe.put(
                    equipe.getId(),
                    repository
                            .countByEquipeMontagemKitIdAndViaAtualTrueAndStatusNotIn(
                                    equipe.getId(),
                                    STATUS_NAO_CONTAM_CARGA_EQUIPE
                            )
            );
        }

        return cargasPorEquipe;
    }

    private EquipeMontagemKit selecionarEquipeMenosCarregada(
            List<EquipeMontagemKit> equipes,
            Map<Long, Long> cargasPorEquipe
    ) {
        return equipes.stream()
                .min((equipe1, equipe2) -> {
                    var carga1 = cargasPorEquipe.getOrDefault(
                            equipe1.getId(),
                            0L
                    );

                    var carga2 = cargasPorEquipe.getOrDefault(
                            equipe2.getId(),
                            0L
                    );

                    var comparacaoCarga = Long.compare(
                            carga1,
                            carga2
                    );

                    if (comparacaoCarga != 0) {
                        return comparacaoCarga;
                    }

                    return Long.compare(
                            equipe1.getId(),
                            equipe2.getId()
                    );
                })
                .orElseThrow(() ->
                        new BusinessException(
                                "Nenhuma equipe de montagem do kit ativa " +
                                        "encontrada."
                        )
                );
    }

    private String observacaoEquipe(
            EquipeMontagemKit equipe,
            String observacao
    ) {
        var mensagem =
                "Caderno de Mensagens direcionado automaticamente para a " +
                        "equipe de montagem do kit: " +
                        equipe.getApelido() +
                        ".";

        if (observacao == null || observacao.isBlank()) {
            return mensagem;
        }

        return mensagem +
                " Observação: " +
                observacao.trim();
    }

    private void registrarHistorico(
            CadernoChoro caderno,
            TipoMovimentacaoCaderno tipoMovimentacao,
            StatusCadernoChoro statusAnterior,
            StatusCadernoChoro statusNovo,
            String motivo,
            String observacao
    ) {
        historicoRepository.save(
                new CadernoChoroHistorico(
                        caderno,
                        tipoMovimentacao,
                        statusAnterior,
                        statusNovo,
                        null,
                        null,
                        motivo,
                        observacao
                )
        );
    }

    private CadernoChoro buscarCaderno(
            Long eventoId,
            Long cadernoId
    ) {
        return repository.findByIdAndEventoId(
                        cadernoId,
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Caderno de Mensagens não encontrado neste " +
                                        "evento."
                        )
                );
    }

    private CadernoChoro buscarViaAtual(
            Long eventoId,
            Long cadernoId
    ) {
        var caderno = buscarCaderno(eventoId, cadernoId);

        if (!caderno.isViaAtual()) {
            throw new BusinessException(
                    "Esta não é a via atual do Caderno de Mensagens. " +
                            "Consulte a via mais recente para continuar."
            );
        }

        return caderno;
    }

    private void validarDuplaNoEvento(
            Long eventoId,
            Long duplaId
    ) {
        var dupla = duplaRepository.findById(duplaId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Dupla não encontrada."
                        )
                );

        if (!dupla.getEvento().getId().equals(eventoId)) {
            throw new BusinessException(
                    "Dupla não pertence ao evento informado."
            );
        }
    }

    private String validarObservacaoLegada(
            String observacao,
            String mensagem
    ) {
        if (observacao == null || observacao.isBlank()) {
            throw new BusinessException(mensagem);
        }

        return observacao.trim();
    }

    private String montarObservacaoSubstituicao(
            String observacao,
            Integer numeroNovaVia
    ) {
        return "Via encerrada como substituída pela Via " +
                numeroNovaVia +
                ". " +
                observacao.trim();
    }

    private String montarObservacaoNovaVia(
            Integer numeroViaAnterior,
            String observacao
    ) {
        return "Nova via gerada em substituição à Via " +
                numeroViaAnterior +
                ". O fluxo operacional foi reiniciado em PENDENTE. " +
                observacao.trim();
    }
}