package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.CadernoChoro;
import br.com.paroquia.encontro.domain.enums.MotivoCancelamentoCaderno;
import br.com.paroquia.encontro.domain.enums.MotivoEmissaoCaderno;
import br.com.paroquia.encontro.domain.enums.MotivoSubstituicaoCaderno;
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

        Long equipeMontagemKitId,
        String equipeMontagemKitApelido,
        String equipeMontagemKitCorIdentificacao,

        StatusCadernoChoro status,

        Integer numeroVia,
        boolean viaAtual,
        Long cadernoAnteriorId,
        MotivoEmissaoCaderno motivoEmissao,
        MotivoCancelamentoCaderno motivoCancelamento,
        MotivoSubstituicaoCaderno motivoSubstituicao,
        StatusCadernoChoro statusAnteriorOcorrencia,

        OffsetDateTime entregueADuplaEm,
        OffsetDateTime recebidoDaDuplaEm,
        OffsetDateTime direcionadoEquipeMontagemEm,
        OffsetDateTime conferidoEm,
        OffsetDateTime anexadoAoKitEm,
        OffsetDateTime entregueAoSobrinhoEm,
        OffsetDateTime encerradoEm,

        String observacao,
        OffsetDateTime criadoEm
) {

    public static CadernoChoroResponse from(CadernoChoro entity) {
        var equipe = entity.getEquipeMontagemKit();
        var anterior = entity.getCadernoAnterior();

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

                equipe == null ? null : equipe.getId(),
                equipe == null ? null : equipe.getApelido(),
                equipe == null ? null : equipe.getCorIdentificacao(),

                entity.getStatus(),

                entity.getNumeroVia(),
                entity.isViaAtual(),
                anterior == null ? null : anterior.getId(),
                entity.getMotivoEmissao(),
                entity.getMotivoCancelamento(),
                entity.getMotivoSubstituicao(),
                entity.getStatusAnteriorOcorrencia(),

                entity.getEntregueADuplaEm(),
                entity.getRecebidoDaDuplaEm(),
                entity.getDirecionadoEquipeMontagemEm(),
                entity.getConferidoEm(),
                entity.getAnexadoAoKitEm(),
                entity.getEntregueAoSobrinhoEm(),
                entity.getEncerradoEm(),

                entity.getObservacao(),
                entity.getCriadoEm()
        );
    }
}