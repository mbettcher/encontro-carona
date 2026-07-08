package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.dto.request.VincularSobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoDuplaResponse;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoDuplaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import br.com.paroquia.encontro.domain.entity.SobrinhoDupla;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SobrinhoDuplaService {
    private final SobrinhoDuplaRepository repository;
    private final EventoRepository eventoRepository;
    private final SobrinhoRepository sobrinhoRepository;
    private final DuplaTioCaronaRepository duplaRepository;

    public SobrinhoDuplaService(SobrinhoDuplaRepository repository, EventoRepository eventoRepository, SobrinhoRepository sobrinhoRepository, DuplaTioCaronaRepository duplaRepository) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.sobrinhoRepository = sobrinhoRepository;
        this.duplaRepository = duplaRepository;
    }

    @Transactional(readOnly = true)
    public List<SobrinhoDuplaResponse> listarPorDupla(Long eventoId, Long duplaId) {
        return repository.findByEventoIdAndDuplaIdAndStatusOrderBySobrinhoNome(eventoId, duplaId, VinculoStatus.ATIVO).stream().map(SobrinhoDuplaResponse::from).toList();
    }

    @Transactional
    public SobrinhoDuplaResponse vincular(Long eventoId, VincularSobrinhoRequest request) {
        if (repository.existsByEventoIdAndSobrinhoIdAndStatus(eventoId, request.sobrinhoId(), VinculoStatus.ATIVO))
            throw new BusinessException("Este sobrinho já está vinculado a uma dupla ativa neste evento.");
        var evento = eventoRepository.findById(eventoId).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        var sobrinho = sobrinhoRepository.findById(request.sobrinhoId()).orElseThrow(() -> new ResourceNotFoundException("Sobrinho não encontrado."));
        var dupla = duplaRepository.findById(request.duplaId()).orElseThrow(() -> new ResourceNotFoundException("Dupla não encontrada."));
        return SobrinhoDuplaResponse.from(repository.save(new SobrinhoDupla(evento, sobrinho, dupla)));
    }
}
