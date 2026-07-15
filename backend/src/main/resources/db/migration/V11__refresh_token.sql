CREATE TABLE refresh_token
(
    id                   BIGSERIAL PRIMARY KEY,
    usuario_id           BIGINT       NOT NULL,
    token_hash           VARCHAR(128) NOT NULL,
    criado_em            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expira_em            TIMESTAMPTZ  NOT NULL,
    revogado_em          TIMESTAMPTZ NULL,
    substituido_por_hash VARCHAR(128) NULL,
    ultimo_uso_em        TIMESTAMPTZ NULL,

    CONSTRAINT fk_refresh_token_usuario
        FOREIGN KEY (usuario_id)
            REFERENCES usuario_sistema (id)
);

CREATE UNIQUE INDEX idx_refresh_token_hash
    ON refresh_token (token_hash);

CREATE INDEX idx_refresh_token_usuario
    ON refresh_token (usuario_id);

CREATE INDEX idx_refresh_token_expira_em
    ON refresh_token (expira_em);

CREATE INDEX idx_refresh_token_revogado_em
    ON refresh_token (revogado_em);
