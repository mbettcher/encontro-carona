-- Vincula o encontrista/sobrinho do evento a uma Pessoa cadastrada.
-- pessoa_id fica nullable para preservar registros antigos criados diretamente no evento.

ALTER TABLE sobrinho
    ADD COLUMN IF NOT EXISTS pessoa_id BIGINT;

ALTER TABLE sobrinho
DROP CONSTRAINT IF EXISTS fk_sobrinho_pessoa;

ALTER TABLE sobrinho
    ADD CONSTRAINT fk_sobrinho_pessoa
        FOREIGN KEY (pessoa_id)
            REFERENCES pessoa (id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_sobrinho_evento_pessoa
    ON sobrinho (evento_id, pessoa_id)
    WHERE pessoa_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sobrinho_pessoa
    ON sobrinho (pessoa_id);