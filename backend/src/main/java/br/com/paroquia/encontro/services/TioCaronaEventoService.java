package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.dto.request.TioCaronaEventoRequest;
import br.com.paroquia.encontro.dto.response.TioCaronaEventoResponse;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.PessoaRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TioCaronaEventoService {
    private final TioCaronaEventoRepository repository;
    private final EventoRepository eventoRepository;
    private final PessoaRepository pessoaRepository;

    public TioCaronaEventoService(TioCaronaEventoRepository repository, EventoRepository eventoRepository, PessoaRepository pessoaRepository) {
        this.repository = repository;
        this.eventoRepository = eventoRepository;
        this.pessoaRepository = pessoaRepository;
    }

    @Transactional(readOnly = true)
    public List<TioCaronaEventoResponse> listar(Long eventoId) {
        return repository.findByEventoIdOrderByPessoaNome(eventoId).stream().map(TioCaronaEventoResponse::from).toList();
    }

    @Transactional
    public TioCaronaEventoResponse adicionar(Long eventoId, TioCaronaEventoRequest request) {
        if (repository.existsByEventoIdAndPessoaId(eventoId, request.pessoaId()))
            throw new BusinessException("Esta pessoa já está cadastrada como tio carona neste evento.");
        var evento = eventoRepository.findById(eventoId).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        var pessoa = pessoaRepository.findById(request.pessoaId()).orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada."));
        return TioCaronaEventoResponse.from(repository.save(new TioCaronaEvento(evento, pessoa, request.observacoes())));
    }
}
