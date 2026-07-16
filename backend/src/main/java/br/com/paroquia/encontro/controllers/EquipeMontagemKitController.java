package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.EquipeMontagemKitIntegranteRequest;
import br.com.paroquia.encontro.dto.request.EquipeMontagemKitRequest;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.dto.response.EquipeMontagemKitResponse;
import br.com.paroquia.encontro.services.EquipeMontagemKitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/equipes-montagem-kit")
public class EquipeMontagemKitController {
    private final EquipeMontagemKitService service;

    public EquipeMontagemKitController(EquipeMontagemKitService service) {
        this.service = service;
    }

    @GetMapping
    public List<EquipeMontagemKitResponse> listar(@PathVariable Long eventoId) {
        return service.listar(eventoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipeMontagemKitResponse criar(
            @PathVariable Long eventoId,
            @RequestBody @Valid EquipeMontagemKitRequest request
    ) {
        return service.criar(eventoId, request);
    }

    @PatchMapping("/{equipeId}")
    public EquipeMontagemKitResponse atualizar(
            @PathVariable Long eventoId,
            @PathVariable Long equipeId,
            @RequestBody @Valid EquipeMontagemKitRequest request
    ) {
        return service.atualizar(eventoId, equipeId, request);
    }

    @PatchMapping("/{equipeId}/inativar")
    public EquipeMontagemKitResponse inativar(
            @PathVariable Long eventoId,
            @PathVariable Long equipeId
    ) {
        return service.inativar(eventoId, equipeId);
    }

    @PatchMapping("/{equipeId}/reativar")
    public EquipeMontagemKitResponse reativar(
            @PathVariable Long eventoId,
            @PathVariable Long equipeId
    ) {
        return service.reativar(eventoId, equipeId);
    }

    @PostMapping("/{equipeId}/integrantes")
    public EquipeMontagemKitResponse adicionarIntegrante(
            @PathVariable Long eventoId,
            @PathVariable Long equipeId,
            @RequestBody @Valid EquipeMontagemKitIntegranteRequest request
    ) {
        return service.adicionarIntegrante(eventoId, equipeId, request);
    }

    @DeleteMapping("/{equipeId}/integrantes/{integranteId}")
    public EquipeMontagemKitResponse removerIntegrante(
            @PathVariable Long eventoId,
            @PathVariable Long equipeId,
            @PathVariable Long integranteId
    ) {
        return service.removerIntegrante(eventoId, equipeId, integranteId);
    }

    @GetMapping("/{equipeId}/cadernos")
    public List<CadernoChoroResponse> listarCadernos(
            @PathVariable Long eventoId,
            @PathVariable Long equipeId
    ) {
        return service.listarCadernos(eventoId, equipeId);
    }
}
