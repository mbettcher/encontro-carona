package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TipoCredencial;

import java.time.OffsetDateTime;

public record CredencialEventoResponse(
        Long id,
        Long eventoId,
        String eventoNome,
        TipoCredencial tipo,
        String codigo,
        StatusCredencial status,

        Long tioCaronaEventoId,
        Long pessoaId,
        String pessoaNome,

        Long sobrinhoId,
        String sobrinhoNome,
        String responsavelNome,

        Long duplaId,
        String duplaCodigo,
        String duplaApelido,

        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm
) {
    public static CredencialEventoResponse from(CredencialEvento entity) {
        var tio = entity.getTioCaronaEvento();
        var sobrinho = entity.getSobrinho();

        return new CredencialEventoResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getEvento().getNome(),
                entity.getTipo(),
                entity.getCodigo(),
                entity.getStatus(),

                tio != null ? tio.getId() : null,
                tio != null ? tio.getPessoa().getId() : null,
                tio != null ? tio.getPessoa().getNome() : null,

                sobrinho != null ? sobrinho.getId() : null,
                sobrinho != null ? sobrinho.getNome() : null,
                sobrinho != null ? sobrinho.getResponsavelNome() : null,

                null,
                null,
                null,

                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }
}