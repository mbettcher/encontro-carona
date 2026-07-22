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
        String responsavelNome,
        String responsavelTelefone,
        String endereco,
        String observacoes,
        boolean ativo
) {
    public static PessoaResponse from(Pessoa pessoa) {
        return new PessoaResponse(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getTelefone(),
                pessoa.getEmail(),
                pessoa.getDataNascimento(),
                pessoa.getTipo(),
                pessoa.getResponsavelNome(),
                pessoa.getResponsavelTelefone(),
                pessoa.getEndereco(),
                pessoa.getObservacoes(),
                pessoa.isAtivo()
        );
    }
}
