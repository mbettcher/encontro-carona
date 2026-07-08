package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;

public record TioCaronaEventoResponse(
        Long id,
        Long eventoId,
        Long pessoaId,
        String pessoaNome,
        TioCaronaStatus status,
        String observacoes) {
    public static TioCaronaEventoResponse from(TioCaronaEvento t) {
        return new TioCaronaEventoResponse(
                t.getId(),
                t.getEvento().getId(),
                t.getPessoa().getId(),
                t.getPessoa().getNome(),
                t.getStatus(),
                t.getObservacoes()
        );
    }
}
