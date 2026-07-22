/*
 * V15 — Versionamento do Caderno de Mensagens
 *
 * Cada registro de caderno_choro passa a representar uma via física.
 *
 * Regras principais:
 * - um encontrista pode possuir várias vias no mesmo evento;
 * - somente uma via pode ser a via atual;
 * - o número da via é sequencial por evento/encontrista;
 * - cada nova via pode referenciar a via anterior;
 * - a timeline passa a registrar o tipo da movimentação,
 *   status anterior, status novo e número da via.
 */

-- =====================================================================================
-- 1. CADERNO DE MENSAGENS — VERSIONAMENTO
-- =====================================================================================

ALTER TABLE caderno_choro
DROP
CONSTRAINT IF EXISTS uk_caderno_choro_evento_sobrinho;

ALTER TABLE caderno_choro
    ADD COLUMN numero_via INTEGER;

ALTER TABLE caderno_choro
    ADD COLUMN caderno_anterior_id BIGINT;

ALTER TABLE caderno_choro
    ADD COLUMN motivo_emissao VARCHAR(40);

ALTER TABLE caderno_choro
    ADD COLUMN via_atual BOOLEAN;

ALTER TABLE caderno_choro
    ADD COLUMN status_anterior_ocorrencia VARCHAR(40);

ALTER TABLE caderno_choro
    ADD COLUMN encerrado_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE caderno_choro
    ADD COLUMN motivo_cancelamento VARCHAR(40);

ALTER TABLE caderno_choro
    ADD COLUMN motivo_substituicao VARCHAR(40);

-- Todos os registros existentes representam a primeira via.
UPDATE caderno_choro
SET numero_via = 1
WHERE numero_via IS NULL;

UPDATE caderno_choro
SET motivo_emissao = 'GERACAO_INICIAL'
WHERE motivo_emissao IS NULL;

UPDATE caderno_choro
SET via_atual = TRUE
WHERE via_atual IS NULL;

-- Registros terminais existentes recebem uma data de encerramento aproximada.
-- Como não existia coluna específica, utilizamos a melhor data operacional disponível.
UPDATE caderno_choro
SET encerrado_em = COALESCE(
        entregue_ao_sobrinho_em,
        anexado_ao_kit_em,
        conferido_em,
        recebido_da_dupla_em,
        entregue_a_dupla_em,
        criado_em
                   )
WHERE status IN ('ENTREGUE_AO_SOBRINHO', 'SUBSTITUIDO', 'CANCELADO')
  AND encerrado_em IS NULL;

ALTER TABLE caderno_choro
    ALTER COLUMN numero_via SET NOT NULL;

ALTER TABLE caderno_choro
    ALTER COLUMN motivo_emissao SET NOT NULL;

ALTER TABLE caderno_choro
    ALTER COLUMN via_atual SET NOT NULL;

ALTER TABLE caderno_choro
    ADD CONSTRAINT ck_caderno_choro_numero_via_positivo
        CHECK (numero_via > 0);

ALTER TABLE caderno_choro
    ADD CONSTRAINT fk_caderno_choro_via_anterior
        FOREIGN KEY (caderno_anterior_id)
            REFERENCES caderno_choro (id);

ALTER TABLE caderno_choro
    ADD CONSTRAINT ck_caderno_choro_nao_referencia_si_mesmo
        CHECK (
            caderno_anterior_id IS NULL
                OR caderno_anterior_id <> id
            );

-- Somente uma via atual por encontrista/evento.
CREATE UNIQUE INDEX ux_caderno_choro_via_atual
    ON caderno_choro (evento_id, sobrinho_id) WHERE via_atual = TRUE;

-- O número da via não pode se repetir para o mesmo encontrista/evento.
CREATE UNIQUE INDEX ux_caderno_choro_numero_via
    ON caderno_choro (evento_id, sobrinho_id, numero_via);

-- Uma via anterior pode originar somente uma via seguinte.
CREATE UNIQUE INDEX ux_caderno_choro_via_anterior
    ON caderno_choro (caderno_anterior_id) WHERE caderno_anterior_id IS NOT NULL;

CREATE INDEX idx_caderno_choro_evento_sobrinho_via
    ON caderno_choro (evento_id, sobrinho_id, numero_via);

CREATE INDEX idx_caderno_choro_evento_via_atual
    ON caderno_choro (evento_id, via_atual);

CREATE INDEX idx_caderno_choro_caderno_anterior
    ON caderno_choro (caderno_anterior_id);

CREATE INDEX idx_caderno_choro_motivo_emissao
    ON caderno_choro (evento_id, motivo_emissao);

-- =====================================================================================
-- 2. HISTÓRICO — BASE DA TIMELINE
-- =====================================================================================

ALTER TABLE caderno_choro_historico
    ADD COLUMN tipo_movimentacao VARCHAR(50);

ALTER TABLE caderno_choro_historico
    ADD COLUMN status_anterior VARCHAR(40);

ALTER TABLE caderno_choro_historico
    ADD COLUMN status_novo VARCHAR(40);

ALTER TABLE caderno_choro_historico
    ADD COLUMN numero_via INTEGER;

ALTER TABLE caderno_choro_historico
    ADD COLUMN tio_carona_evento_id BIGINT;

ALTER TABLE caderno_choro_historico
    ADD COLUMN usuario_responsavel_id BIGINT;

ALTER TABLE caderno_choro_historico
    ADD COLUMN motivo VARCHAR(40);

-- Os históricos existentes pertencem à via 1.
UPDATE caderno_choro_historico historico
SET numero_via = caderno.numero_via FROM caderno_choro caderno
WHERE caderno.id = historico.caderno_id
  AND historico.numero_via IS NULL;

UPDATE caderno_choro_historico
SET status_novo = status
WHERE status_novo IS NULL;

-- Converte os registros históricos já existentes em tipos de movimentação.
UPDATE caderno_choro_historico
SET tipo_movimentacao = CASE status
                            WHEN 'PENDENTE'
                                THEN 'CADERNO_GERADO'
                            WHEN 'ENTREGUE_A_DUPLA'
                                THEN 'ENTREGA_A_DUPLA'
                            WHEN 'RECEBIDO_DA_DUPLA'
                                THEN 'RECEBIMENTO_DA_DUPLA'
                            WHEN 'DIRECIONADO_EQUIPE_MONTAGEM'
                                THEN 'DIRECIONAMENTO_EQUIPE'
                            WHEN 'CONFERIDO'
                                THEN 'CONFERENCIA'
                            WHEN 'ANEXADO_AO_KIT'
                                THEN 'ANEXACAO_KIT'
                            WHEN 'ENTREGUE_AO_SOBRINHO'
                                THEN 'ENTREGA_ENCONTRISTA'
                            WHEN 'PERDIDO'
                                THEN 'PERDA_REGISTRADA'
                            WHEN 'SUBSTITUIDO'
                                THEN 'CADERNO_SUBSTITUIDO'
                            WHEN 'CANCELADO'
                                THEN 'CADERNO_CANCELADO'
                            ELSE 'MOVIMENTACAO_LEGADA'
    END
WHERE tipo_movimentacao IS NULL;

ALTER TABLE caderno_choro_historico
    ALTER COLUMN tipo_movimentacao SET NOT NULL;

ALTER TABLE caderno_choro_historico
    ALTER COLUMN status_novo SET NOT NULL;

ALTER TABLE caderno_choro_historico
    ALTER COLUMN numero_via SET NOT NULL;

ALTER TABLE caderno_choro_historico
    ADD CONSTRAINT ck_caderno_historico_numero_via_positivo
        CHECK (numero_via > 0);

ALTER TABLE caderno_choro_historico
    ADD CONSTRAINT fk_caderno_historico_tio_recebedor
        FOREIGN KEY (tio_carona_evento_id)
            REFERENCES tio_carona_evento (id);

ALTER TABLE caderno_choro_historico
    ADD CONSTRAINT fk_caderno_historico_usuario
        FOREIGN KEY (usuario_responsavel_id)
            REFERENCES usuario_sistema (id);

CREATE INDEX idx_caderno_historico_evento_sobrinho_ocorrido
    ON caderno_choro_historico (
                                evento_id,
                                sobrinho_id,
                                ocorrido_em
        );

CREATE INDEX idx_caderno_historico_caderno_via_ocorrido
    ON caderno_choro_historico (
                                caderno_id,
                                numero_via,
                                ocorrido_em
        );

CREATE INDEX idx_caderno_historico_tipo_movimentacao
    ON caderno_choro_historico (
                                evento_id,
                                tipo_movimentacao
        );

CREATE INDEX idx_caderno_historico_usuario
    ON caderno_choro_historico (
                                usuario_responsavel_id
        );