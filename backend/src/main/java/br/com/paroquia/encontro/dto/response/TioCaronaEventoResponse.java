package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;

import java.time.OffsetDateTime;

public record TioCaronaEventoResponse(
        Long id,
        Long eventoId,
        Long pessoaId,
        String pessoaNome,
        TioCaronaStatus status,
        String observacoes,
        String codigoIdentificacao,
        boolean checkinRealizado,
        OffsetDateTime checkinEm,
        boolean checkoutRealizado,
        OffsetDateTime checkoutEm
) {
    public static TioCaronaEventoResponse from(TioCaronaEvento entity) {
        return new TioCaronaEventoResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getPessoa().getId(),
                entity.getPessoa().getNome(),
                entity.getStatus(),
                entity.getObservacoes(),
                entity.getCodigoIdentificacao(),
                entity.isCheckinRealizado(),
                entity.getCheckinEm(),
                entity.isCheckoutRealizado(),
                entity.getCheckoutEm()
        );
    }
}