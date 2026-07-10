package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CadernoChoroRepository extends JpaRepository<CadernoChoro, Long> {
    List<CadernoChoro> findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(Long eventoId);

    List<CadernoChoro> findByEventoIdAndDuplaIdOrderBySobrinhoNomeAsc(Long eventoId, Long duplaId);

    Optional<CadernoChoro> findByIdAndEventoId(Long id, Long eventoId);

    Optional<CadernoChoro> findByEventoIdAndSobrinhoId(Long eventoId, Long sobrinhoId);

    boolean existsByEventoIdAndSobrinhoId(Long eventoId, Long sobrinhoId);

    boolean existsByEventoIdAndDuplaId(Long eventoId, Long duplaId);

    long countByEventoId(Long eventoId);

    List<CadernoChoro> findByEventoIdAndDuplaIdAndStatusIn(
            Long eventoId,
            Long duplaId,
            Collection<StatusCadernoChoro> status
    );
}