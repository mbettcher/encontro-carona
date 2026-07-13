package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import br.com.paroquia.encontro.domain.enums.PerfilUsuario;

import java.time.OffsetDateTime;

public record UsuarioSistemaResponse(
        Long id,
        String nome,
        String username,
        PerfilUsuario perfil,
        String perfilDescricao,
        boolean ativo,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm
) {
    public static UsuarioSistemaResponse from(UsuarioSistema usuario) {
        return new UsuarioSistemaResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getUsername(),
                usuario.getPerfil(),
                usuario.getPerfil().getDescricao(),
                usuario.isAtivo(),
                usuario.getCriadoEm(),
                usuario.getAtualizadoEm()
        );
    }
}
