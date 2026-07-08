package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.TioCaronaEventoRequest;
import br.com.paroquia.encontro.dto.response.TioCaronaEventoResponse;
import br.com.paroquia.encontro.services.TioCaronaEventoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/tios-carona")
public class TioCaronaEventoController {
    private final TioCaronaEventoService service;

    public TioCaronaEventoController(TioCaronaEventoService service) {
        this.service = service;
    }

    @GetMapping
    public List<TioCaronaEventoResponse> listar(@PathVariable Long eventoId) {
        return service.listar(eventoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TioCaronaEventoResponse adicionar(@PathVariable Long eventoId, @RequestBody @Valid TioCaronaEventoRequest request) {
        return service.adicionar(eventoId, request);
    }
}
