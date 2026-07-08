INSERT INTO paroquia (nome, endereco, cidade, uf, telefone, email, responsavel)
VALUES ('Paróquia Exemplo', 'Rua da Matriz, 100', 'Cidade Exemplo', 'SP', '(00) 00000-0000', 'paroquia@example.com', 'Coordenação do Encontro');

INSERT INTO evento (paroquia_id, nome, tema, data_inicio, data_fim, local, status, monitoramento_inicio, monitoramento_fim, monitoramento_ativo)
VALUES (1, 'Encontro de Jovens 2026', 'Máquina de Sucesso', CURRENT_DATE, CURRENT_DATE + 1, 'Salão Paroquial', 'PLANEJADO', '05:00', '20:00', false);
