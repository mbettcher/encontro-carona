package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.MotivoSubstituicaoCaderno;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CadernoChoroSubstituirRequest(

        @NotNull(message = "Motivo da substituição deve ser informado.")
        MotivoSubstituicaoCaderno motivo,

        @NotBlank(message = "Observação da substituição deve ser informada.")
        @Size(
                max = 500,
                message = "Observação deve ter no máximo 500 caracteres."
        )
        String observacao
) {
}