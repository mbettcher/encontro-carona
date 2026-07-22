package br.com.paroquia.encontro.domain.enums;

/**
 * Identifica o acontecimento registrado na timeline.
 *
 * O tipo da movimentação não deve ser confundido com o status atual
 * da via. Uma movimentação pode ser apenas informativa e não alterar
 * necessariamente o status operacional.
 */
public enum TipoMovimentacaoCaderno {
    CADERNO_GERADO,
    ENTREGA_A_DUPLA,
    RECEBIMENTO_DA_DUPLA,
    DIRECIONAMENTO_EQUIPE,
    CONFERENCIA,
    ANEXACAO_KIT,
    ENTREGA_ENCONTRISTA,

    PERDA_REGISTRADA,
    DANO_REGISTRADO,
    CADERNO_RECUPERADO,

    CADERNO_SUBSTITUIDO,
    NOVA_VIA_GERADA,
    CADERNO_CANCELADO,

    DUPLA_ALTERADA,
    ENCONTRISTA_DESISTENTE,
    PARTICIPACAO_RETOMADA,

    RECOLHIMENTO_CONCLUIDO,

    MOVIMENTACAO_LEGADA
}