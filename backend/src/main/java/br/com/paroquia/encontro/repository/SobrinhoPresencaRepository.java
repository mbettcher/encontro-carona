package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.SobrinhoPresenca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SobrinhoPresencaRepository extends JpaRepository<SobrinhoPresenca, Long> {
    Optional<SobrinhoPresenca> findFirstBySobrinhoIdOrderByOcorridoEmDesc(Long sobrinhoId);

    List<SobrinhoPresenca> findBySobrinhoIdOrderByOcorridoEmDesc(Long sobrinhoId);

    List<SobrinhoPresenca> findByEventoIdOrderByOcorridoEmDesc(Long eventoId);
}