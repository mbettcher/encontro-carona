CREATE TABLE sobrinho_presenca
(
    id          BIGSERIAL PRIMARY KEY,
    evento_id   BIGINT                   NOT NULL REFERENCES evento (id),
    sobrinho_id BIGINT                   NOT NULL REFERENCES sobrinho (id),
    status      VARCHAR(30)              NOT NULL,
    origem      VARCHAR(30)              NOT NULL,
    observacao  VARCHAR(500),
    ocorrido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sobrinho_presenca_evento
    ON sobrinho_presenca (evento_id);

CREATE INDEX idx_sobrinho_presenca_sobrinho
    ON sobrinho_presenca (sobrinho_id);

CREATE INDEX idx_sobrinho_presenca_sobrinho_ocorrido
    ON sobrinho_presenca (sobrinho_id, ocorrido_em DESC);

CREATE INDEX idx_sobrinho_presenca_evento_ocorrido
    ON sobrinho_presenca (evento_id, ocorrido_em DESC);