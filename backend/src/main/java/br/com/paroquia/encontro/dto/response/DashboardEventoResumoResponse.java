package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.enums.EventoStatus;

import java.time.LocalDate;

public record DashboardEventoResumoResponse(
        Long id,
        String nome,
        String tema,
        String paroquiaNome,
        LocalDate dataInicio,
        LocalDate dataFim,
        String local,
        EventoStatus status,

        long totalTiosCarona,
        long totalTiosCaronaAtivos,
        long tiosComCheckin,
        long tiosComCheckout,

        long totalDuplas,
        long totalDuplasAtivas,

        long totalEncontristas,
        long totalEncontristasAtivos,

        long totalVinculos,
        long totalVinculosAtivos,

        long totalCadernos,
        long cadernosPendentes,
        long cadernosEntreguesADupla,
        long cadernosRecebidosDaDupla,
        long cadernosConferidos,
        long cadernosAnexadosAoKit,
        long cadernosEntreguesAoSobrinho,
        long cadernosPerdidos,
        long cadernosSubstituidos,
        long cadernosCancelados,

        long totalCredenciais,
        long credenciaisAtivas,
        long credenciaisInativas,
        long credenciaisCanceladas,
        long credenciaisTioCarona,
        long credenciaisSobrinho,

        long presencasPresentes,
        long presencasAusentes,
        long presencasDesistentes,

        long operacoesCheckin,
        long operacoesCheckout
) {
}
