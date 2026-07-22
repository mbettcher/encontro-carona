package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CadernoChoroRepository
        extends JpaRepository<CadernoChoro, Long> {

    /*
     * Consultas legadas.
     *
     * Enquanto o frontend ainda não distingue vias, a listagem permanece
     * retornando todos os registros. Ela será revisada no bloco de consultas.
     */
    List<CadernoChoro>
    findByEventoIdOrderByDuplaCodigoAscSobrinhoNomeAsc(
            Long eventoId
    );

    List<CadernoChoro>
    findByEventoIdAndDuplaIdOrderBySobrinhoNomeAsc(
            Long eventoId,
            Long duplaId
    );

    List<CadernoChoro>
    findByEventoIdAndEquipeMontagemKitIdOrderBySobrinhoNomeAsc(
            Long eventoId,
            Long equipeMontagemKitId
    );

    Optional<CadernoChoro> findByIdAndEventoId(
            Long id,
            Long eventoId
    );

    List<CadernoChoro> findByEventoIdAndSobrinhoIdOrderByNumeroViaAsc(
            Long eventoId,
            Long sobrinhoId
    );

    /*
     * Via atual do encontrista.
     */
    Optional<CadernoChoro>
    findByEventoIdAndSobrinhoIdAndViaAtualTrue(
            Long eventoId,
            Long sobrinhoId
    );

    /*
     * Última via, mesmo quando não estiver marcada como atual.
     * Serve como proteção adicional para cálculo do próximo número.
     */
    Optional<CadernoChoro>
    findTopByEventoIdAndSobrinhoIdOrderByNumeroViaDesc(
            Long eventoId,
            Long sobrinhoId
    );

    boolean existsByEventoIdAndSobrinhoIdAndViaAtualTrue(
            Long eventoId,
            Long sobrinhoId
    );

    /*
     * Mantido porque bloqueios históricos devem considerar qualquer via,
     * inclusive cancelada ou substituída.
     */
    boolean existsByEventoIdAndSobrinhoId(
            Long eventoId,
            Long sobrinhoId
    );

    boolean existsByEventoIdAndDuplaId(
            Long eventoId,
            Long duplaId
    );

    long countByEventoId(Long eventoId);

    long countByEventoIdAndViaAtualTrue(Long eventoId);

    long countByEquipeMontagemKitIdAndViaAtualTrueAndStatusNotIn(
            Long equipeMontagemKitId,
            Collection<StatusCadernoChoro> status
    );

    /*
     * Method legado mantido até a revisão do cálculo de carga.
     */
    long countByEquipeMontagemKitIdAndStatusNotIn(
            Long equipeMontagemKitId,
            Collection<StatusCadernoChoro> status
    );

    List<CadernoChoro>
    findByEventoIdAndDuplaIdAndViaAtualTrueAndStatusIn(
            Long eventoId,
            Long duplaId,
            Collection<StatusCadernoChoro> status
    );

    /*
     * Method legado mantido até a mudança das operações em lote.
     */
    List<CadernoChoro>
    findByEventoIdAndDuplaIdAndStatusIn(
            Long eventoId,
            Long duplaId,
            Collection<StatusCadernoChoro> status
    );
}