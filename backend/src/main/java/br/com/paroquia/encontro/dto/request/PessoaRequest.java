package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.PessoaTipo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PessoaRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres.")
        String nome,

        @Size(max = 30, message = "O telefone deve ter no máximo 30 caracteres.")
        String telefone,

        @Email(message = "Informe um e-mail válido.")
        @Size(max = 120, message = "O e-mail deve ter no máximo 120 caracteres.")
        String email,

        @Past(message = "A data de nascimento deve ser uma data no passado.")
        LocalDate dataNascimento,

        @NotNull(message = "O tipo da pessoa é obrigatório.")
        PessoaTipo tipo,

        @Size(max = 150, message = "O nome do responsável deve ter no máximo 150 caracteres.")
        String responsavelNome,

        @Size(max = 30, message = "O telefone do responsável deve ter no máximo 30 caracteres.")
        String responsavelTelefone,

        @Size(max = 180, message = "O endereço deve ter no máximo 180 caracteres.")
        String endereco,

        @Size(max = 500, message = "As observações devem ter no máximo 500 caracteres.")
        String observacoes
) {
}
