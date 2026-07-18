ALTER TABLE dupla_tio_carona
    ADD COLUMN paroquia_comunidade_id BIGINT;

UPDATE dupla_tio_carona d
SET paroquia_comunidade_id = e.paroquia_id
FROM evento e
WHERE d.evento_id = e.id
  AND d.paroquia_comunidade_id IS NULL;

ALTER TABLE dupla_tio_carona
    ALTER COLUMN paroquia_comunidade_id SET NOT NULL,
    ADD CONSTRAINT fk_dupla_tio_carona_paroquia_comunidade
        FOREIGN KEY (paroquia_comunidade_id) REFERENCES paroquia (id);

CREATE INDEX idx_dupla_tio_carona_paroquia_comunidade
    ON dupla_tio_carona (paroquia_comunidade_id);
