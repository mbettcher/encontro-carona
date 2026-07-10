-- Ajusta a regra de vínculo ativo do sobrinho:
-- antes, a constraint UNIQUE(evento_id, sobrinho_id, status) impedia também múltiplos vínculos removidos.
-- agora, apenas um vínculo ATIVO é permitido por sobrinho no evento.

ALTER TABLE sobrinho_dupla
DROP
CONSTRAINT IF EXISTS uk_sobrinho_dupla_ativa;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sobrinho_dupla_um_ativo_por_evento
    ON sobrinho_dupla (evento_id, sobrinho_id)
    WHERE status = 'ATIVO';

CREATE INDEX IF NOT EXISTS idx_sobrinho_dupla_evento_sobrinho_status
    ON sobrinho_dupla (evento_id, sobrinho_id, status);

CREATE INDEX IF NOT EXISTS idx_dupla_tio_carona_evento_status
    ON dupla_tio_carona (evento_id, status);

CREATE INDEX IF NOT EXISTS idx_dupla_tio_carona_tio1_status
    ON dupla_tio_carona (evento_id, tio_1_id, status);

CREATE INDEX IF NOT EXISTS idx_dupla_tio_carona_tio2_status
    ON dupla_tio_carona (evento_id, tio_2_id, status);