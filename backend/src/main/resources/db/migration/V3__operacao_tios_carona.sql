ALTER TABLE tio_carona_evento
    ADD COLUMN codigo_identificacao VARCHAR(80),
    ADD COLUMN checkin_realizado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN checkin_em TIMESTAMP WITH TIME ZONE,
    ADD COLUMN checkout_realizado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN checkout_em TIMESTAMP WITH TIME ZONE;

UPDATE tio_carona_evento
SET codigo_identificacao = 'TC-' || LPAD(id::TEXT, 6, '0')
WHERE codigo_identificacao IS NULL;

ALTER TABLE tio_carona_evento
    ALTER COLUMN codigo_identificacao SET NOT NULL;

ALTER TABLE tio_carona_evento
    ADD CONSTRAINT uk_tio_carona_evento_codigo_identificacao UNIQUE (codigo_identificacao);

CREATE INDEX idx_tio_carona_evento_codigo_identificacao
    ON tio_carona_evento (codigo_identificacao);

CREATE INDEX idx_tio_carona_evento_operacao
    ON tio_carona_evento (evento_id, status, checkin_realizado, checkout_realizado);