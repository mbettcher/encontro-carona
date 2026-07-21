package br.com.paroquia.encontro.services;

import br.com.paroquia.encontro.common.BusinessException;
import br.com.paroquia.encontro.common.ResourceNotFoundException;
import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.dto.request.EventoRequest;
import br.com.paroquia.encontro.dto.response.EventoResponse;
import br.com.paroquia.encontro.repository.CadernoChoroRepository;
import br.com.paroquia.encontro.repository.CredencialEventoRepository;
import br.com.paroquia.encontro.repository.DuplaTioCaronaRepository;
import br.com.paroquia.encontro.repository.EquipeMontagemKitRepository;
import br.com.paroquia.encontro.repository.EventoRepository;
import br.com.paroquia.encontro.repository.ParoquiaRepository;
import br.com.paroquia.encontro.repository.SobrinhoRepository;
import br.com.paroquia.encontro.repository.TioCaronaEventoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EventoService {
    private final EventoRepository repository;
    private final ParoquiaRepository paroquiaRepository;
    private final TioCaronaEventoRepository tioCaronaRepository;
    private final SobrinhoRepository sobrinhoRepository;
    private final DuplaTioCaronaRepository duplaRepository;
    private final CredencialEventoRepository credencialRepository;
    private final CadernoChoroRepository cadernoRepository;
    private final EquipeMontagemKitRepository equipeRepository;

    public EventoService(
            EventoRepository repository,
            ParoquiaRepository paroquiaRepository,
            TioCaronaEventoRepository tioCaronaRepository,
            SobrinhoRepository sobrinhoRepository,
            DuplaTioCaronaRepository duplaRepository,
            CredencialEventoRepository credencialRepository,
            CadernoChoroRepository cadernoRepository,
            EquipeMontagemKitRepository equipeRepository
    ) {
        this.repository = repository;
        this.paroquiaRepository = paroquiaRepository;
        this.tioCaronaRepository = tioCaronaRepository;
        this.sobrinhoRepository = sobrinhoRepository;
        this.duplaRepository = duplaRepository;
        this.credencialRepository = credencialRepository;
        this.cadernoRepository = cadernoRepository;
        this.equipeRepository = equipeRepository;
    }

    @Transactional(readOnly = true)
    public List<EventoResponse> listar(Long paroquiaId) {
        var eventos = paroquiaId == null ? repository.findAll() : repository.findByParoquiaIdOrderByDataInicioDesc(paroquiaId);
        return eventos.stream().map(EventoResponse::from).toList();
    }

    @Transactional
    public EventoResponse criar(EventoRequest request) {
        validarDatas(request);
        var paroquia = paroquiaRepository.findById(request.paroquiaId()).orElseThrow(() -> new ResourceNotFoundException("Paróquia/Comunidade não encontrada."));
        if (!paroquia.isAtivo()) {
            throw new BusinessException("Não é possível criar evento para paróquia/comunidade inativa.");
        }

        var evento = new Evento(paroquia, request.nome(), request.tema(), request.dataInicio(), request.dataFim(), request.local(), request.monitoramentoInicio(), request.monitoramentoFim());
        evento.atualizar(request.nome(), request.tema(), request.dataInicio(), request.dataFim(), request.local(), request.status(), request.monitoramentoInicio(), request.monitoramentoFim(), request.monitoramentoAtivo());
        return EventoResponse.from(repository.save(evento));
    }

    @Transactional
    public EventoResponse atualizar(Long id, EventoRequest request) {
        validarDatas(request);
        var evento = buscar(id);
        evento.atualizar(request.nome(), request.tema(), request.dataInicio(), request.dataFim(), request.local(), request.status(), request.monitoramentoInicio(), request.monitoramentoFim(), request.monitoramentoAtivo());
        return EventoResponse.from(evento);
    }

    @Transactional
    public EventoResponse inativar(Long id) {
        var evento = buscar(id);
        evento.inativar();
        return EventoResponse.from(evento);
    }

    @Transactional
    public EventoResponse reativar(Long id) {
        var evento = buscar(id);
        evento.reativar();
        return EventoResponse.from(evento);
    }

    @Transactional
    public void excluir(Long id) {
        var evento = buscar(id);
        validarExclusao(evento);
        repository.delete(evento);
    }

    private Evento buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento não encontrado."));
    }

    private void validarDatas(EventoRequest request) {
        if (request.dataFim().isBefore(request.dataInicio())) {
            throw new BusinessException("A data final do evento não pode ser anterior à data inicial.");
        }
        if (request.monitoramentoInicio() != null && request.monitoramentoFim() != null && !request.monitoramentoFim().isAfter(request.monitoramentoInicio())) {
            throw new BusinessException("O horário final de monitoramento deve ser posterior ao horário inicial.");
        }
    }

    private void validarExclusao(Evento evento) {
        var eventoId = evento.getId();

        if (tioCaronaRepository.countByEventoId(eventoId) > 0
                || sobrinhoRepository.countByEventoId(eventoId) > 0
                || duplaRepository.countByEventoId(eventoId) > 0
                || credencialRepository.countByEventoId(eventoId) > 0
                || cadernoRepository.countByEventoId(eventoId) > 0
                || equipeRepository.countByEventoId(eventoId) > 0) {
            throw new BusinessException("Não é possível excluir este evento porque ele possui dados operacionais. Inative o evento.");
        }
    }
}
