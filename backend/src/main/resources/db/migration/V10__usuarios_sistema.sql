CREATE TABLE usuario_sistema
(
    id            BIGSERIAL PRIMARY KEY,
    nome          VARCHAR(120)             NOT NULL,
    username      VARCHAR(120)             NOT NULL,
    senha_hash    VARCHAR(120)             NOT NULL,
    perfil        VARCHAR(40)              NOT NULL,
    ativo         BOOLEAN                  NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_usuario_sistema_username UNIQUE (username),
    CONSTRAINT ck_usuario_sistema_perfil CHECK (perfil IN (
                                                           'ADMIN',
                                                           'OPERADOR_ADMIN',
                                                           'OPERADOR_LEITURA',
                                                           'SOMENTE_LEITURA'
        ))
);

CREATE INDEX idx_usuario_sistema_ativo
    ON usuario_sistema (ativo);
