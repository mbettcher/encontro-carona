package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CredencialEventoRepository extends JpaRepository<CredencialEvento, Long> {
    List<CredencialEvento> findByEventoIdOrderByTipoAscCodigoAsc(Long eventoId);

    List<CredencialEvento> findByEventoIdAndTipoOrderByCodigoAsc(Long eventoId, TipoCredencial tipo);

    Optional<CredencialEvento> findByIdAndEventoId(Long id, Long eventoId);

    Optional<CredencialEvento> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    boolean existsByEventoIdAndTioCaronaEventoId(Long eventoId, Long tioCaronaEventoId);

    boolean existsByEventoIdAndSobrinhoId(Long eventoId, Long sobrinhoId);

    long countByEventoId(Long eventoId);

    long countByEventoIdAndTipo(Long eventoId, TipoCredencial tipo);
}