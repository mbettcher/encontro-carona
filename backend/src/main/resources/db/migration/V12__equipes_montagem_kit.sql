CREATE TABLE equipe_montagem_kit
(
    id                BIGSERIAL PRIMARY KEY,
    evento_id         BIGINT                   NOT NULL REFERENCES evento (id),
    apelido           VARCHAR(80)              NOT NULL,
    cor_identificacao VARCHAR(30),
    status            VARCHAR(30)              NOT NULL,
    criado_em         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_equipe_montagem_kit_evento_apelido UNIQUE (evento_id, apelido)
);

CREATE TABLE equipe_montagem_kit_integrante
(
    id        BIGSERIAL PRIMARY KEY,
    equipe_id BIGINT                   NOT NULL REFERENCES equipe_montagem_kit (id) ON DELETE CASCADE,
    pessoa_id BIGINT                   NOT NULL REFERENCES pessoa (id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_equipe_montagem_kit_integrante_pessoa UNIQUE (equipe_id, pessoa_id)
);

ALTER TABLE caderno_choro
    ADD COLUMN equipe_montagem_kit_id BIGINT REFERENCES equipe_montagem_kit (id),
    ADD COLUMN direcionado_equipe_montagem_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE caderno_choro_historico
    ADD COLUMN equipe_montagem_kit_id BIGINT REFERENCES equipe_montagem_kit (id);

CREATE INDEX idx_equipe_montagem_kit_evento
    ON equipe_montagem_kit (evento_id);

CREATE INDEX idx_equipe_montagem_kit_status
    ON equipe_montagem_kit (evento_id, status);

CREATE INDEX idx_equipe_montagem_kit_integrante_equipe
    ON equipe_montagem_kit_integrante (equipe_id);

CREATE INDEX idx_equipe_montagem_kit_integrante_pessoa
    ON equipe_montagem_kit_integrante (pessoa_id);

CREATE INDEX idx_caderno_choro_equipe_montagem_kit
    ON caderno_choro (evento_id, equipe_montagem_kit_id);

CREATE INDEX idx_caderno_choro_historico_equipe_montagem_kit
    ON caderno_choro_historico (equipe_montagem_kit_id);
