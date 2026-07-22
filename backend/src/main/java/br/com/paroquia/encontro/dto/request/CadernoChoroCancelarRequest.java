package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.MotivoCancelamentoCaderno;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CadernoChoroCancelarRequest(

        @NotNull(message = "Motivo do cancelamento deve ser informado.")
        MotivoCancelamentoCaderno motivo,

        @NotBlank(message = "Observação do cancelamento deve ser informada.")
        @Size(
                max = 500,
                message = "Observação deve ter no máximo 500 caracteres."
        )
        String observacao
) {
}