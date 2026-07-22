package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.TipoOcorrenciaCaderno;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CadernoChoroOcorrenciaRequest(

        @NotNull(message = "Tipo da ocorrência deve ser informado.")
        TipoOcorrenciaCaderno tipo,

        /*
         * Para PERDA este campo é desconsiderado, porque a perda sempre
         * interrompe o fluxo.
         *
         * Para DANO:
         * - true: altera o status para DANIFICADO;
         * - false: registra somente a ocorrência na timeline.
         */
        boolean impedeContinuacao,

        @NotBlank(message = "Observação da ocorrência deve ser informada.")
        @Size(
                max = 500,
                message = "Observação deve ter no máximo 500 caracteres."
        )
        String observacao
) {
}