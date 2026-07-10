package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotNull;

public record TrocarDuplaVinculoRequest(
        @NotNull(message = "A nova dupla deve ser informada.")
        Long duplaId
) {
}