package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.SobrinhoPresenca;
import br.com.paroquia.encontro.domain.enums.OrigemPresencaSobrinho;
import br.com.paroquia.encontro.domain.enums.SobrinhoStatus;

import java.time.OffsetDateTime;

public record SobrinhoPresencaResponse(
        Long id,
        Long eventoId,
        Long sobrinhoId,
        String sobrinhoNome,
        SobrinhoStatus status,
        OrigemPresencaSobrinho origem,
        String observacao,
        OffsetDateTime ocorridoEm
) {
    public static SobrinhoPresencaResponse from(SobrinhoPresenca entity) {
        return new SobrinhoPresencaResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getSobrinho().getId(),
                entity.getSobrinho().getNome(),
                entity.getStatus(),
                entity.getOrigem(),
                entity.getObservacao(),
                entity.getOcorridoEm()
        );
    }
}