package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.UsuarioSistema;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioSistemaRepository extends JpaRepository<UsuarioSistema, Long> {
    Optional<UsuarioSistema> findByUsernameIgnoreCaseAndAtivoTrue(String username);

    Optional<UsuarioSistema> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);
}
