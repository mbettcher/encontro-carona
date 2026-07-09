package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.Size;

public record CadernoChoroOperacaoRequest(
        @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres.")
        String observacao
) {
}