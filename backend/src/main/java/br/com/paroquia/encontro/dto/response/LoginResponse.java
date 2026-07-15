package br.com.paroquia.encontro.dto.response;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UsuarioLogadoResponse usuario
) {
}
