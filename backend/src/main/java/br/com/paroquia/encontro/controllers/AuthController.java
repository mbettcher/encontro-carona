package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.AlterarSenhaRequest;
import br.com.paroquia.encontro.dto.request.LoginRequest;
import br.com.paroquia.encontro.dto.response.LoginResponse;
import br.com.paroquia.encontro.dto.response.UsuarioLogadoResponse;
import br.com.paroquia.encontro.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest request) {
        return service.login(request);
    }

    @GetMapping("/me")
    public UsuarioLogadoResponse me() {
        return service.me();
    }

    @PatchMapping("/alterar-senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarSenha(@RequestBody @Valid AlterarSenhaRequest request) {
        service.alterarSenha(request);
    }
}
