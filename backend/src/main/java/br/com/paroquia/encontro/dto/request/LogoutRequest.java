package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "Refresh token é obrigatório.")
        String refreshToken
) {
}
