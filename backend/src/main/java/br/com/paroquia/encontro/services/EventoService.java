package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.dto.request.EventoRequest;
import br.com.paroquia.encontro.dto.response.EventoResponse;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.ParoquiaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventoService {
    private final EventoRepository repository;
    private final ParoquiaRepository paroquiaRepository;

    public EventoService(EventoRepository repository, ParoquiaRepository paroquiaRepository) {
        this.repository = repository;
        this.paroquiaRepository = paroquiaRepository;
    }

    @Transactional(readOnly = true)
    public List<EventoResponse> listar(Long paroquiaId) {
        var eventos = paroquiaId == null ? repository.findAll() : repository.findByParoquiaIdOrderByDataInicioDesc(paroquiaId);
        return eventos.stream().map(EventoResponse::from).toList();
    }

    @Transactional
    public EventoResponse criar(EventoRequest request) {
        validarDatas(request);
        var paroquia = paroquiaRepository.findById(request.paroquiaId()).orElseThrow(() -> new ResourceNotFoundException("Paróquia não encontrada."));
        var evento = new Evento(paroquia, request.nome(), request.tema(), request.dataInicio(), request.dataFim(), request.local(), request.monitoramentoInicio(), request.monitoramentoFim());
        evento.atualizar(request.nome(), request.tema(), request.dataInicio(), request.dataFim(), request.local(), request.status(), request.monitoramentoInicio(), request.monitoramentoFim(), request.monitoramentoAtivo());
        return EventoResponse.from(repository.save(evento));
    }

    @Transactional
    public EventoResponse atualizar(Long id, EventoRequest request) {
        validarDatas(request);
        var evento = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
        evento.atualizar(request.nome(), request.tema(), request.dataInicio(), request.dataFim(), request.local(), request.status(), request.monitoramentoInicio(), request.monitoramentoFim(), request.monitoramentoAtivo());
        return EventoResponse.from(evento);
    }

    private void validarDatas(EventoRequest request) {
        if (request.dataFim().isBefore(request.dataInicio())) {
            throw new BusinessException("A data final do evento não pode ser anterior à data inicial.");
        }
        if (request.monitoramentoInicio() != null && request.monitoramentoFim() != null && !request.monitoramentoFim().isAfter(request.monitoramentoInicio())) {
            throw new BusinessException("O horário final de monitoramento deve ser posterior ao horário inicial.");
        }
    }
}