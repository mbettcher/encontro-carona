package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadernoChoroRecuperarRequest(

        @NotBlank(message = "Observação da recuperação deve ser informada.")
        @Size(
                max = 500,
                message = "Observação deve ter no máximo 500 caracteres."
        )
        String observacao
) {
}