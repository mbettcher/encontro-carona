package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.TioCaronaEventoOperacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TioCaronaEventoOperacaoRepository extends JpaRepository<TioCaronaEventoOperacao, Long> {
    Optional<TioCaronaEventoOperacao> findFirstByTioCaronaEventoIdOrderByOcorridoEmDesc(Long tioCaronaEventoId);

    List<TioCaronaEventoOperacao> findByTioCaronaEventoIdOrderByOcorridoEmDesc(Long tioCaronaEventoId);

    List<TioCaronaEventoOperacao> findByEventoIdOrderByOcorridoEmDesc(Long eventoId);
}