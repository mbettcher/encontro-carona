package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotNull;

public record EquipeMontagemKitIntegranteRequest(
        @NotNull(message = "A pessoa integrante deve ser informada.")
        Long pessoaId
) {
}
