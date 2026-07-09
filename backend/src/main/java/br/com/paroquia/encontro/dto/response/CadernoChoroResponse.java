package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;

import java.time.OffsetDateTime;

public record CadernoChoroResponse(
        Long id,
        Long eventoId,
        Long duplaId,
        String duplaCodigo,
        String duplaApelido,
        String tio1Nome,
        String tio2Nome,
        Long sobrinhoId,
        String sobrinhoNome,
        StatusCadernoChoro status,
        OffsetDateTime entregueADuplaEm,
        OffsetDateTime recebidoDaDuplaEm,
        OffsetDateTime conferidoEm,
        OffsetDateTime anexadoAoKitEm,
        OffsetDateTime entregueAoSobrinhoEm,
        String observacao,
        OffsetDateTime criadoEm
) {
    public static CadernoChoroResponse from(CadernoChoro entity) {
        return new CadernoChoroResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getDupla().getId(),
                entity.getDupla().getCodigo(),
                entity.getDupla().getApelido(),
                entity.getDupla().getTio1().getPessoa().getNome(),
                entity.getDupla().getTio2().getPessoa().getNome(),
                entity.getSobrinho().getId(),
                entity.getSobrinho().getNome(),
                entity.getStatus(),
                entity.getEntregueADuplaEm(),
                entity.getRecebidoDaDuplaEm(),
                entity.getConferidoEm(),
                entity.getAnexadoAoKitEm(),
                entity.getEntregueAoSobrinhoEm(),
                entity.getObservacao(),
                entity.getCriadoEm()
        );
    }
}