package br.com.paroquia.encontro.dto.response;

public record CadernoChoroSubstituicaoResponse(
        CadernoChoroResponse viaSubstituida,
        CadernoChoroResponse novaVia
) {
}