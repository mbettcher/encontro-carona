
package br.com.paroquia.encontro.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import br.com.paroquia.encontro.domain.enums.EventoStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventoRequest(
        @NotNull Long paroquiaId,
        @NotBlank String nome,
        String tema,
        @NotNull LocalDate dataInicio,
        @NotNull LocalDate dataFim,
        String local,
        @NotNull EventoStatus status,
        LocalTime monitoramentoInicio,
        LocalTime monitoramentoFim,
        boolean monitoramentoAtivo
) {
}