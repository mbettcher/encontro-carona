package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.OperacaoPresencaSobrinho;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SobrinhoPresencaRequest(
        @NotNull(message = "Operação de presença é obrigatória.")
        OperacaoPresencaSobrinho operacao,

        @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres.")
        String observacao
) {
}