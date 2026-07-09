package br.com.paroquia.encontro.dto.response;

public record CadernoChoroGeracaoResponse(
        Long eventoId,
        long criados,
        long existentes,
        long total
) {
}