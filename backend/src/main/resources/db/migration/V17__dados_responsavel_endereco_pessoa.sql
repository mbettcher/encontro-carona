-- 1.2.1A
-- Amplia o cadastro principal de pessoa com dados reutilizáveis no cadastro
-- de encontristas. Os campos permanecem opcionais para preservar todos os
-- registros existentes.
--
-- O encontrista continuará armazenando uma cópia dos dados usados no evento,
-- funcionando como snapshot histórico da inscrição.

ALTER TABLE pessoa
    ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR (150);

ALTER TABLE pessoa
    ADD COLUMN IF NOT EXISTS responsavel_telefone VARCHAR (30);

ALTER TABLE pessoa
    ADD COLUMN IF NOT EXISTS endereco VARCHAR (180);

COMMENT
ON COLUMN pessoa.responsavel_nome IS
    'Nome do responsável principal da pessoa, quando aplicável.';

COMMENT
ON COLUMN pessoa.responsavel_telefone IS
    'Telefone do responsável principal da pessoa, quando aplicável.';

COMMENT
ON COLUMN pessoa.endereco IS
    'Endereço atual da pessoa para reutilização em novos eventos.';
