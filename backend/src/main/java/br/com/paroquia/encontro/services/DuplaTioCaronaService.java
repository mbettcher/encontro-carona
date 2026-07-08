package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import br.com.paroquia.encontro.dto.request.DuplaTioCaronaRequest;
import br.com.paroquia.encontro.dto.response.DuplaTioCaronaResponse;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DuplaTioCaronaService {
    private final DuplaTioCaronaRepository repository;
    private final EventoRepository eventoRepository;
    private final TioCaronaEventoRepository tioRepository;

    public DuplaTioCaronaService(DuplaTioCaronaRepository repository, EventoRepository eventoRepository, TioCaronaEventoRepository tioRepository) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.tioRepository = tioRepository;
    }

    @Transactional(readOnly = true)
    public List<DuplaTioCaronaResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByCodigo(eventoId).stream().map(DuplaTioCaronaResponse::from).toList();
    }

    @Transactional
    public DuplaTioCaronaResponse criar(Long eventoId, DuplaTioCaronaRequest request) {
        if (request.tio1Id().equals(request.tio2Id()))
            throw new BusinessException("A dupla deve ser formada por dois tios carona diferentes.");
        var evento = eventoRepository.findById(eventoId).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        var tio1 = tioRepository.findById(request.tio1Id()).orElseThrow(() -> new ResourceNotFoundException("Tio carona 1 não encontrado."));
        var tio2 = tioRepository.findById(request.tio2Id()).orElseThrow(() -> new ResourceNotFoundException("Tio carona 2 não encontrado."));
        var codigo = "DUP-" + eventoId + "-" + System.currentTimeMillis();
        return DuplaTioCaronaResponse.from(repository.save(new DuplaTioCarona(evento, tio1, tio2, codigo, request.apelido())));
    }
}
