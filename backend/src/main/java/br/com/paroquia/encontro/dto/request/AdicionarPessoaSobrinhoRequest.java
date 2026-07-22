package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AdicionarPessoaSobrinhoRequest(
        @NotNull(message = "A pessoa deve ser informada.")
        @Positive(message = "A pessoa deve ser válida.")
        Long pessoaId,

        @Size(max = 30, message = "O telefone deve ter no máximo 30 caracteres.")
        String telefone,

        @Size(max = 150, message = "O nome do responsável deve ter no máximo 150 caracteres.")
        String responsavelNome,

        @Size(max = 30, message = "O telefone do responsável deve ter no máximo 30 caracteres.")
        String responsavelTelefone,

        @Size(max = 180, message = "O endereço deve ter no máximo 180 caracteres.")
        String endereco,

        @Past(message = "A data de nascimento deve ser uma data no passado.")
        LocalDate dataNascimento,

        @Size(max = 500, message = "A restrição alimentar deve ter no máximo 500 caracteres.")
        String restricaoAlimentar,

        @Size(max = 500, message = "A observação médica deve ter no máximo 500 caracteres.")
        String observacaoMedica
) {
}
