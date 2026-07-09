package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;

import java.time.OffsetDateTime;

public record CadernoChoroHistoricoResponse(
        Long id,
        Long eventoId,
        Long cadernoId,
        Long duplaId,
        String duplaCodigo,
        Long sobrinhoId,
        String sobrinhoNome,
        StatusCadernoChoro status,
        String observacao,
        OffsetDateTime ocorridoEm
) {
    public static CadernoChoroHistoricoResponse from(CadernoChoroHistorico entity) {
        return new CadernoChoroHistoricoResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getCaderno().getId(),
                entity.getDupla().getId(),
                entity.getDupla().getCodigo(),
                entity.getSobrinho().getId(),
                entity.getSobrinho().getNome(),
                entity.getStatus(),
                entity.getObservacao(),
                entity.getOcorridoEm()
        );
    }
}