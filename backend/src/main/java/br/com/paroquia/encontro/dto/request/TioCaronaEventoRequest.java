package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotNull;

public record TioCaronaEventoRequest(
        @NotNull Long pessoaId,
        String observacoes) {
}
