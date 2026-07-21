package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.Paroquia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParoquiaRepository extends JpaRepository<Paroquia, Long> {
    java.util.List<Paroquia> findByAtivoTrueOrderByNomeAsc();
}
