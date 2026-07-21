package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.Paroquia;

public record ParoquiaResponse(
        Long id,
        String nome,
        String endereco,
        String cidade,
        String uf,
        String telefone,
        String email,
        String responsavel,
        boolean ativo
) {
    public static ParoquiaResponse from(Paroquia p) {
        return new ParoquiaResponse(
                p.getId(),
                p.getNome(),
                p.getEndereco(),
                p.getCidade(),
                p.getUf(),
                p.getTelefone(),
                p.getEmail(),
                p.getResponsavel(),
                p.isAtivo());
    }
}
