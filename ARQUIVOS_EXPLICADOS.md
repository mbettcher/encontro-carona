# Explicação dos arquivos entregues

## `/infra/docker-compose.yml`

Sobe um PostgreSQL local chamado `encontro-carona-postgres`. Use este banco no desenvolvimento. O volume preserva os dados entre reinicializações.

## `/backend/pom.xml`

Define o projeto Spring Boot 4.x com Java 21. Inclui:

- Web MVC: controllers REST;
- JPA: persistência;
- Validation: validações com annotations;
- Flyway: migrações SQL;
- PostgreSQL Driver;
- Springdoc OpenAPI: documentação Swagger;
- ZXing: futura geração de QR Code.

## `/backend/src/main/resources/application.yml`

Configura a conexão com PostgreSQL, Flyway e JPA. O `ddl-auto: validate` impede que o Hibernate altere o banco sozinho. Toda mudança estrutural deve passar por migração Flyway.

## `/backend/src/main/resources/db/migration/V1__estrutura_inicial.sql`

Cria as tabelas iniciais:

- `paroquia`
- `evento`
- `pessoa`
- `tio_carona_evento`
- `dupla_tio_carona`
- `sobrinho`
- `sobrinho_dupla`

Também cria índices principais para consultas por evento.

## `/backend/src/main/resources/db/migration/V2__sementes_dev.sql`

Insere dados básicos de desenvolvimento: uma paróquia exemplo e um evento exemplo. Esse arquivo ajuda a validar rapidamente se frontend e backend estão conversando.

## Pacote `common`

Contém tratamento padronizado de erros:

- `BusinessException`: regra de negócio violada;
- `ResourceNotFoundException`: registro não encontrado;
- `RestExceptionHandler`: transforma erros em respostas JSON amigáveis.

## Pacote `paroquia`

CRUD inicial de paróquias.

Endpoints:

```text
GET  /api/paroquias
POST /api/paroquias
PUT  /api/paroquias/{id}
```

## Pacote `evento`

Cadastro de eventos e campos de monitoramento futuro:

- `monitoramentoInicio`
- `monitoramentoFim`
- `monitoramentoAtivo`

Esses campos já preparam a funcionalidade do mapa com janela de horário, sem obrigar a implementação agora.

Endpoints:

```text
GET  /api/eventos
POST /api/eventos
PUT  /api/eventos/{id}
```

## Pacote `pessoa`

Cadastro genérico de pessoas. A pessoa pode ser `TIO_CARONA`, `SOBRINHO`, `RESPONSAVEL` ou `EQUIPE`.

Endpoints:

```text
GET  /api/pessoas
POST /api/pessoas
PUT  /api/pessoas/{id}
```

## Pacote `tio`

Vincula uma pessoa como tio carona em determinado evento.

Endpoints:

```text
GET  /api/eventos/{eventoId}/tios-carona
POST /api/eventos/{eventoId}/tios-carona
```

## Pacote `dupla`

Forma a dupla de tios carona. Regra inicial: os dois tios precisam ser diferentes.

Endpoints:

```text
GET  /api/eventos/{eventoId}/duplas
POST /api/eventos/{eventoId}/duplas
```

## Pacote `sobrinho`

Cadastro dos sobrinhos do evento, com campos para responsável, telefone, endereço, restrição alimentar e observação médica.

Endpoints:

```text
GET  /api/eventos/{eventoId}/sobrinhos
POST /api/eventos/{eventoId}/sobrinhos
```

## Pacote `vinculo`

Vincula sobrinho a uma dupla. Regra inicial: um sobrinho só pode ter um vínculo ativo por evento.

Endpoints:

```text
GET  /api/eventos/{eventoId}/vinculos/duplas/{duplaId}/sobrinhos
POST /api/eventos/{eventoId}/vinculos
```

## `/frontend/package.json`

Define Angular 21, Bootstrap 5.3.8 e Font Awesome Free 7.

## `/frontend/angular.json`

Inclui os arquivos CSS do Bootstrap e Font Awesome no build do Angular.

## `/frontend/src/app/app.component.ts`

Cria o shell visual inicial com menu lateral e área principal.

## `/frontend/src/app/app.routes.ts`

Rotas iniciais:

- `/dashboard`
- `/paroquias`
- `/eventos`
- `/pessoas`
- `/operacao`

## `/frontend/src/app/core/api.service.ts`

Serviço central para consumir a API. Nesta primeira entrega contém métodos de listagem para paróquias, eventos e pessoas.

## `/frontend/src/app/features/*`

Telas iniciais de listagem e operação. Elas ainda são simples, mas já estabelecem o padrão visual e de consumo do backend.
