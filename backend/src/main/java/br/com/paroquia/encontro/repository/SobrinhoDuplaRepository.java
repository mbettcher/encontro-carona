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

    List<SobrinhoDupla> findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(
            Long eventoId
    );

    Optional<SobrinhoDupla> findByIdAndEventoId(
            Long id,
            Long eventoId
    );

    boolean existsByEventoIdAndSobrinhoIdAndStatus(
            Long eventoId,
            Long sobrinhoId,
            VinculoStatus status
    );

    boolean existsByEventoIdAndSobrinhoIdAndStatusAndIdNot(
            Long eventoId,
            Long sobrinhoId,
            VinculoStatus status,
            Long id
    );

    boolean existsByEventoIdAndDuplaIdAndStatus(
            Long eventoId,
            Long duplaId,
            VinculoStatus status
    );

    /**
     * Usado na exclusão física de uma dupla.
     * <p>
     * Qualquer vínculo já criado, inclusive removido, representa histórico
     * e deve impedir a exclusão física da dupla.
     */
    boolean existsByEventoIdAndDuplaId(
            Long eventoId,
            Long duplaId
    );
}