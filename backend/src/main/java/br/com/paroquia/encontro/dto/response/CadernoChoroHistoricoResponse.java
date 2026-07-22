package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.CadernoChoroHistorico;
import br.com.paroquia.encontro.domain.enums.StatusCadernoChoro;
import br.com.paroquia.encontro.domain.enums.TipoMovimentacaoCaderno;

import java.time.OffsetDateTime;

public record CadernoChoroHistoricoResponse(
        Long id,
        Long eventoId,
        Long cadernoId,

        Integer numeroVia,

        Long duplaId,
        String duplaCodigo,
        String duplaApelido,

        Long sobrinhoId,
        String sobrinhoNome,

        Long equipeMontagemKitId,
        String equipeMontagemKitApelido,

        Long tioCaronaEventoId,
        String tioCaronaNome,

        Long usuarioResponsavelId,
        String usuarioResponsavelNome,

        TipoMovimentacaoCaderno tipoMovimentacao,
        StatusCadernoChoro statusAnterior,
        StatusCadernoChoro statusNovo,

        /*
         * Mantido para compatibilidade com o frontend atual.
         */
        StatusCadernoChoro status,

        String motivo,
        String observacao,
        OffsetDateTime ocorridoEm
) {

    public static CadernoChoroHistoricoResponse from(
            CadernoChoroHistorico entity
    ) {
        var equipe = entity.getEquipeMontagemKit();
        var tio = entity.getTioCaronaEvento();
        var usuario = entity.getUsuarioResponsavel();

        return new CadernoChoroHistoricoResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getCaderno().getId(),

                entity.getNumeroVia(),

                entity.getDupla().getId(),
                entity.getDupla().getCodigo(),
                entity.getDupla().getApelido(),

                entity.getSobrinho().getId(),
                entity.getSobrinho().getNome(),

                equipe == null ? null : equipe.getId(),
                equipe == null ? null : equipe.getApelido(),

                tio == null ? null : tio.getId(),
                tio == null ? null : tio.getPessoa().getNome(),

                usuario == null ? null : usuario.getId(),
                usuario == null ? null : usuario.getNome(),

                entity.getTipoMovimentacao(),
                entity.getStatusAnterior(),
                entity.getStatusNovo(),

                entity.getStatus(),

                entity.getMotivo(),
                entity.getObservacao(),
                entity.getOcorridoEm()
        );
    }
}