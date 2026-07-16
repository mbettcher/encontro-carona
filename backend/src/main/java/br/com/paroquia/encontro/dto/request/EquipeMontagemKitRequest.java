package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record EquipeMontagemKitRequest(
        @NotBlank(message = "O apelido da equipe deve ser informado.")
        @Size(max = 80, message = "O apelido não pode ter mais de 80 caracteres.")
        String apelido,

        @Size(max = 30, message = "A cor de identificação não pode ter mais de 30 caracteres.")
        String corIdentificacao,

        List<Long> integranteIds
) {
}
