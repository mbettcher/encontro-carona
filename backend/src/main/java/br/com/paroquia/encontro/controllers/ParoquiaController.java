package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.ParoquiaRequest;
import br.com.paroquia.encontro.dto.response.ParoquiaResponse;
import br.com.paroquia.encontro.services.ParoquiaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paroquias")
public class ParoquiaController {
    private final ParoquiaService service;

    public ParoquiaController(ParoquiaService service) {
        this.service = service;
    }

    @GetMapping
    public List<ParoquiaResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ParoquiaResponse criar(@RequestBody @Valid ParoquiaRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public ParoquiaResponse atualizar(@PathVariable Long id, @RequestBody @Valid ParoquiaRequest request) {
        return service.atualizar(id, request);
    }
}
