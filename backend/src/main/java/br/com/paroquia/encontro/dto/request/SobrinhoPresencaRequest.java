package br.com.paroquia.encontro.dto.request;

import br.com.paroquia.encontro.domain.enums.OperacaoPresencaSobrinho;
import jakarta.validation.constraints.NotNull;

public record SobrinhoPresencaRequest(
        @NotNull(message = "Operação de presença é obrigatória.")
        OperacaoPresencaSobrinho operacao
) {
}