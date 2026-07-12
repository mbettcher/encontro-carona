package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.domain.enums.PerfilUsuario;

public record UsuarioLogadoResponse(
        Long id,
        String nome,
        String username,
        PerfilUsuario perfil,
        String perfilDescricao
) {
    public static UsuarioLogadoResponse from(UsuarioSistema usuario) {
        return new UsuarioLogadoResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getUsername(),
                usuario.getPerfil(),
                usuario.getPerfil().getDescricao()
        );
    }
}
