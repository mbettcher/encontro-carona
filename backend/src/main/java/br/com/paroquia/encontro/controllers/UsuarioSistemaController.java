package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.AtualizarUsuarioSistemaRequest;
import br.com.paroquia.encontro.dto.request.CriarUsuarioSistemaRequest;
import br.com.paroquia.encontro.dto.request.ResetarSenhaUsuarioSistemaRequest;
import br.com.paroquia.encontro.dto.response.UsuarioSistemaResponse;
import br.com.paroquia.encontro.services.UsuarioSistemaAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-sistema")
public class UsuarioSistemaController {
    private final UsuarioSistemaAdminService service;

    public UsuarioSistemaController(UsuarioSistemaAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<UsuarioSistemaResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioSistemaResponse criar(@RequestBody @Valid CriarUsuarioSistemaRequest request) {
        return service.criar(request);
    }

    @PatchMapping("/{id}")
    public UsuarioSistemaResponse atualizar(
            @PathVariable Long id,
            @RequestBody @Valid AtualizarUsuarioSistemaRequest request
    ) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/ativar")
    public UsuarioSistemaResponse ativar(@PathVariable Long id) {
        return service.ativar(id);
    }

    @PatchMapping("/{id}/desativar")
    public UsuarioSistemaResponse desativar(@PathVariable Long id) {
        return service.desativar(id);
    }

    @PatchMapping("/{id}/resetar-senha")
    public UsuarioSistemaResponse resetarSenha(
            @PathVariable Long id,
            @RequestBody @Valid ResetarSenhaUsuarioSistemaRequest request
    ) {
        return service.resetarSenha(id, request);
    }
}
