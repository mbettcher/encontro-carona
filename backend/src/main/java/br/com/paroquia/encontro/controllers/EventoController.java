package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.EventoRequest;
import br.com.paroquia.encontro.dto.response.EventoResponse;
import br.com.paroquia.encontro.services.EventoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {
    private final EventoService service;

    public EventoController(EventoService service) {
        this.service = service;
    }

    @GetMapping
    public List<EventoResponse> listar(@RequestParam(required = false) Long paroquiaId) {
        return service.listar(paroquiaId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventoResponse criar(@RequestBody @Valid EventoRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public EventoResponse atualizar(@PathVariable Long id, @RequestBody @Valid EventoRequest request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/inativar")
    public EventoResponse inativar(@PathVariable Long id) {
        return service.inativar(id);
    }

    @PatchMapping("/{id}/reativar")
    public EventoResponse reativar(@PathVariable Long id) {
        return service.reativar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
