package br.com.paroquia.encontro.dto.response;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UsuarioLogadoResponse usuario
) {
}
