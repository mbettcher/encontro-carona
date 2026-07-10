package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.domain.entity.SobrinhoPresenca;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record SobrinhoResponse(
        Long id,
        Long eventoId,
        Long pessoaId,
        String pessoaNome,
        String nome,
        String telefone,
        String responsavelNome,
        String responsavelTelefone,
        String endereco,
        LocalDate dataNascimento,
        String restricaoAlimentar,
        String observacaoMedica,
        SobrinhoStatus status,

        SobrinhoStatus statusAtualPresenca,
        OffsetDateTime ultimaPresencaEm
) {
    public static SobrinhoResponse from(Sobrinho entity) {
        return from(entity, null);
    }

    public static SobrinhoResponse from(Sobrinho entity, SobrinhoPresenca ultimaPresenca) {
        return new SobrinhoResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getPessoa() == null ? null : entity.getPessoa().getId(),
                entity.getPessoa() == null ? null : entity.getPessoa().getNome(),
                entity.getNome(),
                entity.getTelefone(),
                entity.getResponsavelNome(),
                entity.getResponsavelTelefone(),
                entity.getEndereco(),
                entity.getDataNascimento(),
                entity.getRestricaoAlimentar(),
                entity.getObservacaoMedica(),
                entity.getStatus(),

                ultimaPresenca == null ? entity.getStatus() : ultimaPresenca.getStatus(),
                ultimaPresenca == null ? null : ultimaPresenca.getOcorridoEm()
        );
    }
}
