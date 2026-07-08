package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.DuplaTioCaronaRequest;
import br.com.paroquia.encontro.dto.response.DuplaTioCaronaResponse;
import br.com.paroquia.encontro.services.DuplaTioCaronaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/duplas")
public class DuplaTioCaronaController {
    private final DuplaTioCaronaService service;

    public DuplaTioCaronaController(DuplaTioCaronaService service) {
        this.service = service;
    }

    @GetMapping
    public List<DuplaTioCaronaResponse> listar(@PathVariable Long eventoId) {
        return service.listar(eventoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DuplaTioCaronaResponse criar(@PathVariable Long eventoId, @RequestBody @Valid DuplaTioCaronaRequest request) {
        return service.criar(eventoId, request);
    }
}
