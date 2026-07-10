package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import br.com.paroquia.encontro.dto.request.DuplaTioCaronaRequest;
import br.com.paroquia.encontro.dto.response.DuplaTioCaronaResponse;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DuplaTioCaronaService {
    private final DuplaTioCaronaRepository repository;
    private final EventoRepository eventoRepository;
    private final TioCaronaEventoRepository tioRepository;

    public DuplaTioCaronaService(
            DuplaTioCaronaRepository repository,
            EventoRepository eventoRepository,
            TioCaronaEventoRepository tioRepository
    ) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.tioRepository = tioRepository;
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

    private String normalizarTextoOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}