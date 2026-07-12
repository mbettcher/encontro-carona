package br.com.paroquia.encontro.security;

import br.com.paroquia.encontro.domain.enums.PerfilUsuario;

public record UsuarioAutenticado(
        Long id,
        String nome,
        String username,
        PerfilUsuario perfil
) {
    public String role() {
        return "ROLE_" + perfil.name();
    }
}
