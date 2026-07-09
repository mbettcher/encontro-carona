CREATE TABLE caderno_choro
(
    id                      BIGSERIAL PRIMARY KEY,
    evento_id               BIGINT                   NOT NULL REFERENCES evento (id),
    dupla_id                BIGINT                   NOT NULL REFERENCES dupla_tio_carona (id),
    sobrinho_id             BIGINT                   NOT NULL REFERENCES sobrinho (id),
    status                  VARCHAR(40)              NOT NULL,
    entregue_a_dupla_em     TIMESTAMP WITH TIME ZONE,
    recebido_da_dupla_em    TIMESTAMP WITH TIME ZONE,
    conferido_em            TIMESTAMP WITH TIME ZONE,
    anexado_ao_kit_em       TIMESTAMP WITH TIME ZONE,
    entregue_ao_sobrinho_em TIMESTAMP WITH TIME ZONE,
    observacao              VARCHAR(500),
    criado_em               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_caderno_choro_evento_sobrinho UNIQUE (evento_id, sobrinho_id)
);

CREATE TABLE caderno_choro_historico
(
    id          BIGSERIAL PRIMARY KEY,
    evento_id   BIGINT                   NOT NULL REFERENCES evento (id),
    caderno_id  BIGINT                   NOT NULL REFERENCES caderno_choro (id),
    dupla_id    BIGINT                   NOT NULL REFERENCES dupla_tio_carona (id),
    sobrinho_id BIGINT                   NOT NULL REFERENCES sobrinho (id),
    status      VARCHAR(40)              NOT NULL,
    observacao  VARCHAR(500),
    ocorrido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_caderno_choro_evento
    ON caderno_choro (evento_id);

CREATE INDEX idx_caderno_choro_dupla
    ON caderno_choro (dupla_id);

CREATE INDEX idx_caderno_choro_sobrinho
    ON caderno_choro (sobrinho_id);

CREATE INDEX idx_caderno_choro_status
    ON caderno_choro (evento_id, status);

CREATE INDEX idx_caderno_choro_historico_caderno
    ON caderno_choro_historico (caderno_id, ocorrido_em DESC);

CREATE INDEX idx_caderno_choro_historico_evento
    ON caderno_choro_historico (evento_id, ocorrido_em DESC);