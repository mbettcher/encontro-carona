package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import br.com.paroquia.encontro.domain.entity.SobrinhoDupla;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.TipoMovimentacaoCaderno;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.request.SubstituirDuplaVinculoRequest;
import br.com.paroquia.encontro.dto.request.TrocarDuplaVinculoRequest;
import br.com.paroquia.encontro.dto.request.VincularSobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoDuplaResponse;
import br.com.paroquia.encontro.repository.CadernoChoroHistoricoRepository;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SobrinhoDuplaService {

    private final SobrinhoDuplaRepository repository;
    private final EventoRepository eventoRepository;
    private final SobrinhoRepository sobrinhoRepository;
    private final DuplaTioCaronaRepository duplaRepository;
    private final CadernoChoroRepository cadernoChoroRepository;
    private final CadernoChoroHistoricoRepository
            cadernoChoroHistoricoRepository;

    public SobrinhoDuplaService(
            SobrinhoDuplaRepository repository,
            EventoRepository eventoRepository,
            SobrinhoRepository sobrinhoRepository,
            DuplaTioCaronaRepository duplaRepository,
            CadernoChoroRepository cadernoChoroRepository,
            CadernoChoroHistoricoRepository
                    cadernoChoroHistoricoRepository
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.sobrinhoRepository = sobrinhoRepository;
        this.duplaRepository = duplaRepository;
        this.cadernoChoroRepository = cadernoChoroRepository;
        this.cadernoChoroHistoricoRepository =
                cadernoChoroHistoricoRepository;
    }

    @Transactional(readOnly = true)
    public List<SobrinhoDuplaResponse> listar(Long eventoId) {
        return repository
                .findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(
                        eventoId
                )
                .stream()
                .map(SobrinhoDuplaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SobrinhoDuplaResponse> listarPorDupla(
            Long eventoId,
            Long duplaId
    ) {
        return repository
                .findByEventoIdAndDuplaIdAndStatusOrderBySobrinhoNome(
                        eventoId,
                        duplaId,
                        VinculoStatus.ATIVO
                )
                .stream()
                .map(SobrinhoDuplaResponse::from)
                .toList();
    }

    @Transactional
    public SobrinhoDuplaResponse vincular(
            Long eventoId,
            VincularSobrinhoRequest request
    ) {
        if (repository.existsByEventoIdAndSobrinhoIdAndStatus(
                eventoId,
                request.sobrinhoId(),
                VinculoStatus.ATIVO
        )) {
            throw new BusinessException(
                    "Este encontrista já está vinculado a uma dupla " +
                            "ativa neste evento."
            );
        }

        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Evento não encontrado."
                        )
                );

        var sobrinho = sobrinhoRepository
                .findByIdAndEventoId(
                        request.sobrinhoId(),
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Encontrista não encontrado neste evento."
                        )
                );

        var dupla = duplaRepository
                .findByIdAndEventoId(
                        request.duplaId(),
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Dupla não encontrada neste evento."
                        )
                );

        if (sobrinho.getStatus() == SobrinhoStatus.DESISTENTE) {
            throw new BusinessException(
                    "Encontrista desistente não pode ser vinculado " +
                            "a uma dupla."
            );
        }

        validarDuplaAtiva(dupla);

        return SobrinhoDuplaResponse.from(
                repository.save(
                        new SobrinhoDupla(
                                evento,
                                sobrinho,
                                dupla
                        )
                )
        );
    }

    @Transactional
    public SobrinhoDuplaResponse remover(
            Long eventoId,
            Long vinculoId
    ) {
        var vinculo = buscarVinculo(
                eventoId,
                vinculoId
        );

        if (cadernoChoroRepository.existsByEventoIdAndSobrinhoId(
                eventoId,
                vinculo.getSobrinho().getId()
        )) {
            throw new BusinessException(
                    "Não é possível remover o vínculo porque já existe " +
                            "Caderno de Mensagens gerado para este encontrista."
            );
        }

        vinculo.remover();

        return SobrinhoDuplaResponse.from(vinculo);
    }

    @Transactional
    public SobrinhoDuplaResponse reativar(
            Long eventoId,
            Long vinculoId
    ) {
        var vinculo = buscarVinculo(
                eventoId,
                vinculoId
        );

        validarDuplaAtiva(vinculo.getDupla());

        if (vinculo.getSobrinho().getStatus()
                == SobrinhoStatus.DESISTENTE) {
            throw new BusinessException(
                    "Não é possível reativar vínculo de encontrista desistente."
            );
        }

        if (repository.existsByEventoIdAndSobrinhoIdAndStatusAndIdNot(
                eventoId,
                vinculo.getSobrinho().getId(),
                VinculoStatus.ATIVO,
                vinculo.getId()
        )) {
            throw new BusinessException(
                    "Este encontrista já possui outro vínculo ativo " +
                            "neste evento."
            );
        }

        vinculo.reativar();

        return SobrinhoDuplaResponse.from(vinculo);
    }

    /**
     * Troca simples permitida somente antes de qualquer caderno ter
     * sido gerado.
     */
    @Transactional
    public SobrinhoDuplaResponse trocarDupla(
            Long eventoId,
            Long vinculoId,
            TrocarDuplaVinculoRequest request
    ) {
        var vinculo = buscarVinculoAtivo(
                eventoId,
                vinculoId
        );

        if (cadernoChoroRepository.existsByEventoIdAndSobrinhoId(
                eventoId,
                vinculo.getSobrinho().getId()
        )) {
            throw new BusinessException(
                    "Já existe Caderno de Mensagens para este encontrista. " +
                            "Utilize a operação Substituir dupla para " +
                            "preservar a timeline."
            );
        }

        var novaDupla = buscarNovaDuplaAtiva(
                eventoId,
                request.duplaId(),
                vinculo
        );

        vinculo.trocarDupla(novaDupla);

        return SobrinhoDuplaResponse.from(vinculo);
    }

    /**
     * Substitui a dupla mantendo o histórico do Caderno de Mensagens.
     * <p>
     * Regras:
     * - PENDENTE: muda a dupla e permanece PENDENTE;
     * - ENTREGUE_A_DUPLA: exige devolução e volta para PENDENTE;
     * - etapas internas: muda a referência sem reiniciar o fluxo;
     * - via finalizada: não altera o exemplar histórico, apenas o vínculo;
     * - uma nova via futura usará a dupla deste vínculo.
     */
    @Transactional
    public SobrinhoDuplaResponse substituirDupla(
            Long eventoId,
            Long vinculoId,
            SubstituirDuplaVinculoRequest request
    ) {
        var vinculo = buscarVinculoAtivo(
                eventoId,
                vinculoId
        );

        var novaDupla = buscarNovaDuplaAtiva(
                eventoId,
                request.novaDuplaId(),
                vinculo
        );

        var duplaAnterior = vinculo.getDupla();
        var motivo = request.motivo().trim();

        var cadernoOpt = cadernoChoroRepository
                .findByEventoIdAndSobrinhoIdAndViaAtualTrue(
                        eventoId,
                        vinculo.getSobrinho().getId()
                );

        /*
         * Sem caderno, somente o vínculo precisa ser alterado.
         */
        if (cadernoOpt.isEmpty()) {
            vinculo.trocarDupla(novaDupla);

            return SobrinhoDuplaResponse.from(vinculo);
        }

        var caderno = cadernoOpt.get();
        var statusAnterior = caderno.getStatus();

        validarDevolucaoQuandoNecessaria(
                caderno,
                request.cadernoDevolvidoConfirmado()
        );

        var observacao = montarObservacaoSubstituicaoDupla(
                duplaAnterior.getCodigo(),
                novaDupla.getCodigo(),
                motivo,
                statusAnterior,
                request.cadernoDevolvidoConfirmado(),
                caderno.isFinalizado()
        );

        /*
         * Uma via encerrada não deve ter sua dupla histórica reescrita.
         *
         * Alteramos apenas o vínculo. A próxima via utilizará a nova dupla.
         */
        if (!caderno.isFinalizado()) {
            caderno.substituirDuplaResponsavel(
                    novaDupla,
                    observacao,
                    request.cadernoDevolvidoConfirmado()
            );
        }

        vinculo.trocarDupla(novaDupla);

        registrarHistoricoTrocaDupla(
                caderno,
                statusAnterior,
                motivo,
                observacao
        );

        return SobrinhoDuplaResponse.from(vinculo);
    }

    private void registrarHistoricoTrocaDupla(
            CadernoChoro caderno,
            StatusCadernoChoro statusAnterior,
            String motivo,
            String observacao
    ) {
        cadernoChoroHistoricoRepository.save(
                new CadernoChoroHistorico(
                        caderno,
                        TipoMovimentacaoCaderno.DUPLA_ALTERADA,
                        statusAnterior,
                        caderno.getStatus(),
                        null,
                        null,
                        motivo,
                        observacao
                )
        );
    }

    private void validarDevolucaoQuandoNecessaria(
            CadernoChoro caderno,
            boolean devolucaoConfirmada
    ) {
        if (caderno.getStatus()
                == StatusCadernoChoro.ENTREGUE_A_DUPLA
                && !devolucaoConfirmada) {
            throw new BusinessException(
                    "Para substituir a dupla, confirme que o Caderno " +
                            "de Mensagens foi devolvido pela dupla anterior " +
                            "à equipe organizadora."
            );
        }
    }

    private SobrinhoDupla buscarVinculo(
            Long eventoId,
            Long vinculoId
    ) {
        return repository.findByIdAndEventoId(
                        vinculoId,
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Vínculo não encontrado neste evento."
                        )
                );
    }

    private SobrinhoDupla buscarVinculoAtivo(
            Long eventoId,
            Long vinculoId
    ) {
        var vinculo = buscarVinculo(
                eventoId,
                vinculoId
        );

        if (vinculo.getStatus() != VinculoStatus.ATIVO) {
            throw new BusinessException(
                    "Somente vínculos ativos podem trocar de dupla."
            );
        }

        return vinculo;
    }

    private DuplaTioCarona buscarNovaDuplaAtiva(
            Long eventoId,
            Long novaDuplaId,
            SobrinhoDupla vinculo
    ) {
        var novaDupla = duplaRepository
                .findByIdAndEventoId(
                        novaDuplaId,
                        eventoId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Nova dupla não encontrada neste evento."
                        )
                );

        validarDuplaAtiva(novaDupla);

        if (novaDupla.getId().equals(
                vinculo.getDupla().getId()
        )) {
            throw new BusinessException(
                    "O encontrista já está vinculado a esta dupla."
            );
        }

        return novaDupla;
    }

    private void validarDuplaAtiva(
            DuplaTioCarona dupla
    ) {
        if (dupla.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException(
                    "Não é possível utilizar uma dupla inativa."
            );
        }
    }

    private String montarObservacaoSubstituicaoDupla(
            String codigoDuplaAnterior,
            String codigoNovaDupla,
            String motivo,
            StatusCadernoChoro statusAnterior,
            boolean cadernoDevolvidoConfirmado,
            boolean viaFinalizada
    ) {
        var observacao =
                "Dupla responsável pelo encontrista alterada. " +
                        "Dupla anterior: " +
                        codigoDuplaAnterior +
                        ". Nova dupla: " +
                        codigoNovaDupla +
                        ". Status da via no momento da alteração: " +
                        statusAnterior +
                        ". Motivo: " +
                        motivo +
                        ".";

        if (viaFinalizada) {
            observacao +=
                    " A via histórica não foi modificada. " +
                            "A nova dupla será utilizada em uma futura via.";
        }

        if (statusAnterior
                == StatusCadernoChoro.ENTREGUE_A_DUPLA
                && cadernoDevolvidoConfirmado) {
            observacao +=
                    " Foi confirmado que o Caderno de Mensagens " +
                            "foi devolvido pela dupla anterior. A via " +
                            "voltou para PENDENTE e deverá ser entregue " +
                            "formalmente à nova dupla.";
        }

        return observacao;
    }
}