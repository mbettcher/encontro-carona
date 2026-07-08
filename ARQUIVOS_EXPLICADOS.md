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


## Ajuste de porta do PostgreSQL

### `infra/docker-compose.yml`

O PostgreSQL do container continua escutando na porta interna `5432`, mas foi exposto no host pela porta `55432`:

```yaml
ports:
  - "55432:5432"
```

Isso evita conflito quando já existe PostgreSQL instalado localmente usando a porta `5432`.

### `backend/src/main/resources/application.yml`

O backend foi ajustado para conectar na porta externa do Docker:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:55432/encontro_carona}
```

Também foi adicionado:

```yaml
driver-class-name: org.postgresql.Driver
jpa:
  database-platform: org.hibernate.dialect.PostgreSQLDialect
```

Essas configurações deixam explícito o driver e o dialeto do PostgreSQL. Isso ajuda a evitar o erro do Hibernate informando que não conseguiu determinar o `Dialect` quando a conexão com o banco não é obtida corretamente.


## Ajuste aplicado: Flyway no Spring Boot 4

### Arquivo alterado

```text
backend/pom.xml
```

### O que foi alterado

Foi adicionada a dependência:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>
```

### Motivo

O backend estava conectando corretamente ao PostgreSQL, mas o Flyway não aparecia nos logs de inicialização. Com isso, o Hibernate executava `ddl-auto=validate` antes de qualquer tabela existir, gerando erro de tabela ausente, por exemplo `dupla_tio_carona`.

### Resultado esperado

Ao iniciar o backend, o Flyway deve criar as tabelas antes da validação JPA/Hibernate.

## Bloco 2 - CRUD inicial no frontend Angular

Este bloco transforma as listagens simples do Bloco 1 em telas operáveis.

### Arquivos alterados no frontend

- `frontend/src/app/shared/models.ts`
  - Centraliza os modelos de resposta e request usados pelo Angular.
  - Inclui Paróquia, Evento, Pessoa, TioCaronaEvento, DuplaTioCarona, Sobrinho e SobrinhoDupla.

- `frontend/src/app/core/api.service.ts`
  - Centraliza chamadas REST para a API Spring Boot.
  - Inclui métodos de listar, criar e atualizar Paróquia, Evento e Pessoa.
  - Inclui métodos operacionais de adicionar tio carona ao evento, formar dupla, cadastrar sobrinho e vincular sobrinho à dupla.

- `frontend/src/app/shared/utils/http-error.util.ts`
  - Extrai mensagens amigáveis de erro HTTP.
  - Evita repetir tratamento de erro dentro de cada componente.

- `frontend/src/app/features/paroquias/paroquia-list.component.ts`
  - Tela com formulário de cadastro/edição e tabela de paróquias.

- `frontend/src/app/features/pessoas/pessoa-list.component.ts`
  - Tela com formulário de cadastro/edição, busca simples e tabela de pessoas.
  - Pessoas do tipo `TIO_CARONA` são usadas depois na gestão do evento.

- `frontend/src/app/features/eventos/evento-list.component.ts`
  - Tela com formulário de cadastro/edição de eventos.
  - Mantém os campos de janela de monitoramento: `monitoramentoInicio`, `monitoramentoFim` e `monitoramentoAtivo`.
  - Adiciona botão `Gerir` para abrir o fluxo operacional do evento.

- `frontend/src/app/features/evento-gestao/evento-gestao.component.ts`
  - Nova tela central de gestão do evento.
  - Abas: Tios carona, Duplas, Sobrinhos e Vínculos.
  - Permite adicionar tios carona ao evento, formar duplas, cadastrar sobrinhos e vincular sobrinhos às duplas.

- `frontend/src/app/app.routes.ts`
  - Adiciona a rota `/eventos/:eventoId/gestao`.

- `frontend/src/app/app.component.ts`
  - Atualiza menu, destaque visual e navegação mobile básica.

- `frontend/src/styles.css`
  - Ajusta estilo da navegação, cards, tabelas e formulários.

### Fluxo de teste recomendado

1. Subir PostgreSQL:
   ```bash
   cd infra
   docker compose up -d
   ```

2. Subir backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. Subir frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Testar no navegador:
   - `http://localhost:4200/paroquias`
   - `http://localhost:4200/pessoas`
   - `http://localhost:4200/eventos`

5. Fluxo funcional:
   - Cadastrar/editar paróquia.
   - Cadastrar/editar evento.
   - Cadastrar pessoas do tipo `TIO_CARONA`.
   - Abrir Eventos > Gerir.
   - Adicionar tios ao evento.
   - Formar dupla com dois tios.
   - Cadastrar sobrinhos.
   - Vincular sobrinhos à dupla.

### Observação importante

Neste bloco, algumas entidades operacionais ainda têm apenas criação/listagem, porque o backend inicial ainda não expõe atualização/remoção para todos os recursos aninhados do evento. Isso evita criar telas que chamariam endpoints inexistentes. Atualização e remoção de tios, duplas, sobrinhos e vínculos ficam para um bloco próprio de regras operacionais.

## Refatoração solicitada: frontend separado por feature

Para melhorar legibilidade e manutenção, as telas Angular foram separadas em arquivos próprios.

### `/frontend/src/app/features/paroquias/`

```text
paroquias.component.ts
paroquias.component.html
paroquias.component.scss
paroquias.service.ts
```

Responsável por cadastro, edição e listagem de paróquias.

### `/frontend/src/app/features/eventos/`

```text
eventos.component.ts
eventos.component.html
eventos.component.scss
eventos.service.ts
```

Responsável por cadastro, edição e listagem de eventos. Mantém os campos da futura janela de monitoramento no mapa.

### `/frontend/src/app/features/pessoas/`

```text
pessoas.component.ts
pessoas.component.html
pessoas.component.scss
pessoas.service.ts
```

Responsável por cadastro, edição, busca e listagem de pessoas. Pessoas do tipo `TIO_CARONA` são usadas depois na gestão do evento.

### `/frontend/src/app/features/evento-gestao/`

```text
evento-gestao.component.ts
evento-gestao.component.html
evento-gestao.component.scss
evento-gestao.service.ts
```

Responsável pelo hub operacional do evento, com abas para:

- tios carona;
- duplas;
- sobrinhos;
- vínculos.

### `/frontend/src/app/features/dashboard/`

```text
dashboard.component.ts
dashboard.component.html
dashboard.component.scss
dashboard.service.ts
```

Responsável pelo painel inicial. Por enquanto, os indicadores ainda são estáticos e serão ligados ao backend em bloco futuro.

### `/frontend/src/app/features/operacao/`

```text
operacao.component.ts
operacao.component.html
operacao.component.scss
operacao.service.ts
```

Responsável pela visão inicial das operações futuras: credenciais, check-in, Caderno do Choro e mapa.

### `/frontend/src/app/app.component.*`

O shell principal também foi separado em:

```text
app.component.ts
app.component.html
app.component.scss
```

Isso mantém o layout principal mais legível e segue o mesmo padrão das features.
