package br.com.paroquia.encontro.dto.response;

import java.time.OffsetDateTime;

public record DashboardResumoResponse(
        OffsetDateTime geradoEm,
        Long eventoSelecionadoId,
        DashboardBaseResumoResponse base,
        DashboardEventoResumoResponse evento
) {
}
