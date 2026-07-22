/*
 * V16 — Integração entre desistência do encontrista
 *       e o Caderno de Mensagens.
 *
 * Quando o caderno já estava fisicamente com a dupla no momento
 * do cancelamento, será necessário recolhê-lo.
 */

ALTER TABLE caderno_choro
    ADD COLUMN recolhimento_pendente BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_caderno_choro_recolhimento_pendente
    ON caderno_choro (evento_id, recolhimento_pendente) WHERE recolhimento_pendente = TRUE;