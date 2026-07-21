package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.Sobrinho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SobrinhoRepository extends JpaRepository<Sobrinho, Long> {
    List<Sobrinho> findByEventoIdOrderByNome(Long eventoId);

    List<Sobrinho> findByEventoIdOrderByNomeAsc(Long eventoId);

    Optional<Sobrinho> findByIdAndEventoId(Long id, Long eventoId);

    boolean existsByEventoIdAndPessoaId(Long eventoId, Long pessoaId);

    long countByEventoId(Long eventoId);

    long countByPessoaId(Long pessoaId);
}
