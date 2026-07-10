package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.Size;

public record AtualizarTioCaronaEventoRequest(
        @Size(max = 500, message = "Observações devem ter no máximo 500 caracteres.")
        String observacoes
) {
}