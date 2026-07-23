-- 1.2.1F
-- Complementa dados ausentes da Pessoa usando o snapshot mais recente de um
-- Encontrista já vinculado. Nenhum valor existente em Pessoa é sobrescrito.
--
-- Encontristas antigos sem pessoa_id continuam válidos e não são alterados.

WITH ultimo_sobrinho_por_pessoa AS (SELECT DISTINCT
ON (s.pessoa_id)
    s.pessoa_id,
    NULLIF (BTRIM(s.telefone), '') AS telefone,
    s.data_nascimento,
    NULLIF (BTRIM(s.responsavel_nome), '') AS responsavel_nome,
    NULLIF (BTRIM(s.responsavel_telefone), '') AS responsavel_telefone,
    NULLIF (BTRIM(s.endereco), '') AS endereco
FROM sobrinho s
WHERE s.pessoa_id IS NOT NULL
ORDER BY s.pessoa_id, s.criado_em DESC, s.id DESC
    )
UPDATE pessoa p
SET telefone             = CASE
                               WHEN NULLIF(BTRIM(p.telefone), '') IS NULL
                                   THEN u.telefone
                               ELSE p.telefone
    END,
    data_nascimento      = COALESCE(p.data_nascimento, u.data_nascimento),
    responsavel_nome     = CASE
                               WHEN NULLIF(BTRIM(p.responsavel_nome), '') IS NULL
                                   THEN u.responsavel_nome
                               ELSE p.responsavel_nome
        END,
    responsavel_telefone = CASE
                               WHEN NULLIF(BTRIM(p.responsavel_telefone), '') IS NULL
                                   THEN u.responsavel_telefone
                               ELSE p.responsavel_telefone
        END,
    endereco             = CASE
                               WHEN NULLIF(BTRIM(p.endereco), '') IS NULL
                                   THEN u.endereco
                               ELSE p.endereco
        END FROM ultimo_sobrinho_por_pessoa u
WHERE p.id = u.pessoa_id
  AND (
    (NULLIF (BTRIM(p.telefone)
    , '') IS NULL
  AND u.telefone IS NOT NULL)
   OR (p.data_nascimento IS NULL
  AND u.data_nascimento IS NOT NULL)
   OR (NULLIF (BTRIM(p.responsavel_nome)
    , '') IS NULL
  AND u.responsavel_nome IS NOT NULL)
   OR (NULLIF (BTRIM(p.responsavel_telefone)
    , '') IS NULL
  AND u.responsavel_telefone IS NOT NULL)
   OR (NULLIF (BTRIM(p.endereco)
    , '') IS NULL
  AND u.endereco IS NOT NULL)
    );
