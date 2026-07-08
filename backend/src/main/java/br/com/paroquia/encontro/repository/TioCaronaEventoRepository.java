package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TioCaronaEventoRepository extends JpaRepository<TioCaronaEvento, Long> {
    List<TioCaronaEvento> findByEventoIdOrderByPessoaNome(Long eventoId);

    boolean existsByEventoIdAndPessoaId(Long eventoId, Long pessoaId);
}
