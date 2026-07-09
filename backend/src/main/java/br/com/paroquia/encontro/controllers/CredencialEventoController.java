package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import br.com.paroquia.encontro.dto.response.CredencialEventoResponse;
import br.com.paroquia.encontro.dto.response.CredencialGeracaoResponse;
import br.com.paroquia.encontro.services.CredencialEventoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos/{eventoId}/credenciais")
public class CredencialEventoController {
    private final CredencialEventoService service;

    public CredencialEventoController(CredencialEventoService service) {
        this.service = service;
    }

    @PostMapping("/gerar")
    public CredencialGeracaoResponse gerarTodas(@PathVariable Long eventoId) {
        return service.gerarTodas(eventoId);
    }

    @PostMapping("/gerar/tios-carona")
    public CredencialGeracaoResponse gerarTiosCarona(@PathVariable Long eventoId) {
        return service.gerarCredenciaisTios(eventoId);
    }

    @PostMapping("/gerar/sobrinhos")
    public CredencialGeracaoResponse gerarSobrinhos(@PathVariable Long eventoId) {
        return service.gerarCredenciaisSobrinhos(eventoId);
    }

    @GetMapping
    public List<CredencialEventoResponse> listar(
            @PathVariable Long eventoId,
            @RequestParam(required = false) TipoCredencial tipo
    ) {
        return service.listar(eventoId, tipo);
    }

    @GetMapping("/codigo/{codigo}")
    public CredencialEventoResponse buscarPorCodigo(@PathVariable String codigo) {
        return service.buscarPorCodigo(codigo);
    }

    @PatchMapping("/{credencialId}/inativar")
    public CredencialEventoResponse inativar(
            @PathVariable Long eventoId,
            @PathVariable Long credencialId
    ) {
        return service.inativar(eventoId, credencialId);
    }

    @PatchMapping("/{credencialId}/reativar")
    public CredencialEventoResponse reativar(
            @PathVariable Long eventoId,
            @PathVariable Long credencialId
    ) {
        return service.reativar(eventoId, credencialId);
    }

    @PatchMapping("/{credencialId}/cancelar")
    public CredencialEventoResponse cancelar(
            @PathVariable Long eventoId,
            @PathVariable Long credencialId
    ) {
        return service.cancelar(eventoId, credencialId);
    }
}