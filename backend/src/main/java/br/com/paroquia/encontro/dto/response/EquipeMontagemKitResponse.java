package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.EquipeMontagemKit;
import br.com.paroquia.encontro.domain.enums.StatusEquipeMontagemKit;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

public record EquipeMontagemKitResponse(
        Long id,
        Long eventoId,
        String apelido,
        String corIdentificacao,
        StatusEquipeMontagemKit status,
        List<EquipeMontagemKitIntegranteResponse> integrantes,
        OffsetDateTime criadoEm
) {
    public static EquipeMontagemKitResponse from(EquipeMontagemKit entity) {
        return new EquipeMontagemKitResponse(
                entity.getId(),
                entity.getEvento().getId(),
                entity.getApelido(),
                entity.getCorIdentificacao(),
                entity.getStatus(),
                entity.getIntegrantes().stream()
                        .map(EquipeMontagemKitIntegranteResponse::from)
                        .sorted(Comparator.comparing(
                                EquipeMontagemKitIntegranteResponse::pessoaNome,
                                String.CASE_INSENSITIVE_ORDER
                        ))
                        .toList(),
                entity.getCriadoEm()
        );
    }
}
