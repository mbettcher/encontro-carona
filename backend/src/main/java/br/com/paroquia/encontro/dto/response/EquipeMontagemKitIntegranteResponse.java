package br.com.paroquia.encontro.dto.response;

import br.com.paroquia.encontro.domain.entity.EquipeMontagemKitIntegrante;
import br.com.paroquia.encontro.domain.enums.PessoaTipo;

public record EquipeMontagemKitIntegranteResponse(
        Long id,
        Long pessoaId,
        String pessoaNome,
        PessoaTipo pessoaTipo
) {
    public static EquipeMontagemKitIntegranteResponse from(EquipeMontagemKitIntegrante entity) {
        return new EquipeMontagemKitIntegranteResponse(
                entity.getId(),
                entity.getPessoa().getId(),
                entity.getPessoa().getNome(),
                entity.getPessoa().getTipo()
        );
    }
}
