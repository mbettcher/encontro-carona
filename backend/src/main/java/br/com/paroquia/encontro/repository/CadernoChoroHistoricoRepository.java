package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CadernoChoroHistoricoRepository
        extends JpaRepository<CadernoChoroHistorico, Long> {

    /*
     * Timeline individual da via.
     */
    List<CadernoChoroHistorico>
    findByCadernoIdOrderByOcorridoEmAsc(
            Long cadernoId
    );

    /*
     * Compatibilidade com o endpoint atual, que retorna do mais recente
     * para o mais antigo. Será substituído pela ordem crescente no frontend
     * quando a nova timeline for implementada.
     */
    List<CadernoChoroHistorico>
    findByCadernoIdOrderByOcorridoEmDesc(
            Long cadernoId
    );

    /*
     * Timeline consolidada de todas as vias do encontrista.
     */
    List<CadernoChoroHistorico>
    findByEventoIdAndSobrinhoIdOrderByOcorridoEmAsc(
            Long eventoId,
            Long sobrinhoId
    );

    List<CadernoChoroHistorico>
    findByEventoIdOrderByOcorridoEmDesc(
            Long eventoId
    );

    boolean existsByEventoIdAndDuplaId(
            Long eventoId,
            Long duplaId
    );
}