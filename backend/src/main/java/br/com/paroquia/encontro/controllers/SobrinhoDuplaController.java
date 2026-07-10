package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.TrocarDuplaVinculoRequest;
import br.com.paroquia.encontro.dto.request.VincularSobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoDuplaResponse;
import br.com.paroquia.encontro.services.SobrinhoDuplaService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/vinculos")
public class SobrinhoDuplaController {
    private final SobrinhoDuplaService service;

    public SobrinhoDuplaController(SobrinhoDuplaService service) {
        this.service = service;
    }

    @GetMapping
    public List<SobrinhoDuplaResponse> listar(@PathVariable Long eventoId) {
        return service.listar(eventoId);
    }

    @GetMapping("/duplas/{duplaId}/sobrinhos")
    public List<SobrinhoDuplaResponse> listarPorDupla(
            @PathVariable Long eventoId,
            @PathVariable Long duplaId
    ) {
        return service.listarPorDupla(eventoId, duplaId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SobrinhoDuplaResponse vincular(
            @PathVariable Long eventoId,
            @RequestBody @Valid VincularSobrinhoRequest request
    ) {
        return service.vincular(eventoId, request);
    }

    @PatchMapping("/{vinculoId}/remover")
    public SobrinhoDuplaResponse remover(
            @PathVariable Long eventoId,
            @PathVariable Long vinculoId
    ) {
        return service.remover(eventoId, vinculoId);
    }

    @PatchMapping("/{vinculoId}/reativar")
    public SobrinhoDuplaResponse reativar(
            @PathVariable Long eventoId,
            @PathVariable Long vinculoId
    ) {
        return service.reativar(eventoId, vinculoId);
    }

    @PatchMapping("/{vinculoId}/trocar-dupla")
    public SobrinhoDuplaResponse trocarDupla(
            @PathVariable Long eventoId,
            @PathVariable Long vinculoId,
            @RequestBody @Valid TrocarDuplaVinculoRequest request
    ) {
        return service.trocarDupla(eventoId, vinculoId, request);
    }
}