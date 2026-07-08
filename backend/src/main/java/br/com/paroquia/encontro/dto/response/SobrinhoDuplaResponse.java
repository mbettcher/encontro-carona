package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.SobrinhoDupla;
import br.com.paroquia.encontro.domain.enums.VinculoStatus;

public record SobrinhoDuplaResponse(
        Long id,
        Long eventoId,
        Long sobrinhoId,
        String sobrinhoNome,
        Long duplaId,
        String duplaCodigo,
        VinculoStatus status) {
    public static SobrinhoDuplaResponse from(SobrinhoDupla v){
        return new SobrinhoDuplaResponse(
                v.getId(),
                v.getEvento().getId(),
                v.getSobrinho().getId(),
                v.getSobrinho().getNome(),
                v.getDupla().getId(),
                v.getDupla().getCodigo(),
                v.getStatus()
        );
    }
}
