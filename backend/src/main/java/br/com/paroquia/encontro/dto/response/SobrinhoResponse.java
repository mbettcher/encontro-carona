package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.Sobrinho;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;

import java.time.LocalDate;

public record SobrinhoResponse(
        Long id,
        Long eventoId,
        String nome,
        String telefone,
        String responsavelNome,
        String responsavelTelefone,
        String endereco,
        LocalDate dataNascimento,
        String restricaoAlimentar,
        String observacaoMedica,
        SobrinhoStatus status) {
    public static SobrinhoResponse from(Sobrinho s){
        return new SobrinhoResponse(
                s.getId(),
                s.getEvento().getId(),
                s.getNome(),
                s.getTelefone(),
                s.getResponsavelNome(),
                s.getResponsavelTelefone(),
                s.getEndereco(),
                s.getDataNascimento(),
                s.getRestricaoAlimentar(),
                s.getObservacaoMedica(),
                s.getStatus()
        );
    }
}
