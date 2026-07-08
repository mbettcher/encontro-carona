CREATE TABLE paroquia (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(180),
    cidade VARCHAR(80),
    uf VARCHAR(2),
    telefone VARCHAR(30),
    email VARCHAR(120),
    responsavel VARCHAR(120),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE evento (
    id BIGSERIAL PRIMARY KEY,
    paroquia_id BIGINT NOT NULL REFERENCES paroquia(id),
    nome VARCHAR(150) NOT NULL,
    tema VARCHAR(150),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    local VARCHAR(180),
    status VARCHAR(30) NOT NULL,
    monitoramento_inicio TIME,
    monitoramento_fim TIME,
    monitoramento_ativo BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE pessoa (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30),
    email VARCHAR(120),
    data_nascimento DATE,
    tipo VARCHAR(30) NOT NULL,
    observacoes VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE tio_carona_evento (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES evento(id),
    pessoa_id BIGINT NOT NULL REFERENCES pessoa(id),
    status VARCHAR(30) NOT NULL,
    observacoes VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tio_evento_pessoa UNIQUE (evento_id, pessoa_id)
);

CREATE TABLE dupla_tio_carona (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES evento(id),
    tio_1_id BIGINT NOT NULL REFERENCES tio_carona_evento(id),
    tio_2_id BIGINT NOT NULL REFERENCES tio_carona_evento(id),
    codigo VARCHAR(40) NOT NULL UNIQUE,
    apelido VARCHAR(120),
    status VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_dupla_tios_diferentes CHECK (tio_1_id <> tio_2_id)
);

CREATE TABLE sobrinho (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES evento(id),
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30),
    responsavel_nome VARCHAR(150),
    responsavel_telefone VARCHAR(30),
    endereco VARCHAR(180),
    data_nascimento DATE,
    restricao_alimentar VARCHAR(500),
    observacao_medica VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE sobrinho_dupla (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL REFERENCES evento(id),
    sobrinho_id BIGINT NOT NULL REFERENCES sobrinho(id),
    dupla_id BIGINT NOT NULL REFERENCES dupla_tio_carona(id),
    status VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_sobrinho_dupla_ativa UNIQUE (evento_id, sobrinho_id, status)
);

CREATE INDEX idx_evento_paroquia ON evento(paroquia_id);
CREATE INDEX idx_tio_evento ON tio_carona_evento(evento_id);
CREATE INDEX idx_dupla_evento ON dupla_tio_carona(evento_id);
CREATE INDEX idx_sobrinho_evento ON sobrinho(evento_id);
CREATE INDEX idx_vinculo_evento_dupla ON sobrinho_dupla(evento_id, dupla_id);
