package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.Sobrinho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SobrinhoRepository extends JpaRepository<Sobrinho, Long> {
    List<Sobrinho> findByEventoIdOrderByNome(Long eventoId);
}
