package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.TioCaronaEventoRequest;
import br.com.paroquia.encontro.dto.request.TioCaronaOperacaoCodigoRequest;
import br.com.paroquia.encontro.dto.response.TioCaronaEventoOperacaoResponse;
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
    public TioCaronaEventoResponse adicionar(
            @PathVariable Long eventoId,
            @RequestBody @Valid TioCaronaEventoRequest request
    ) {
        return service.adicionar(eventoId, request);
    }

    @PostMapping("/operacao/check-in")
    public TioCaronaEventoResponse registrarCheckinPorCodigo(
            @PathVariable Long eventoId,
            @RequestBody @Valid TioCaronaOperacaoCodigoRequest request
    ) {
        return service.registrarCheckinPorCodigo(eventoId, request.codigoIdentificacao());
    }

    @PostMapping("/operacao/checkout")
    public TioCaronaEventoResponse registrarCheckoutPorCodigo(
            @PathVariable Long eventoId,
            @RequestBody @Valid TioCaronaOperacaoCodigoRequest request
    ) {
        return service.registrarCheckoutPorCodigo(eventoId, request.codigoIdentificacao());
    }

    @PostMapping("/{tioCaronaEventoId}/operacao/check-in")
    public TioCaronaEventoResponse registrarCheckinManual(
            @PathVariable Long eventoId,
            @PathVariable Long tioCaronaEventoId
    ) {
        return service.registrarCheckinManual(eventoId, tioCaronaEventoId);
    }

    @PostMapping("/{tioCaronaEventoId}/operacao/checkout")
    public TioCaronaEventoResponse registrarCheckoutManual(
            @PathVariable Long eventoId,
            @PathVariable Long tioCaronaEventoId
    ) {
        return service.registrarCheckoutManual(eventoId, tioCaronaEventoId);
    }

    @GetMapping("/{tioCaronaEventoId}/operacoes")
    public List<TioCaronaEventoOperacaoResponse> listarOperacoes(
            @PathVariable Long eventoId,
            @PathVariable Long tioCaronaEventoId
    ) {
        return service.listarOperacoes(eventoId, tioCaronaEventoId);
    }
}