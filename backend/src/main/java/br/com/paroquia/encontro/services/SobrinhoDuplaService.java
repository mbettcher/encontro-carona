package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.SobrinhoDupla;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.request.VincularSobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoDuplaResponse;
import br.com.paroquia.encontro.repository.*;
import br.com.paroquia.encontro.dto.request.TrocarDuplaVinculoRequest;
import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.request.SubstituirDuplaVinculoRequest;

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
    private final CadernoChoroHistoricoRepository cadernoChoroHistoricoRepository;

    public SobrinhoDuplaService(
            SobrinhoDuplaRepository repository,
            EventoRepository eventoRepository,
            SobrinhoRepository sobrinhoRepository,
            DuplaTioCaronaRepository duplaRepository,
            CadernoChoroRepository cadernoChoroRepository,
            CadernoChoroHistoricoRepository cadernoChoroHistoricoRepository
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.sobrinhoRepository = sobrinhoRepository;
        this.duplaRepository = duplaRepository;
        this.cadernoChoroRepository = cadernoChoroRepository;
        this.cadernoChoroHistoricoRepository = cadernoChoroHistoricoRepository;
    }

    @Transactional(readOnly = true)
    public List<SobrinhoDuplaResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(eventoId)
                .stream()
                .map(SobrinhoDuplaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SobrinhoDuplaResponse> listarPorDupla(Long eventoId, Long duplaId) {
        return repository.findByEventoIdAndDuplaIdAndStatusOrderBySobrinhoNome(
                        eventoId,
                        duplaId,
                        VinculoStatus.ATIVO
                )
                .stream()
                .map(SobrinhoDuplaResponse::from)
                .toList();
    }

    @Transactional
    public SobrinhoDuplaResponse vincular(Long eventoId, VincularSobrinhoRequest request) {
        if (repository.existsByEventoIdAndSobrinhoIdAndStatus(
                eventoId,
                request.sobrinhoId(),
                VinculoStatus.ATIVO
        )) {
            throw new BusinessException("Este sobrinho já está vinculado a uma dupla ativa neste evento.");
        }

        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var sobrinho = sobrinhoRepository.findByIdAndEventoId(request.sobrinhoId(), eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Sobrinho não encontrado neste evento."));

        var dupla = duplaRepository.findByIdAndEventoId(request.duplaId(), eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dupla não encontrada neste evento."));

        if (sobrinho.getStatus() == SobrinhoStatus.DESISTENTE) {
            throw new BusinessException("Sobrinho desistente não pode ser vinculado a uma dupla.");
        }

        if (dupla.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException("Não é possível vincular sobrinho a uma dupla inativa.");
        }

        return SobrinhoDuplaResponse.from(
                repository.save(new SobrinhoDupla(evento, sobrinho, dupla))
        );
    }

    @Transactional
    public SobrinhoDuplaResponse remover(Long eventoId, Long vinculoId) {
        var vinculo = buscarVinculo(eventoId, vinculoId);

        if (cadernoChoroRepository.existsByEventoIdAndSobrinhoId(
                eventoId,
                vinculo.getSobrinho().getId()
        )) {
            throw new BusinessException("Não é possível remover o vínculo porque já existe Caderno de Mensagens gerado para este encontrista.");
        }

        vinculo.remover();

        return SobrinhoDuplaResponse.from(vinculo);
    }

    @Transactional
    public SobrinhoDuplaResponse reativar(Long eventoId, Long vinculoId) {
        var vinculo = buscarVinculo(eventoId, vinculoId);

        if (vinculo.getDupla().getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException("Não é possível reativar vínculo de uma dupla inativa.");
        }

        if (vinculo.getSobrinho().getStatus() == SobrinhoStatus.DESISTENTE) {
            throw new BusinessException("Não é possível reativar vínculo de sobrinho desistente.");
        }

        if (repository.existsByEventoIdAndSobrinhoIdAndStatusAndIdNot(
                eventoId,
                vinculo.getSobrinho().getId(),
                VinculoStatus.ATIVO,
                vinculo.getId()
        )) {
            throw new BusinessException("Este sobrinho já possui outro vínculo ativo neste evento.");
        }

        vinculo.reativar();

        return SobrinhoDuplaResponse.from(vinculo);
    }

    @Transactional
    public SobrinhoDuplaResponse trocarDupla(
            Long eventoId,
            Long vinculoId,
            TrocarDuplaVinculoRequest request
    ) {
        var vinculo = buscarVinculo(eventoId, vinculoId);

        if (vinculo.getStatus() != VinculoStatus.ATIVO) {
            throw new BusinessException("Somente vínculos ativos podem trocar de dupla.");
        }

        if (cadernoChoroRepository.existsByEventoIdAndSobrinhoId(
                eventoId,
                vinculo.getSobrinho().getId()
        )) {
            throw new BusinessException("Não é possível trocar a dupla do vínculo porque já existe Caderno de Mensagens gerado para este encontrista.");
        }

        var novaDupla = duplaRepository.findByIdAndEventoId(request.duplaId(), eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Nova dupla não encontrada neste evento."));

        if (novaDupla.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException("Não é possível trocar o vínculo para uma dupla inativa.");
        }

        if (novaDupla.getId().equals(vinculo.getDupla().getId())) {
            throw new BusinessException("O sobrinho já está vinculado a esta dupla.");
        }

        vinculo.trocarDupla(novaDupla);

        return SobrinhoDuplaResponse.from(vinculo);
    }

    @Transactional
    public SobrinhoDuplaResponse substituirDupla(
            Long eventoId,
            Long vinculoId,
            SubstituirDuplaVinculoRequest request
    ) {
        var vinculo = buscarVinculo(eventoId, vinculoId);

        if (vinculo.getStatus() != VinculoStatus.ATIVO) {
            throw new BusinessException("Somente vínculos ativos podem substituir a dupla responsável.");
        }

        var novaDupla = duplaRepository.findByIdAndEventoId(request.novaDuplaId(), eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Nova dupla não encontrada neste evento."));

        if (novaDupla.getStatus() != DuplaStatus.ATIVA) {
            throw new BusinessException("Não é possível substituir para uma dupla inativa.");
        }

        if (novaDupla.getId().equals(vinculo.getDupla().getId())) {
            throw new BusinessException("O sobrinho já está vinculado a esta dupla.");
        }

        var duplaAnterior = vinculo.getDupla();
        var motivoNormalizado = request.motivo().trim();

        var cadernoOpt = cadernoChoroRepository.findByEventoIdAndSobrinhoId(
                eventoId,
                vinculo.getSobrinho().getId()
        );

        if (cadernoOpt.isEmpty()) {
            vinculo.trocarDupla(novaDupla);
            return SobrinhoDuplaResponse.from(vinculo);
        }

        var caderno = cadernoOpt.get();
        var statusAnterior = caderno.getStatus();

        if (statusAnterior == StatusCadernoChoro.ENTREGUE_A_DUPLA && !request.cadernoDevolvidoConfirmado()) {
            throw new BusinessException("Para substituir a dupla, confirme que o Caderno de Mensagens foi devolvido pela dupla anterior à equipe organizadora.");
        }

        var observacaoHistorico = montarObservacaoSubstituicaoDupla(
                duplaAnterior.getCodigo(),
                novaDupla.getCodigo(),
                motivoNormalizado,
                statusAnterior,
                request.cadernoDevolvidoConfirmado()
        );

        caderno.substituirDuplaResponsavel(
                novaDupla,
                observacaoHistorico,
                request.cadernoDevolvidoConfirmado()
        );

        vinculo.trocarDupla(novaDupla);

        cadernoChoroHistoricoRepository.save(
                new CadernoChoroHistorico(
                        caderno,
                        caderno.getStatus(),
                        observacaoHistorico
                )
        );

        return SobrinhoDuplaResponse.from(vinculo);
    }

    private SobrinhoDupla buscarVinculo(Long eventoId, Long vinculoId) {
        return repository.findByIdAndEventoId(vinculoId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Vínculo não encontrado neste evento."));
    }

    private String montarObservacaoSubstituicaoDupla(
            String codigoDuplaAnterior,
            String codigoNovaDupla,
            String motivo,
            StatusCadernoChoro statusAnterior,
            boolean cadernoDevolvidoConfirmado
    ) {
        var observacao = "Dupla responsável substituída. "
                + "Dupla anterior: " + codigoDuplaAnterior
                + ". Nova dupla: " + codigoNovaDupla
                + ". Status anterior do caderno: " + statusAnterior
                + ". Motivo: " + motivo;

        if (statusAnterior == StatusCadernoChoro.ENTREGUE_A_DUPLA && cadernoDevolvidoConfirmado) {
            observacao += ". Foi confirmado que o Caderno de Mensagens foi devolvido pela dupla anterior à equipe organizadora.";
        }

        return observacao;
    }
}