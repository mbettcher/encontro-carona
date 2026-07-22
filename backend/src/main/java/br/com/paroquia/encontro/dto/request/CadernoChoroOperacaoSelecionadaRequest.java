package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CadernoChoroOperacaoSelecionadaRequest(

        @NotEmpty(message = "Selecione ao menos um Caderno de Mensagens.")
        @Size(
                max = 200,
                message = "Selecione no máximo 200 cadernos por operação."
        )
        List<@NotNull(message = "ID do caderno não pode ser nulo.") Long>
        cadernoIds,

        @NotNull(message = "Tio carona responsável deve ser informado.")
        Long tioCaronaEventoId,

        @Size(
                max = 500,
                message = "Observação deve ter no máximo 500 caracteres."
        )
        String observacao
) {
}