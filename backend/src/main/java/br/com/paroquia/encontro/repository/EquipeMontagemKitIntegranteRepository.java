package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.EquipeMontagemKitIntegrante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipeMontagemKitIntegranteRepository extends JpaRepository<EquipeMontagemKitIntegrante, Long> {
    boolean existsByEquipe_Evento_IdAndPessoa_Id(Long eventoId, Long pessoaId);

    boolean existsByEquipe_Evento_IdAndPessoa_IdAndEquipe_IdNot(Long eventoId, Long pessoaId, Long equipeId);
}
