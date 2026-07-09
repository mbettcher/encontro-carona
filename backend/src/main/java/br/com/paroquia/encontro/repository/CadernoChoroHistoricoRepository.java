package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CadernoChoroHistoricoRepository extends JpaRepository<CadernoChoroHistorico, Long> {
    List<CadernoChoroHistorico> findByCadernoIdOrderByOcorridoEmDesc(Long cadernoId);

    List<CadernoChoroHistorico> findByEventoIdOrderByOcorridoEmDesc(Long eventoId);
}