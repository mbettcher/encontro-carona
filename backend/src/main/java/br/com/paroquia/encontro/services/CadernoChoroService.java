package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.*;
import br.com.paroquia.encontro.domain.enums.*;
import br.com.paroquia.encontro.dto.request.*;
import br.com.paroquia.encontro.dto.response.CadernoChoroGeracaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroHistoricoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroSubstituicaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroTimelineResponse;
import br.com.paroquia.encontro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashSet;
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
    private final TioCaronaEventoRepository tioCaronaEventoRepository;

    public CadernoChoroService(
            CadernoChoroRepository repository,
            CadernoChoroHistoricoRepository historicoRepository,
            EventoRepository eventoRepository,
            DuplaTioCaronaRepository duplaRepository,
            SobrinhoDuplaRepository sobrinhoDuplaRepository,
            EquipeMontagemKitRepository equipeMontagemKitRepository,
            TioCaronaEventoRepository tioCaronaEventoRepository
    ) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.eventoRepository = eventoRepository;
        this.duplaRepository = duplaRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
        this.equipeMontagemKitRepository =
                equipeMontagemKitRepository;
        this.tioCaronaEventoRepository = tioCaronaEventoRepository;
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
        return executarRegistroOcorrencia(
                eventoId,
                cadernoId,
                request
        );
    }

    /*
     * Endpoint legado.
     *
     * Continua sendo uma fronteira transacional, mas não chama outro método
     * público anotado com @Transactional.
     */
    @Transactional
    public CadernoChoroResponse marcarPerdido(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var request = new CadernoChoroOcorrenciaRequest(
                TipoOcorrenciaCaderno.PERDA,
                true,
                validarObservacaoLegada(
                        observacao,
                        "Informe uma observação sobre a perda."
                )
        );

        return executarRegistroOcorrencia(
                eventoId,
                cadernoId,
                request
        );
    }

    private CadernoChoroResponse executarRegistroOcorrencia(
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
        return executarSubstituicao(
                eventoId,
                cadernoId,
                request
        );
    }

    /*
     * Endpoint legado.
     *
     * Ele usa diretamente a implementação privada e retorna apenas a nova
     * via, mantendo o contrato utilizado pelo frontend atual.
     */
    @Transactional
    public CadernoChoroResponse marcarSubstituido(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var request = new CadernoChoroSubstituirRequest(
                MotivoSubstituicaoCaderno.OUTRO,
                validarObservacaoLegada(
                        observacao,
                        "Informe uma observação sobre a substituição."
                )
        );

        var resultado = executarSubstituicao(
                eventoId,
                cadernoId,
                request
        );

        return resultado.novaVia();
    }

    private CadernoChoroSubstituicaoResponse executarSubstituicao(
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
        var motivoEmissao =
                motivoEmissaoSubstituicao(request.motivo());

        /*
         * 1. Encerra a via anterior.
         */
        viaAnterior.marcarSubstituido(
                request.motivo(),
                request.observacao()
        );

        /*
         * 2. A via anterior deixa de ser a via atual.
         */
        viaAnterior.marcarComoViaAnterior();

        repository.save(viaAnterior);

        /*
         * Executa o UPDATE da via anterior antes do INSERT da nova via,
         * liberando a restrição parcial de via atual.
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
         * 5. Inicia a timeline da nova via.
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
        return executarCancelamento(
                eventoId,
                cadernoId,
                request
        );
    }

    /*
     * Endpoint legado.
     *
     * Também permanece como fronteira transacional própria, mas delega a
     * execução a um método privado não anotado.
     */
    @Transactional
    public CadernoChoroResponse cancelar(
            Long eventoId,
            Long cadernoId,
            String observacao
    ) {
        var request = new CadernoChoroCancelarRequest(
                MotivoCancelamentoCaderno.OUTRO,
                validarObservacaoLegada(
                        observacao,
                        "Informe uma observação sobre o cancelamento."
                )
        );

        return executarCancelamento(
                eventoId,
                cadernoId,
                request
        );
    }

    private CadernoChoroResponse executarCancelamento(
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

    /*
     * =========================================================================
     * INTEGRAÇÃO COM A PARTICIPAÇÃO DO ENCONTRISTA
     * =========================================================================
     */

    /**
     * Integra a desistência do encontrista com sua via atual.
     * <p>
     * Regras:
     * - sem caderno: nenhuma ação;
     * - já entregue ao encontrista: não altera o status;
     * - ainda não entregue: cancela automaticamente;
     * - se estava com a dupla: registra recolhimento físico pendente.
     */
    @Transactional
    public void registrarDesistenciaEncontrista(
            Long eventoId,
            Long sobrinhoId,
            String observacaoPresenca
    ) {
        var cadernoOpt =
                repository.findByEventoIdAndSobrinhoIdAndViaAtualTrue(
                        eventoId,
                        sobrinhoId
                );

        if (cadernoOpt.isEmpty()) {
            return;
        }

        var caderno = cadernoOpt.get();
        var statusAnterior = caderno.getStatus();
        var observacao = montarObservacaoDesistencia(
                caderno,
                observacaoPresenca
        );

        /*
         * O exemplar já foi entregue fisicamente ao encontrista.
         *
         * Não reescrevemos o resultado final da via. Apenas registramos
         * que a desistência aconteceu depois da entrega.
         */
        if (statusAnterior == StatusCadernoChoro.ENTREGUE_AO_SOBRINHO) {
            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.ENCONTRISTA_DESISTENTE,
                    statusAnterior,
                    statusAnterior,
                    MotivoCancelamentoCaderno.DESISTENCIA_ENCONTRISTA.name(),
                    observacao
            );

            return;
        }

        /*
         * Proteção contra repetição. O SobrinhoService já evita normalmente
         * esta chamada quando o status anterior também era DESISTENTE, mas
         * a operação permanece idempotente no serviço de cadernos.
         */
        if (statusAnterior == StatusCadernoChoro.CANCELADO) {
            return;
        }

        if (statusAnterior == StatusCadernoChoro.SUBSTITUIDO) {
            throw new BusinessException(
                    "A via atual não pode estar marcada como substituída."
            );
        }

        var estavaComDupla =
                statusAnterior == StatusCadernoChoro.ENTREGUE_A_DUPLA;

        /*
         * Primeiro registramos o fato administrativo da desistência.
         */
        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.ENCONTRISTA_DESISTENTE,
                statusAnterior,
                statusAnterior,
                MotivoCancelamentoCaderno.DESISTENCIA_ENCONTRISTA.name(),
                observacao
        );

        /*
         * Depois encerramos formalmente a via.
         */
        caderno.cancelar(
                MotivoCancelamentoCaderno.DESISTENCIA_ENCONTRISTA,
                observacao
        );

        if (estavaComDupla) {
            caderno.marcarRecolhimentoPendente();
        }

        registrarHistorico(
                caderno,
                TipoMovimentacaoCaderno.CADERNO_CANCELADO,
                statusAnterior,
                StatusCadernoChoro.CANCELADO,
                MotivoCancelamentoCaderno.DESISTENCIA_ENCONTRISTA.name(),
                estavaComDupla
                        ? observacao +
                          " O exemplar físico estava com a dupla e precisa ser recolhido."
                        : observacao
        );
    }

    /**
     * Gera uma nova via quando o encontrista retorna após ter desistido.
     * <p>
     * A via cancelada não é reaberta. Ela deixa de ser a via atual e uma
     * nova via é criada em PENDENTE, utilizando a dupla do vínculo ativo.
     */
    @Transactional
    public void registrarRetomadaParticipacao(
            Long eventoId,
            Long sobrinhoId,
            String observacaoPresenca
    ) {
        var viaAnteriorOpt =
                repository.findByEventoIdAndSobrinhoIdAndViaAtualTrue(
                        eventoId,
                        sobrinhoId
                );

        /*
         * O encontrista pode retomar antes da geração inicial dos cadernos.
         * Nesse caso, o processo normal de geração criará a Via 1 depois.
         */
        if (viaAnteriorOpt.isEmpty()) {
            return;
        }

        var viaAnterior = viaAnteriorOpt.get();

        /*
         * Uma retomada só gera nova via quando a última via foi cancelada
         * especificamente pela desistência.
         */
        if (viaAnterior.getStatus() != StatusCadernoChoro.CANCELADO
                || viaAnterior.getMotivoCancelamento()
                != MotivoCancelamentoCaderno.DESISTENCIA_ENCONTRISTA) {
            return;
        }

        var vinculoAtivo = sobrinhoDuplaRepository
                .findByEventoIdAndSobrinhoIdAndStatus(
                        eventoId,
                        sobrinhoId,
                        VinculoStatus.ATIVO
                )
                .orElseThrow(() ->
                        new BusinessException(
                                "Não é possível retomar o fluxo do Caderno de " +
                                        "Mensagens porque o encontrista não possui " +
                                        "vínculo ativo com uma dupla."
                        )
                );

        var duplaAtual = vinculoAtivo.getDupla();

        if (duplaAtual.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException(
                    "Não é possível gerar a nova via porque a dupla " +
                            "responsável está inativa."
            );
        }

        var observacao = montarObservacaoRetomada(
                viaAnterior,
                duplaAtual.getCodigo(),
                observacaoPresenca
        );

        /*
         * A via cancelada permanece histórica e deixa de ser a via atual.
         */
        viaAnterior.marcarComoViaAnterior();
        repository.save(viaAnterior);
        repository.flush();

        var novaVia = CadernoChoro.criarNovaVia(
                viaAnterior,
                duplaAtual,
                MotivoEmissaoCaderno.RETOMADA_PARTICIPACAO
        );

        repository.save(novaVia);

        /*
         * Registra a retomada na timeline da via encerrada.
         */
        registrarHistorico(
                viaAnterior,
                TipoMovimentacaoCaderno.PARTICIPACAO_RETOMADA,
                StatusCadernoChoro.CANCELADO,
                StatusCadernoChoro.CANCELADO,
                MotivoEmissaoCaderno.RETOMADA_PARTICIPACAO.name(),
                "Participação retomada. A Via " +
                        novaVia.getNumeroVia() +
                        " foi gerada para reiniciar o processo. " +
                        observacao
        );

        /*
         * A nova via possui timeline própria desde sua criação.
         */
        registrarHistorico(
                novaVia,
                TipoMovimentacaoCaderno.NOVA_VIA_GERADA,
                null,
                StatusCadernoChoro.PENDENTE,
                MotivoEmissaoCaderno.RETOMADA_PARTICIPACAO.name(),
                "Via gerada após retomada da participação. " +
                        "Via anterior: " +
                        viaAnterior.getNumeroVia() +
                        ". O fluxo foi reiniciado em PENDENTE. " +
                        observacao
        );
    }

    @Transactional
    public List<CadernoChoroResponse> entregarSelecionadosADupla(
            Long eventoId,
            Long duplaId,
            CadernoChoroOperacaoSelecionadaRequest request
    ) {
        var dupla = buscarDuplaAtiva(
                eventoId,
                duplaId
        );

        var tioRecebedor = buscarTioAtivoDaDupla(
                eventoId,
                dupla,
                request.tioCaronaEventoId()
        );

        var cadernos = buscarCadernosSelecionados(
                eventoId,
                request.cadernoIds()
        );

        validarCadernosParaEntrega(
                cadernos,
                duplaId
        );

        var observacao = montarObservacaoEntregaSelecionada(
                tioRecebedor,
                request.observacao()
        );

        for (var caderno : cadernos) {
            var statusAnterior = caderno.getStatus();

            caderno.entregarADupla(observacao);

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.ENTREGA_A_DUPLA,
                    statusAnterior,
                    caderno.getStatus(),
                    tioRecebedor,
                    null,
                    observacao
            );
        }

        return ordenarResponses(cadernos);
    }

    @Transactional
    public List<CadernoChoroResponse> receberSelecionadosDaDupla(
            Long eventoId,
            Long duplaId,
            CadernoChoroOperacaoSelecionadaRequest request
    ) {
        var dupla = buscarDuplaAtiva(
                eventoId,
                duplaId
        );

        var tioDevolvente = buscarTioAtivoDaDupla(
                eventoId,
                dupla,
                request.tioCaronaEventoId()
        );

        var cadernos = buscarCadernosSelecionados(
                eventoId,
                request.cadernoIds()
        );

        validarCadernosParaRecebimento(
                cadernos,
                duplaId
        );

        var equipes = equipeMontagemKitRepository
                .findByEventoIdAndStatusOrderByIdAsc(
                        eventoId,
                        StatusEquipeMontagemKit.ATIVA
                );

        if (equipes.isEmpty()) {
            throw new BusinessException(
                    "Cadastre ao menos uma equipe de montagem do kit ativa " +
                            "antes de receber Cadernos de Mensagens."
            );
        }

        var cargasPorEquipe = carregarCargasAtuais(equipes);

        for (var caderno : cadernos) {
            var observacaoRecebimento =
                    montarObservacaoRecebimentoSelecionado(
                            tioDevolvente,
                            request.observacao()
                    );

            var statusAntesRecebimento = caderno.getStatus();

            caderno.receberDaDupla(observacaoRecebimento);

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.RECEBIMENTO_DA_DUPLA,
                    statusAntesRecebimento,
                    caderno.getStatus(),
                    tioDevolvente,
                    null,
                    observacaoRecebimento
            );

            var equipe = selecionarEquipeMenosCarregada(
                    equipes,
                    cargasPorEquipe
            );

            var statusAntesDirecionamento = caderno.getStatus();

            var observacaoDirecionamento =
                    observacaoEquipe(
                            equipe,
                            request.observacao()
                    );

            caderno.direcionarEquipeMontagem(
                    equipe,
                    observacaoDirecionamento
            );

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.DIRECIONAMENTO_EQUIPE,
                    statusAntesDirecionamento,
                    caderno.getStatus(),
                    null,
                    null,
                    observacaoDirecionamento
            );

            cargasPorEquipe.compute(
                    equipe.getId(),
                    (id, cargaAtual) ->
                            cargaAtual == null
                                    ? 1L
                                    : cargaAtual + 1L
            );
        }

        return ordenarResponses(cadernos);
    }

    @Transactional
    public List<CadernoChoroResponse> recolherCanceladosDaDupla(
            Long eventoId,
            Long duplaId,
            CadernoChoroOperacaoSelecionadaRequest request
    ) {
        var dupla = buscarDuplaAtiva(
                eventoId,
                duplaId
        );

        var tioDevolvente = buscarTioAtivoDaDupla(
                eventoId,
                dupla,
                request.tioCaronaEventoId()
        );

        var cadernos = buscarCadernosSelecionados(
                eventoId,
                request.cadernoIds()
        );

        validarCadernosParaRecolhimento(
                cadernos,
                duplaId
        );

        var observacao = montarObservacaoRecolhimento(
                tioDevolvente,
                request.observacao()
        );

        for (var caderno : cadernos) {
            /*
             * O status permanece CANCELADO. A movimentação registra somente
             * a conclusão do recolhimento físico.
             */
            caderno.concluirRecolhimento();

            registrarHistorico(
                    caderno,
                    TipoMovimentacaoCaderno.RECOLHIMENTO_CONCLUIDO,
                    StatusCadernoChoro.CANCELADO,
                    StatusCadernoChoro.CANCELADO,
                    tioDevolvente,
                    null,
                    observacao
            );
        }

        return ordenarResponses(cadernos);
    }

    private void registrarHistorico(
            CadernoChoro caderno,
            TipoMovimentacaoCaderno tipoMovimentacao,
            StatusCadernoChoro statusAnterior,
            StatusCadernoChoro statusNovo,
            String motivo,
            String observacao
    ) {
        registrarHistorico(
                caderno,
                tipoMovimentacao,
                statusAnterior,
                statusNovo,
                null,
                motivo,
                observacao
        );
    }

    private void registrarHistorico(
            CadernoChoro caderno,
            TipoMovimentacaoCaderno tipoMovimentacao,
            StatusCadernoChoro statusAnterior,
            StatusCadernoChoro statusNovo,
            TioCaronaEvento tioCaronaEvento,
            String motivo,
            String observacao
    ) {
        historicoRepository.save(
                new CadernoChoroHistorico(
                        caderno,
                        tipoMovimentacao,
                        statusAnterior,
                        statusNovo,
                        tioCaronaEvento,
                        null,
                        motivo,
                        observacao
                )
        );
    }

    private String montarObservacaoDesistencia(
            CadernoChoro caderno,
            String observacaoPresenca
    ) {
        var mensagem =
                "Encontrista marcado como desistente. " +
                        "Situação da Via " +
                        caderno.getNumeroVia() +
                        " no momento da desistência: " +
                        caderno.getStatus() +
                        ".";

        return concatenarObservacao(
                mensagem,
                observacaoPresenca
        );
    }

    private String montarObservacaoRetomada(
            CadernoChoro viaAnterior,
            String codigoDuplaAtual,
            String observacaoPresenca
    ) {
        var mensagem =
                "Encontrista retomou a participação. " +
                        "A Via " +
                        viaAnterior.getNumeroVia() +
                        " permanece cancelada. " +
                        "Nova dupla responsável: " +
                        codigoDuplaAtual +
                        ".";

        return concatenarObservacao(
                mensagem,
                observacaoPresenca
        );
    }

    private String concatenarObservacao(
            String mensagem,
            String observacao
    ) {
        if (observacao == null || observacao.isBlank()) {
            return mensagem;
        }

        return mensagem +
                " Observação da presença: " +
                observacao.trim();
    }

    private DuplaTioCarona buscarDuplaAtiva(
            Long eventoId,
            Long duplaId
    ) {
        var dupla = duplaRepository.findByIdAndEventoId(
                        duplaId,
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Dupla não encontrada neste evento."
                        )
                );

        if (dupla.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException(
                    "Não é possível realizar a operação com uma dupla inativa."
            );
        }

        return dupla;
    }

    private TioCaronaEvento buscarTioAtivoDaDupla(
            Long eventoId,
            DuplaTioCarona dupla,
            Long tioCaronaEventoId
    ) {
        var tio = tioCaronaEventoRepository
                .findByIdAndEventoId(
                        tioCaronaEventoId,
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Tio carona não encontrado neste evento."
                        )
                );

        if (tio.getStatus() != TioCaronaStatus.ATIVO) {
            throw new BusinessException(
                    "O tio carona informado está inativo."
            );
        }

        var pertenceADupla =
                dupla.getTio1().getId().equals(tio.getId())
                        || dupla.getTio2().getId().equals(tio.getId());

        if (!pertenceADupla) {
            throw new BusinessException(
                    "O tio carona informado não pertence à dupla selecionada."
            );
        }

        return tio;
    }

    private List<CadernoChoro> buscarCadernosSelecionados(
            Long eventoId,
            List<Long> cadernoIds
    ) {
        if (cadernoIds == null || cadernoIds.isEmpty()) {
            throw new BusinessException(
                    "Selecione ao menos um Caderno de Mensagens."
            );
        }

        var idsUnicos = new LinkedHashSet<Long>();

        for (var cadernoId : cadernoIds) {
            if (cadernoId == null) {
                throw new BusinessException(
                        "A seleção contém um ID de caderno inválido."
                );
            }

            if (!idsUnicos.add(cadernoId)) {
                throw new BusinessException(
                        "O Caderno de Mensagens " +
                                cadernoId +
                                " foi selecionado mais de uma vez."
                );
            }
        }

        var cadernos = repository.findByEventoIdAndIdIn(
                eventoId,
                idsUnicos
        );

        if (cadernos.size() != idsUnicos.size()) {
            var idsEncontrados = cadernos.stream()
                    .map(CadernoChoro::getId)
                    .collect(java.util.stream.Collectors.toSet());

            var idsNaoEncontrados = idsUnicos.stream()
                    .filter(id -> !idsEncontrados.contains(id))
                    .toList();

            throw new ResourceNotFoundException(
                    "Um ou mais Cadernos de Mensagens não foram encontrados " +
                            "neste evento. IDs: " +
                            idsNaoEncontrados
            );
        }

        return cadernos;
    }

    private void validarCadernosParaEntrega(
            List<CadernoChoro> cadernos,
            Long duplaId
    ) {
        for (var caderno : cadernos) {
            validarViaAtual(caderno);
            validarDuplaDoCaderno(
                    caderno,
                    duplaId
            );

            if (caderno.getStatus() != StatusCadernoChoro.PENDENTE) {
                throw new BusinessException(
                        identificarCaderno(caderno) +
                                " não está pendente. Status atual: " +
                                caderno.getStatus() +
                                "."
                );
            }

            if (caderno.getSobrinho().getStatus()
                    == SobrinhoStatus.DESISTENTE) {
                throw new BusinessException(
                        identificarCaderno(caderno) +
                                " pertence a um encontrista desistente."
                );
            }
        }
    }

    private void validarCadernosParaRecebimento(
            List<CadernoChoro> cadernos,
            Long duplaId
    ) {
        for (var caderno : cadernos) {
            validarViaAtual(caderno);
            validarDuplaDoCaderno(
                    caderno,
                    duplaId
            );

            if (caderno.getStatus()
                    != StatusCadernoChoro.ENTREGUE_A_DUPLA) {
                throw new BusinessException(
                        identificarCaderno(caderno) +
                                " não está entregue à dupla. Status atual: " +
                                caderno.getStatus() +
                                "."
                );
            }
        }
    }

    private void validarCadernosParaRecolhimento(
            List<CadernoChoro> cadernos,
            Long duplaId
    ) {
        for (var caderno : cadernos) {
            validarViaAtual(caderno);
            validarDuplaDoCaderno(
                    caderno,
                    duplaId
            );

            if (caderno.getStatus()
                    != StatusCadernoChoro.CANCELADO) {
                throw new BusinessException(
                        identificarCaderno(caderno) +
                                " não está cancelado."
                );
            }

            if (!caderno.isRecolhimentoPendente()) {
                throw new BusinessException(
                        identificarCaderno(caderno) +
                                " não possui recolhimento físico pendente."
                );
            }
        }
    }

    private void validarViaAtual(
            CadernoChoro caderno
    ) {
        if (!caderno.isViaAtual()) {
            throw new BusinessException(
                    identificarCaderno(caderno) +
                            " não é a via atual."
            );
        }
    }

    private void validarDuplaDoCaderno(
            CadernoChoro caderno,
            Long duplaId
    ) {
        if (!caderno.getDupla().getId().equals(duplaId)) {
            throw new BusinessException(
                    identificarCaderno(caderno) +
                            " não pertence à dupla selecionada."
            );
        }
    }

    private String identificarCaderno(
            CadernoChoro caderno
    ) {
        return "Caderno " +
                caderno.getId() +
                ", Via " +
                caderno.getNumeroVia() +
                ", encontrista " +
                caderno.getSobrinho().getNome();
    }

    private String montarObservacaoEntregaSelecionada(
            TioCaronaEvento tioRecebedor,
            String observacao
    ) {
        var mensagem =
                "Caderno entregue à dupla. Recebedor: " +
                        tioRecebedor.getPessoa().getNome() +
                        ".";

        return concatenarObservacaoOperacional(
                mensagem,
                observacao
        );
    }

    private String montarObservacaoRecebimentoSelecionado(
            TioCaronaEvento tioDevolvente,
            String observacao
    ) {
        var mensagem =
                "Caderno recebido de volta da dupla. Entregue à equipe por: " +
                        tioDevolvente.getPessoa().getNome() +
                        ".";

        return concatenarObservacaoOperacional(
                mensagem,
                observacao
        );
    }

    private String montarObservacaoRecolhimento(
            TioCaronaEvento tioDevolvente,
            String observacao
    ) {
        var mensagem =
                "Recolhimento físico concluído. Caderno cancelado devolvido por: " +
                        tioDevolvente.getPessoa().getNome() +
                        ".";

        return concatenarObservacaoOperacional(
                mensagem,
                observacao
        );
    }

    private String concatenarObservacaoOperacional(
            String mensagem,
            String observacao
    ) {
        if (observacao == null || observacao.isBlank()) {
            return mensagem;
        }

        return mensagem +
                " Observação: " +
                observacao.trim();
    }

    private List<CadernoChoroResponse> ordenarResponses(
            List<CadernoChoro> cadernos
    ) {
        return cadernos.stream()
                .sorted(
                        java.util.Comparator
                                .comparing(
                                        (CadernoChoro caderno) ->
                                                caderno.getSobrinho().getNome(),
                                        String.CASE_INSENSITIVE_ORDER
                                )
                                .thenComparing(
                                        CadernoChoro::getNumeroVia
                                )
                )
                .map(CadernoChoroResponse::from)
                .toList();
    }
}