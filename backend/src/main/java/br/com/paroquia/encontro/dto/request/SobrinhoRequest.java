package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SobrinhoRequest(
        @NotBlank String nome,
        String telefone,
        String responsavelNome,
        String responsavelTelefone,
        String endereco,
        LocalDate dataNascimento,
        String restricaoAlimentar,
        String observacaoMedica) {
}
