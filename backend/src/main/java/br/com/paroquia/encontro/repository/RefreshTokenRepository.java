package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            update RefreshToken rt
               set rt.revogadoEm = :revogadoEm
             where rt.usuario.id = :usuarioId
               and rt.revogadoEm is null
            """)
    int revogarTodosAtivosDoUsuario(Long usuarioId, OffsetDateTime revogadoEm);
}
