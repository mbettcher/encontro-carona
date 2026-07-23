-- Verificações pós-migration 1.2.1

-- 1. Colunas adicionadas à Pessoa.
SELECT column_name, data_type, character_maximum_length, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'pessoa'
   AND column_name IN (
       'responsavel_nome',
       'responsavel_telefone',
       'endereco'
   )
 ORDER BY column_name;

-- 2. Encontristas exclusivos do evento continuam preservados.
SELECT COUNT(*) AS encontristas_sem_pessoa
  FROM sobrinho
 WHERE pessoa_id IS NULL;

-- 3. Duplicidades de Pessoa no mesmo evento. O resultado esperado é zero linhas.
SELECT evento_id, pessoa_id, COUNT(*) AS quantidade
  FROM sobrinho
 WHERE pessoa_id IS NOT NULL
 GROUP BY evento_id, pessoa_id
HAVING COUNT(*) > 1;

-- 4. Pessoas vinculadas que ainda possuem dados compartilhados ausentes.
SELECT p.id,
       p.nome,
       p.telefone,
       p.data_nascimento,
       p.responsavel_nome,
       p.responsavel_telefone,
       p.endereco
  FROM pessoa p
 WHERE EXISTS (
       SELECT 1
         FROM sobrinho s
        WHERE s.pessoa_id = p.id
   )
   AND (
       NULLIF(BTRIM(p.telefone), '') IS NULL
       OR p.data_nascimento IS NULL
       OR NULLIF(BTRIM(p.responsavel_nome), '') IS NULL
       OR NULLIF(BTRIM(p.responsavel_telefone), '') IS NULL
       OR NULLIF(BTRIM(p.endereco), '') IS NULL
   )
 ORDER BY p.nome;

-- 5. Histórico do Flyway.
SELECT installed_rank,
       version,
       description,
       type,
       installed_on,
       success
  FROM flyway_schema_history
 ORDER BY installed_rank;
