package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.Size;

public record AtualizarDuplaTioCaronaRequest(
        @Size(max = 120, message = "Apelido deve ter no máximo 120 caracteres.")
        String apelido
) {
}