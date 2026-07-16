package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.EquipeMontagemKit;
import br.com.paroquia.encontro.domain.enums.StatusEquipeMontagemKit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipeMontagemKitRepository extends JpaRepository<EquipeMontagemKit, Long> {
    List<EquipeMontagemKit> findByEventoIdOrderByApelidoAsc(Long eventoId);

    List<EquipeMontagemKit> findByEventoIdAndStatusOrderByIdAsc(Long eventoId, StatusEquipeMontagemKit status);

    Optional<EquipeMontagemKit> findByIdAndEventoId(Long id, Long eventoId);

    boolean existsByEventoIdAndApelidoIgnoreCase(Long eventoId, String apelido);

    boolean existsByEventoIdAndApelidoIgnoreCaseAndIdNot(Long eventoId, String apelido, Long id);
}
