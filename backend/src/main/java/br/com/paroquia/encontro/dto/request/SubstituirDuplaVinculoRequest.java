package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record SubstituirDuplaVinculoRequest(
        @NotNull(message = "A nova dupla deve ser informada.")
        @Positive(message = "A nova dupla deve ser válida.")
        Long novaDuplaId,

        @NotBlank(message = "O motivo da substituição deve ser informado.")
        @Size(max = 500, message = "O motivo deve ter no máximo 500 caracteres.")
        String motivo,

        Boolean confirmarCadernoDevolvido
) {
    public boolean cadernoDevolvidoConfirmado() {
        return Boolean.TRUE.equals(confirmarCadernoDevolvido);
    }
}