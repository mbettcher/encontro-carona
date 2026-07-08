package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {
    List<Evento> findByParoquiaIdOrderByDataInicioDesc(Long paroquiaId);
}
