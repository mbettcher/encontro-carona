package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import br.com.paroquia.encontro.dto.request.DuplaTioCaronaRequest;
import br.com.paroquia.encontro.dto.response.DuplaTioCaronaResponse;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DuplaTioCaronaService {
    private final DuplaTioCaronaRepository repository;
    private final EventoRepository eventoRepository;
    private final TioCaronaEventoRepository tioRepository;
    private final SobrinhoDuplaRepository sobrinhoDuplaRepository;
    private final CadernoChoroRepository cadernoChoroRepository;

    public DuplaTioCaronaService(
            DuplaTioCaronaRepository repository,
            EventoRepository eventoRepository,
            TioCaronaEventoRepository tioRepository,
            SobrinhoDuplaRepository sobrinhoDuplaRepository,
            CadernoChoroRepository cadernoChoroRepository
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.tioRepository = tioRepository;
        this.sobrinhoDuplaRepository = sobrinhoDuplaRepository;
        this.cadernoChoroRepository = cadernoChoroRepository;
    }

    @Transactional(readOnly = true)
    public List<DuplaTioCaronaResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByCodigo(eventoId)
                .stream()
                .map(DuplaTioCaronaResponse::from)
                .toList();
    }

    @Transactional
    public DuplaTioCaronaResponse criar(Long eventoId, DuplaTioCaronaRequest request) {
        if (request.tio1Id().equals(request.tio2Id())) {
            throw new BusinessException("A dupla deve ser formada por dois tios carona diferentes.");
        }

        var evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));

        var tio1 = tioRepository.findByIdAndEventoId(request.tio1Id(), eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tio carona 1 não encontrado neste evento."));

        var tio2 = tioRepository.findByIdAndEventoId(request.tio2Id(), eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Tio carona 2 não encontrado neste evento."));

        validarTioPodeFormarDupla(eventoId, tio1, "Tio carona 1");
        validarTioPodeFormarDupla(eventoId, tio2, "Tio carona 2");

        var codigo = "DUP-" + eventoId + "-" + System.currentTimeMillis();

        return DuplaTioCaronaResponse.from(
                repository.save(new DuplaTioCarona(
                        evento,
                        tio1,
                        tio2,
                        codigo,
                        normalizarTextoOpcional(request.apelido())
                ))
        );
    }

    @Transactional
    public DuplaTioCaronaResponse inativar(Long eventoId, Long duplaId) {
        var dupla = buscarDupla(eventoId, duplaId);

        if (sobrinhoDuplaRepository.existsByEventoIdAndDuplaIdAndStatus(
                eventoId,
                duplaId,
                VinculoStatus.ATIVO
        )) {
            throw new BusinessException("Não é possível inativar uma dupla com vínculos ativos. Remova os vínculos antes de inativar a dupla.");
        }

        dupla.inativar();

        return DuplaTioCaronaResponse.from(dupla);
    }

    @Transactional
    public DuplaTioCaronaResponse reativar(Long eventoId, Long duplaId) {
        var dupla = buscarDupla(eventoId, duplaId);

        validarTioPodeReativarDupla(eventoId, duplaId, dupla.getTio1(), "Tio carona 1");
        validarTioPodeReativarDupla(eventoId, duplaId, dupla.getTio2(), "Tio carona 2");

        dupla.reativar();

        return DuplaTioCaronaResponse.from(dupla);
    }

    private DuplaTioCarona buscarDupla(Long eventoId, Long duplaId) {
        return repository.findByIdAndEventoId(duplaId, eventoId)
                .orElseThrow(() -> new ResourceNotFoundException("Dupla não encontrada neste evento."));
    }

    private void validarTioPodeFormarDupla(
            Long eventoId,
            TioCaronaEvento tio,
            String campo
    ) {
        if (tio.getStatus() != TioCaronaStatus.ATIVO) {
            throw new BusinessException(campo + " está inativo e não pode formar dupla.");
        }

        if (repository.existsTioEmDuplaComStatus(eventoId, tio.getId(), DuplaStatus.ATIVA)) {
            throw new BusinessException(campo + " já está em uma dupla ativa neste evento.");
        }
    }

    private void validarTioPodeReativarDupla(
            Long eventoId,
            Long duplaId,
            TioCaronaEvento tio,
            String campo
    ) {
        if (tio.getStatus() != TioCaronaStatus.ATIVO) {
            throw new BusinessException(campo + " está inativo e a dupla não pode ser reativada.");
        }

        if (repository.existsTioEmOutraDuplaComStatus(
                eventoId,
                tio.getId(),
                duplaId,
                DuplaStatus.ATIVA
        )) {
            throw new BusinessException(campo + " já está em outra dupla ativa neste evento.");
        }
    }

    private String normalizarTextoOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}