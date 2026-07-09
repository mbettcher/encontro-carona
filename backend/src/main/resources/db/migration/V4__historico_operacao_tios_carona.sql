CREATE TABLE tio_carona_evento_operacao
(
    id                   BIGSERIAL PRIMARY KEY,
    evento_id            BIGINT                   NOT NULL REFERENCES evento (id),
    tio_carona_evento_id BIGINT                   NOT NULL REFERENCES tio_carona_evento (id),
    tipo                 VARCHAR(30)              NOT NULL,
    origem               VARCHAR(30)              NOT NULL,
    codigo_identificacao VARCHAR(80),
    ocorrido_em          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tio_operacao_evento
    ON tio_carona_evento_operacao (evento_id);

CREATE INDEX idx_tio_operacao_tio
    ON tio_carona_evento_operacao (tio_carona_evento_id);

CREATE INDEX idx_tio_operacao_tio_ocorrido
    ON tio_carona_evento_operacao (tio_carona_evento_id, ocorrido_em DESC);

CREATE INDEX idx_tio_operacao_evento_ocorrido
    ON tio_carona_evento_operacao (evento_id, ocorrido_em DESC);