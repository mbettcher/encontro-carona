package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.SobrinhoRequest;
import br.com.paroquia.encontro.dto.response.SobrinhoPresencaResponse;
import br.com.paroquia.encontro.dto.response.SobrinhoResponse;
import br.com.paroquia.encontro.services.SobrinhoService;
import br.com.paroquia.encontro.dto.request.SobrinhoPresencaRequest;
import br.com.paroquia.encontro.dto.request.SobrinhoPresencaCredencialRequest;

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

    @PutMapping("/{sobrinhoId}")
    public SobrinhoResponse atualizar(
            @PathVariable Long eventoId,
            @PathVariable Long sobrinhoId,
            @RequestBody @Valid SobrinhoRequest request
    ) {
        return service.atualizar(eventoId, sobrinhoId, request);
    }

    @PatchMapping("/{sobrinhoId}/presenca")
    public SobrinhoResponse registrarPresenca(
            @PathVariable Long eventoId,
            @PathVariable Long sobrinhoId,
            @RequestBody @Valid SobrinhoPresencaRequest request
    ) {
        return service.registrarPresenca(
                eventoId,
                sobrinhoId,
                request.operacao(),
                request.observacao()
        );
    }

    @GetMapping("/{sobrinhoId}/presencas")
    public List<SobrinhoPresencaResponse> listarPresencas(
            @PathVariable Long eventoId,
            @PathVariable Long sobrinhoId
    ) {
        return service.listarPresencas(eventoId, sobrinhoId);
    }

    @PostMapping("/presenca/credencial")
    public SobrinhoResponse registrarPresencaPorCredencial(
            @PathVariable Long eventoId,
            @RequestBody @Valid SobrinhoPresencaCredencialRequest request
    ) {
        return service.registrarPresencaPorCredencial(
                eventoId,
                request.codigoIdentificacao(),
                request.operacao(),
                request.observacao()
        );
    }

}
