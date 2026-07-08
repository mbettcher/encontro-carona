package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParoquiaRequest(
        @NotBlank @Size(max = 150) String nome,
        @Size(max = 180) String endereco,
        @Size(max = 80) String cidade,
        @Size(max = 2) String uf,
        @Size(max = 30) String telefone,
        @Size(max = 120) String email,
        @Size(max = 120) String responsavel
) {}
