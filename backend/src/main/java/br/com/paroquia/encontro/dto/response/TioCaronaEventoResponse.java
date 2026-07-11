
package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.CredencialEvento;
import br.com.paroquia.encontro.domain.entity.TioCaronaEvento;
import br.com.paroquia.encontro.domain.entity.TioCaronaEventoOperacao;
import br.com.paroquia.encontro.domain.enums.StatusCredencial;
import br.com.paroquia.encontro.domain.enums.TioCaronaStatus;
import br.com.paroquia.encontro.domain.enums.TipoOperacaoTioCarona;

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
        OffsetDateTime checkoutEm,

        Long credencialId,
        String credencialCodigo,
        StatusCredencial credencialStatus,
        boolean credencialAtiva,

        String statusOperacional,
        TipoOperacaoTioCarona ultimaOperacao,
        OffsetDateTime ultimaOperacaoEm
) {
    public static TioCaronaEventoResponse from(TioCaronaEvento entity) {
        return from(entity, null, null);
    }

    public static TioCaronaEventoResponse from(
            TioCaronaEvento entity,
            TioCaronaEventoOperacao ultimaOperacao
    ) {
        return from(entity, ultimaOperacao, null);
    }

    public static TioCaronaEventoResponse from(
            TioCaronaEvento entity,
            TioCaronaEventoOperacao ultimaOperacao,
            CredencialEvento credencial
    ) {
        var ultima = ultimaOperacao == null ? null : ultimaOperacao.getTipo();

        var statusOperacional = calcularStatusOperacional(ultima);
        var credencialStatus = credencial == null ? null : credencial.getStatus();

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
                entity.getCheckoutEm(),

                credencial == null ? null : credencial.getId(),
                credencial == null ? null : credencial.getCodigo(),
                credencialStatus,
                credencialStatus == StatusCredencial.ATIVA,

                statusOperacional,
                ultima,
                ultimaOperacao == null ? null : ultimaOperacao.getOcorridoEm()
        );
    }

    private static String calcularStatusOperacional(TipoOperacaoTioCarona ultimaOperacao) {
        if (ultimaOperacao == TipoOperacaoTioCarona.CHECKIN) {
            return "COM_CHECKIN";
        }

        if (ultimaOperacao == TipoOperacaoTioCarona.CHECKOUT) {
            return "COM_CHECKOUT";
        }

        return "AGUARDANDO_CHECKIN";
    }
}