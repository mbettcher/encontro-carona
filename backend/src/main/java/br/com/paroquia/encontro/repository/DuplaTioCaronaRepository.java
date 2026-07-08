package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DuplaTioCaronaRepository extends JpaRepository<DuplaTioCarona, Long> {
    List<DuplaTioCarona> findByEventoIdOrderByCodigo(Long eventoId);

    boolean existsByEventoIdAndTio1IdOrEventoIdAndTio2Id(Long eventoId1, Long tio1Id, Long eventoId2, Long tio2Id);
}
