package br.com.paroquia.encontro.dto.response;

public record CredencialGeracaoResponse(
        Long eventoId,
        long criadas,
        long existentes,
        long total
) {
}