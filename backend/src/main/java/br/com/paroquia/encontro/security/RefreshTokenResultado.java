package br.com.paroquia.encontro.security;

import br.com.paroquia.encontro.domain.entity.UsuarioSistema;

public record RefreshTokenResultado(
        UsuarioSistema usuario,
        String refreshToken
) {
}
