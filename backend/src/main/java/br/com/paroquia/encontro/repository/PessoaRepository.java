package br.com.paroquia.encontro.repository;

import br.com.paroquia.encontro.domain.entity.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
    List<Pessoa> findByNomeContainingIgnoreCaseOrderByNome(String nome);
}
