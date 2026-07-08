package br.com.paroquia.encontro.controllers;

import br.com.paroquia.encontro.dto.request.PessoaRequest;
import br.com.paroquia.encontro.dto.response.PessoaResponse;
import br.com.paroquia.encontro.services.PessoaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pessoas")
public class PessoaController {
    private final PessoaService service;

    public PessoaController(PessoaService service) {
        this.service = service;
    }

    @GetMapping
    public List<PessoaResponse> listar(@RequestParam(required = false) String busca) {
        return service.listar(busca);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PessoaResponse criar(@RequestBody @Valid PessoaRequest request) {
        return service.criar(request);
    }

    @PutMapping("/{id}")
    public PessoaResponse atualizar(@PathVariable Long id, @RequestBody @Valid PessoaRequest request) {
        return service.atualizar(id, request);
    }
}
