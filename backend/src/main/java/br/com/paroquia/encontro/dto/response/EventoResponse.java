package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.Evento;
import br.com.paroquia.encontro.domain.enums.EventoStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventoResponse(
        Long id,
        Long paroquiaId,
        String paroquiaNome,
        String nome,
        String tema,
        LocalDate dataInicio,
        LocalDate dataFim,
        String local,
        EventoStatus status,
        LocalTime monitoramentoInicio,
        LocalTime monitoramentoFim,
        boolean monitoramentoAtivo
) {
    public static EventoResponse from(Evento e) {
        return new EventoResponse(
                e.getId(),
                e.getParoquia().getId(),
                e.getParoquia().getNome(),
                e.getNome(),
                e.getTema(),
                e.getDataInicio(),
                e.getDataFim(),
                e.getLocal(),
                e.getStatus(),
                e.getMonitoramentoInicio(),
                e.getMonitoramentoFim(),
                e.isMonitoramentoAtivo());
    }
}
