# Encontro Carona — Aplicativo para Encontro de Jovens e Adolescentes

Projeto inicial para controle de paróquia, evento, tios carona, duplas, sobrinhos, credenciais com QR Code, check-in, entrega dos Cadernos do Choro, checkout e futura localização em mapa.

## Correção importante: porta do PostgreSQL no Docker

Para evitar conflito com uma instalação local do PostgreSQL, o `docker-compose.yml` usa a porta **55432** no Windows/host e mantém a porta **5432** dentro do container:

```yaml
ports:
  - "55432:5432"
```

Por isso, a aplicação Spring Boot deve apontar para:

```properties
jdbc:postgresql://localhost:55432/encontro_carona
```

O arquivo `backend/src/main/resources/application.yml` já está configurado assim por padrão:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:55432/encontro_carona}
    username: ${DB_USERNAME:encontro}
    password: ${DB_PASSWORD:encontro}
    driver-class-name: org.postgresql.Driver
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

Se desejar usar outra porta, altere a porta do lado esquerdo no Docker e a URL JDBC no backend. Exemplo: `5555:5432` exige `jdbc:postgresql://localhost:5555/encontro_carona`.

### Como validar o banco antes de subir o backend

Na pasta `infra`:

```bash
docker compose up -d
docker ps
```

Teste a conexão:

```bash
docker exec -it encontro-carona-postgres psql -U encontro -d encontro_carona -c "select current_database(), current_user;"
```

Depois suba o backend pela pasta `backend`:

```bash
./mvnw spring-boot:run
```

No Windows, se não existir `mvnw.cmd` no pacote, use:

```bash
mvn spring-boot:run
```


## Decisão arquitetural

Nesta primeira versão o projeto foi iniciado como **monolito modular**:

- entrega mais rápida;
- menos infraestrutura;
- menos complexidade de autenticação e comunicação;
- módulos internos separados por domínio, permitindo futura extração para microserviços se o projeto crescer.

## Stack mínima definida

- Backend: Java 21 + Spring Boot 4.x
- Frontend: Angular 21
- UI: Bootstrap 5.x
- Ícones: Font Awesome Free 7.x
- Banco: PostgreSQL
- Migrações: Flyway

## Estrutura

```text
backend/   API REST Spring Boot
frontend/  Aplicação Angular administrativa/responsiva
infra/     docker-compose com PostgreSQL
```

## Como subir o banco

```bash
cd infra
docker compose up -d
```

Banco padrão:

```text
host: localhost
porta: 5432
database: encontro_carona
user: encontro
password: encontro
```

## Como subir o backend

```bash
cd backend
./mvnw spring-boot:run
```

Caso ainda não exista Maven Wrapper, usar Maven instalado:

```bash
mvn spring-boot:run
```

API base:

```text
http://localhost:8080/api
```

Swagger/OpenAPI:

```text
http://localhost:8080/swagger-ui/index.html
```

## Como subir o frontend

```bash
cd frontend
npm install
npm start
```

Aplicação:

```text
http://localhost:4200
```

## Módulos do MVP 1

1. Paróquia
2. Evento
3. Pessoa
4. Tio carona no evento
5. Dupla de tio carona
6. Sobrinho
7. Vínculo do sobrinho com dupla

## Roadmap já previsto

- geração de credenciais com QR Code;
- check-in da dupla;
- confirmação de presença dos sobrinhos;
- entrega dos Cadernos do Choro;
- checkout da dupla;
- monitoramento dos tios caronas em mapa, possivelmente Google Maps;
- janela de monitoramento por evento, por exemplo das 05:00 às 20:00;
- encerramento automático do monitoramento após checkout ou fim da janela;
- cuidados com LGPD, consentimento e permissões de localização.

## Convenções importantes

- Usar português nos nomes de domínio do sistema, pois reflete o vocabulário real da pastoral/paróquia.
- Usar DTOs/records para entrada e saída da API.
- Não expor entidades JPA diretamente no controller.
- Criar migrações Flyway para toda mudança de banco.
- Evitar regra de negócio no controller.
- Cada endpoint recebe `eventoId` quando a operação depende de um evento.

## Próximo bloco sugerido

**Bloco 2 — Credenciais e QR Code**

- criar tabela de credenciais;
- gerar código público seguro da dupla;
- criar endpoint para gerar credencial;
- criar layout imprimível da credencial no Angular;
- preparar leitura por câmera no frontend.


## Correção Flyway no Spring Boot 4

Se o backend conectar no PostgreSQL, mas falhar com erro semelhante a:

```text
Schema validation: missing table [dupla_tio_carona]
```

isso indica que o Hibernate conseguiu acessar o banco, mas o Flyway não executou as migrations antes da validação do schema.

Neste projeto, a correção aplicada foi usar o starter próprio do Spring Boot 4 para Flyway:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>
```

Após aplicar essa correção, reinicie o banco de desenvolvimento para permitir que as migrations sejam recriadas do zero:

```bash
cd infra
docker compose down -v
docker compose up -d
```

Depois suba o backend:

```bash
cd ../backend
mvn clean spring-boot:run
```

No log de inicialização devem aparecer mensagens do Flyway aplicando as migrations `V1__estrutura_inicial.sql` e `V2__sementes_dev.sql`.

Para validar as tabelas:

```bash
docker exec -it encontro-carona-postgres psql -U encontro -d encontro_carona -c "\dt"
```

Para validar o histórico do Flyway:

```bash
docker exec -it encontro-carona-postgres psql -U encontro -d encontro_carona -c "select installed_rank, version, description, success from flyway_schema_history;"
```

## Bloco 2 - CRUD inicial no frontend

O Bloco 2 adiciona telas reais de cadastro no Angular 21.

### O que já é possível fazer

- Cadastrar e editar paróquias.
- Cadastrar e editar eventos.
- Configurar janela futura de monitoramento no evento, por exemplo das 05:00 às 20:00.
- Cadastrar e editar pessoas.
- Adicionar pessoas do tipo Tio carona ao evento.
- Formar duplas de tios carona.
- Cadastrar sobrinhos dentro do evento.
- Vincular sobrinhos a uma dupla.

### URLs principais do frontend

- `/paroquias`: cadastro de paróquias.
- `/pessoas`: cadastro de pessoas.
- `/eventos`: cadastro de eventos.
- `/eventos/:eventoId/gestao`: gestão operacional do evento.

### Ordem recomendada para usar o sistema

1. Cadastre uma paróquia.
2. Cadastre um evento vinculado à paróquia.
3. Cadastre pessoas do tipo `TIO_CARONA`.
4. Acesse o botão `Gerir` no evento.
5. Adicione os tios carona ao evento.
6. Forme duplas com dois tios.
7. Cadastre os sobrinhos.
8. Vincule cada sobrinho a uma dupla.

### Limites conscientes deste bloco

- Não há autenticação ainda.
- Não há remoção de registros ainda.
- A tela de gestão usa os endpoints disponíveis no backend do Bloco 1.
- Check-in, checkout, credenciais com QR Code e entrega do Caderno do Choro entram nos próximos blocos.
- O mapa de monitoramento segue registrado como lista de desejos/roadmap, com janela de horário já representada no cadastro do evento.

## Refatoração do Bloco 2 - Frontend por feature

Após a primeira validação do frontend, a estrutura Angular foi reorganizada para facilitar leitura, manutenção e evolução.

Cada feature agora segue o padrão:

```text
frontend/src/app/features/<feature>/
├── <feature>.component.ts
├── <feature>.component.html
├── <feature>.component.scss
└── <feature>.service.ts
```

### Por que essa mudança foi feita

- Evita componentes muito grandes com template inline.
- Separa responsabilidade visual, lógica e acesso à API.
- Facilita manutenção por tela/funcionalidade.
- Facilita futuras revisões de UX.
- Evita um `ApiService` central crescer demais e virar um ponto de acoplamento.

### Features refatoradas

```text
features/dashboard/
features/paroquias/
features/eventos/
features/pessoas/
features/evento-gestao/
features/operacao/
```

### Padrão adotado

- `component.ts`: controla estado, forms, signals e ações de tela.
- `component.html`: contém somente o template visual.
- `component.scss`: reservado para estilos específicos da feature.
- `service.ts`: contém chamadas HTTP ou dados próprios da feature.

### Observação sobre `core/api.service.ts`

O arquivo foi mantido temporariamente para compatibilidade e referência, mas as novas telas do Bloco 2 já usam services próprios por feature, como:

```text
paroquias.service.ts
eventos.service.ts
pessoas.service.ts
evento-gestao.service.ts
```

Em um próximo bloco, se não houver mais dependência dele, o `core/api.service.ts` poderá ser removido com segurança.

### Padrão de frontend Angular

O frontend foi organizado por feature, mantendo cada funcionalidade com arquivos separados:

```text
feature/
├── feature.component.ts
├── feature.component.html
├── feature.component.scss
└── feature.service.ts
```

Nos templates, usar o control flow moderno do Angular:

```html
@if (mensagemErro()) {
  <div class="alert alert-danger">{{ mensagemErro() }}</div>
}

@for (item of itens(); track item.id) {
  <tr>
    <td>{{ item.nome }}</td>
  </tr>
}
```

Evitar `*ngIf` e `*ngFor` nos novos templates.

## v1.1.1

### Melhorias
- exclusão segura de duplas sem utilização;
- remoção do vínculo de tio carona com o evento;
- preservação do cadastro global da pessoa;
- pesquisa nos selects de Paróquia/Comunidade e Tio Carona;
- bloqueio de pessoas inativas em novos vínculos;
- preservação de integrantes inativos já vinculados às equipes;
- validações equivalentes no backend contra chamadas diretas;
- padronização das confirmações destrutivas com modal PrimeNG.

### Validações
- regressão da Gestão do Evento aprovada;
- permissões e mensagens de erro aprovadas;
- builds de backend e frontend aprovados;
- fluxos operacionais e regras de histórico aprovados.