package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotNull;

public record DuplaTioCaronaRequest(
        @NotNull Long tio1Id,
        @NotNull Long tio2Id,
        @NotNull Long paroquiaComunidadeId,
        String apelido) {
}
