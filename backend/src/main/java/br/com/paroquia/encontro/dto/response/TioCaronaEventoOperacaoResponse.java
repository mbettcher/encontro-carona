package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.TioCaronaEventoOperacao;
import br.com.paroquia.encontro.domain.enums.OrigemOperacaoTioCarona;
import br.com.paroquia.encontro.domain.enums.TipoOperacaoTioCarona;

import java.time.OffsetDateTime;

public record TioCaronaEventoOperacaoResponse(
        Long id,
        Long eventoId,
        Long tioCaronaEventoId,
        String tioCaronaNome,
        TipoOperacaoTioCarona tipo,
        OrigemOperacaoTioCarona origem,
        String codigoIdentificacao,
        OffsetDateTime ocorridoEm
) {
    public static TioCaronaEventoOperacaoResponse from(TioCaronaEventoOperacao entity) {
        return new TioCaronaEventoOperacaoResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getTioCaronaEvento().getId(),
                entity.getTioCaronaEvento().getPessoa().getNome(),
                entity.getTipo(),
                entity.getOrigem(),
                entity.getCodigoIdentificacao(),
                entity.getOcorridoEm()
        );
    }
}