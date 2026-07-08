package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.SobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoResponse;
import br.com.paroquia.encontro.services.SobrinhoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/sobrinhos")
public class SobrinhoController {
    private final SobrinhoService service;

    public SobrinhoController(SobrinhoService service) {
        this.service = service;
    }

    @GetMapping
    public List<SobrinhoResponse> listar(@PathVariable Long eventoId) {
        return service.listar(eventoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SobrinhoResponse criar(@PathVariable Long eventoId, @RequestBody @Valid SobrinhoRequest request) {
        return service.criar(eventoId, request);
    }
}
