package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.DuplaTioCarona;
import br.com.paroquia.encontro.domain.enums.DuplaStatus;

public record DuplaTioCaronaResponse(
        Long id,
        Long eventoId,
        String codigo,
        String apelido,
        Long tio1Id,
        String tio1Nome,
        Long tio2Id,
        String tio2Nome,
        DuplaStatus status) {
            public static DuplaTioCaronaResponse from(DuplaTioCarona d) {
                return new DuplaTioCaronaResponse(
                        d.getId(),
                        d.getEvento().getId(),
                        d.getCodigo(),
                        d.getApelido(),
                        d.getTio1().getId(),
                        d.getTio1().getPessoa().getNome(),
                        d.getTio2().getId(),
                        d.getTio2().getPessoa().getNome(),
                        d.getStatus());
            }
}
