package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DuplaTioCaronaRepository extends JpaRepository<DuplaTioCarona, Long> {
    List<DuplaTioCarona> findByEventoIdOrderByCodigo(Long eventoId);

    Optional<DuplaTioCarona> findByIdAndEventoId(Long id, Long eventoId);

    @Query("""
            select count(d) > 0
            from DuplaTioCarona d
            where d.evento.id = :eventoId
              and d.status = :status
              and (
                d.tio1.id = :tioCaronaEventoId
                or d.tio2.id = :tioCaronaEventoId
              )
            """)
    boolean existsTioEmDuplaComStatus(
            Long eventoId,
            Long tioCaronaEventoId,
            DuplaStatus status
    );

    @Query("""
            select count(d) > 0
            from DuplaTioCarona d
            where d.evento.id = :eventoId
              and d.status = :status
              and d.id <> :duplaIdIgnorada
              and (
                d.tio1.id = :tioCaronaEventoId
                or d.tio2.id = :tioCaronaEventoId
              )
            """)
    boolean existsTioEmOutraDuplaComStatus(
            Long eventoId,
            Long tioCaronaEventoId,
            Long duplaIdIgnorada,
            DuplaStatus status
    );
}