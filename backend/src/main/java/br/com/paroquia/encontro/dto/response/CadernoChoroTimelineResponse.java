package br.com.paroquia.encontro.dto.response;

import java.util.List;

public record CadernoChoroTimelineResponse(
        Long eventoId,
        Long sobrinhoId,
        String sobrinhoNome,
        Integer numeroViaAtual,
        Long cadernoAtualId,
        List<CadernoChoroResponse> vias,
        List<CadernoChoroHistoricoResponse> movimentacoes
) {
}