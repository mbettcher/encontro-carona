ALTER TABLE paroquia
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE pessoa
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_paroquia_ativo ON paroquia (ativo);
CREATE INDEX idx_pessoa_ativo ON pessoa (ativo);
