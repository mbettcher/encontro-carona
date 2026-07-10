package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.SobrinhoDupla;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SobrinhoDuplaRepository extends JpaRepository<SobrinhoDupla, Long> {
    List<SobrinhoDupla> findByEventoIdAndDuplaIdAndStatusOrderBySobrinhoNome(
            Long eventoId,
            Long duplaId,
            VinculoStatus status
    );

    List<SobrinhoDupla> findByEventoIdAndStatusOrderByDuplaCodigoAscSobrinhoNomeAsc(
            Long eventoId,
            VinculoStatus status
    );

    Optional<SobrinhoDupla> findByIdAndEventoId(Long id, Long eventoId);

    boolean existsByEventoIdAndSobrinhoIdAndStatus(
            Long eventoId,
            Long sobrinhoId,
            VinculoStatus status
    );
}