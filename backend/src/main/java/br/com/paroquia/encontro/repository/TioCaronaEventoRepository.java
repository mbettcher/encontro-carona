package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TioCaronaEventoRepository extends JpaRepository<TioCaronaEvento, Long> {
    List<TioCaronaEvento> findByEventoIdOrderByPessoaNome(Long eventoId);

    boolean existsByEventoIdAndPessoaId(Long eventoId, Long pessoaId);

    Optional<TioCaronaEvento> findByEventoIdAndCodigoIdentificacao(Long eventoId, String codigoIdentificacao);

    Optional<TioCaronaEvento> findByIdAndEventoId(Long id, Long eventoId);
}