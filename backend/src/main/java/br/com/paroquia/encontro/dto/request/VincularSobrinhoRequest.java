package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotNull;

public record VincularSobrinhoRequest(
        @NotNull Long sobrinhoId,
        @NotNull Long duplaId) {
}
