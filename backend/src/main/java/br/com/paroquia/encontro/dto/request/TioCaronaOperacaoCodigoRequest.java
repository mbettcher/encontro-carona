package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TioCaronaOperacaoCodigoRequest(
        @NotBlank(message = "Código de identificação é obrigatório.")
        @Size(max = 80, message = "Código de identificação deve ter no máximo 80 caracteres.")
        String codigoIdentificacao
) {
}