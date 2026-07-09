package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.CadernoChoroOperacaoRequest;
import br.com.paroquia.encontro.dto.response.CadernoChoroGeracaoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroHistoricoResponse;
import br.com.paroquia.encontro.dto.response.CadernoChoroResponse;
import br.com.paroquia.encontro.services.CadernoChoroService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/cadernos")
public class CadernoChoroController {
    private final CadernoChoroService service;

    public CadernoChoroController(CadernoChoroService service) {
        this.service = service;
    }

    @PostMapping("/gerar")
    public CadernoChoroGeracaoResponse gerar(@PathVariable Long eventoId) {
        return service.gerar(eventoId);
    }

    @GetMapping
    public List<CadernoChoroResponse> listar(@PathVariable Long eventoId) {
        return service.listar(eventoId);
    }

    @GetMapping("/duplas/{duplaId}")
    public List<CadernoChoroResponse> listarPorDupla(
            @PathVariable Long eventoId,
            @PathVariable Long duplaId
    ) {
        return service.listarPorDupla(eventoId, duplaId);
    }

    @PostMapping("/duplas/{duplaId}/entregar-a-dupla")
    public List<CadernoChoroResponse> entregarADupla(
            @PathVariable Long eventoId,
            @PathVariable Long duplaId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.entregarADupla(eventoId, duplaId, observacao(request));
    }

    @PostMapping("/duplas/{duplaId}/receber-da-dupla")
    public List<CadernoChoroResponse> receberDaDupla(
            @PathVariable Long eventoId,
            @PathVariable Long duplaId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.receberDaDupla(eventoId, duplaId, observacao(request));
    }

    @PostMapping("/{cadernoId}/conferir")
    public CadernoChoroResponse conferir(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.conferir(eventoId, cadernoId, observacao(request));
    }

    @PostMapping("/{cadernoId}/anexar-ao-kit")
    public CadernoChoroResponse anexarAoKit(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.anexarAoKit(eventoId, cadernoId, observacao(request));
    }

    @PostMapping("/{cadernoId}/entregar-ao-sobrinho")
    public CadernoChoroResponse entregarAoSobrinho(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.entregarAoSobrinho(eventoId, cadernoId, observacao(request));
    }

    @PostMapping("/{cadernoId}/perdido")
    public CadernoChoroResponse marcarPerdido(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.marcarPerdido(eventoId, cadernoId, observacao(request));
    }

    @PostMapping("/{cadernoId}/substituido")
    public CadernoChoroResponse marcarSubstituido(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.marcarSubstituido(eventoId, cadernoId, observacao(request));
    }

    @PostMapping("/{cadernoId}/cancelado")
    public CadernoChoroResponse cancelar(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId,
            @RequestBody(required = false) @Valid CadernoChoroOperacaoRequest request
    ) {
        return service.cancelar(eventoId, cadernoId, observacao(request));
    }

    @GetMapping("/{cadernoId}/historico")
    public List<CadernoChoroHistoricoResponse> listarHistorico(
            @PathVariable Long eventoId,
            @PathVariable Long cadernoId
    ) {
        return service.listarHistorico(eventoId, cadernoId);
    }

    private String observacao(CadernoChoroOperacaoRequest request) {
        return request == null ? null : request.observacao();
    }
}