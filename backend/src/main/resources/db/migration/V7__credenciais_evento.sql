CREATE TABLE credencial_evento
(
    id                   BIGSERIAL PRIMARY KEY,
    evento_id            BIGINT                   NOT NULL REFERENCES evento (id),
    tipo                 VARCHAR(30)              NOT NULL,
    codigo               VARCHAR(80)              NOT NULL,
    status               VARCHAR(30)              NOT NULL,
    tio_carona_evento_id BIGINT REFERENCES tio_carona_evento (id),
    sobrinho_id          BIGINT REFERENCES sobrinho (id),
    criado_em            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em        TIMESTAMP WITH TIME ZONE,

    CONSTRAINT uk_credencial_evento_codigo UNIQUE (codigo),
    CONSTRAINT uk_credencial_evento_tio UNIQUE (evento_id, tio_carona_evento_id),
    CONSTRAINT uk_credencial_evento_sobrinho UNIQUE (evento_id, sobrinho_id),

    CONSTRAINT ck_credencial_evento_referencia CHECK (
        (
            tipo = 'TIO_CARONA'
                AND tio_carona_evento_id IS NOT NULL
                AND sobrinho_id IS NULL
            )
            OR
        (
            tipo = 'SOBRINHO'
                AND sobrinho_id IS NOT NULL
                AND tio_carona_evento_id IS NULL
            )
        )
);

CREATE INDEX idx_credencial_evento_evento
    ON credencial_evento (evento_id);

CREATE INDEX idx_credencial_evento_tipo
    ON credencial_evento (evento_id, tipo);

CREATE INDEX idx_credencial_evento_status
    ON credencial_evento (evento_id, status);

CREATE INDEX idx_credencial_evento_codigo
    ON credencial_evento (codigo);