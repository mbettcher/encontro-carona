package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.Pessoa;
import br.com.paroquia.encontro.domain.enums.PessoaTipo;

import java.time.LocalDate;

public record PessoaResponse(
        Long id,
        String nome,
        String telefone,
        String email,
        LocalDate dataNascimento,
        PessoaTipo tipo,
        String observacoes) {
    public static PessoaResponse from(Pessoa p) {
        return new PessoaResponse(
                p.getId(),
                p.getNome(),
                p.getTelefone(),
                p.getEmail(),
                p.getDataNascimento(),
                p.getTipo(),
                p.getObservacoes()
        );
    }
}
