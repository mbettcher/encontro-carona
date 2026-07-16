package br.com.paroquia.encontro.dto.response;

public record DashboardBaseResumoResponse(
        long totalEventos,
        long totalPessoas,
        long totalParoquias,
        long totalUsuariosSistema
) {
}
