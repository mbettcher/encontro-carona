package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.dto.request.SobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoResponse;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SobrinhoService {
    private final SobrinhoRepository repository;
    private final EventoRepository eventoRepository;

    public SobrinhoService(SobrinhoRepository repository, EventoRepository eventoRepository) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
    }

    @Transactional(readOnly = true)
    public List<SobrinhoResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByNome(eventoId).stream().map(SobrinhoResponse::from).toList();
    }

    @Transactional
    public SobrinhoResponse criar(Long eventoId, SobrinhoRequest request) {
        var evento = eventoRepository.findById(eventoId).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        return SobrinhoResponse.from(repository.save(new Sobrinho(evento, request.nome(), request.telefone(), request.responsavelNome(), request.responsavelTelefone(), request.endereco(), request.dataNascimento(), request.restricaoAlimentar(), request.observacaoMedica())));
    }
}
