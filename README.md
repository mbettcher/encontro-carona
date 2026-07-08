# Encontro Carona — Aplicativo para Encontro de Jovens e Adolescentes

Projeto inicial para controle de paróquia, evento, tios carona, duplas, sobrinhos, credenciais com QR Code, check-in, entrega dos Cadernos do Choro, checkout e futura localização em mapa.

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
