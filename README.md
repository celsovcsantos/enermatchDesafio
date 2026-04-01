# 🔋 Enerdata API

API robusta para integração, persistência e análise de dados de consumo de energia elétrica nos Estados Unidos, utilizando a API pública da **EIA (U.S. Energy Information Administration)**.

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Configuração do Ambiente](#-configuração-do-ambiente)
- [Execução com Docker](#-execução-com-docker)
- [Execução Local (Desenvolvimento)](#-execução-local-desenvolvimento)
- [Endpoints da API](#-endpoints-da-api)
- [Autenticação](#-autenticação)
- [Documentação Swagger](#-documentação-swagger)
- [Testes](#-testes)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🔍 Visão Geral

A Enerdata API coleta automaticamente dados horários de consumo de eletricidade por região RTO (Regional Transmission Organization) da EIA, armazena em PostgreSQL e expõe endpoints para análise e relatórios.

**Funcionalidades principais:**
- ⚡ Sincronização automática (Cron) e manual com a API da EIA
- 📊 Relatórios de consumo: total, média, pico e por região
- 🔒 Autenticação via token estático (JWT Bearer)
- 🛡️ Rate Limiting para proteção contra abuso
- 📝 Logs estruturados com Pino
- 📖 Documentação interativa com Swagger

---

## 🛠 Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| NestJS | 11.x | Framework principal |
| TypeScript | 5.x | Linguagem |
| PostgreSQL | 16 | Banco de dados |
| TypeORM | 0.3.x | ORM |
| Docker | - | Containerização |

---

## 📦 Pré-requisitos

Para execução **com Docker** (recomendado):
- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) V2

Para execução **local**:
- Node.js 20+
- npm 10+
- PostgreSQL 16

---

## ⚙️ Configuração do Ambiente

### 1. Clone o repositório e acesse o diretório

```bash
git clone <url-do-repositorio>
cd enermatchDesafio
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha obrigatoriamente:

```dotenv
# Chave de API da EIA (obrigatório!)
# Obtenha em: https://www.eia.gov/opendata/register.php
EIA_API_KEY=SUA_CHAVE_AQUI

# Token de autenticação da API (defina um valor secreto)
STATIC_JWT_SECRET=seu_token_estatico_super_secreto
```

> ⚠️ **Importante:** A variável `EIA_API_KEY` é obrigatória para o funcionamento das sincronizações. Registre-se em [eia.gov](https://www.eia.gov/opendata/register.php) para obter uma chave gratuita.

---

## 🐳 Execução com Docker

### Subir todos os serviços (aplicação + banco de dados)

```bash
docker compose up -d
```

Este comando irá:
1. Construir a imagem da aplicação (multi-stage build com Node.js 20 Alpine)
2. Iniciar o container do PostgreSQL 16
3. Aguardar o banco de dados ficar saudável (healthcheck)
4. Iniciar o container da aplicação NestJS
5. Executar as migrations automaticamente na inicialização

### Verificar os logs

```bash
# Todos os serviços
docker compose logs -f

# Apenas a aplicação
docker compose logs -f app

# Apenas o banco de dados
docker compose logs -f postgres
```

### Verificar status dos containers

```bash
docker compose ps
```

### Parar os serviços

```bash
# Parar sem remover volumes
docker compose down

# Parar e remover volumes (limpa o banco de dados)
docker compose down -v
```

### Reconstruir a imagem após alterações

```bash
docker compose up -d --build
```

---

## 💻 Execução Local (Desenvolvimento)

### 1. Instale as dependências

```bash
npm install
```

### 2. Suba apenas o banco de dados via Docker

```bash
docker compose up -d postgres
```

### 3. Execute as migrations

```bash
npm run migration:run
```

### 4. Inicie a aplicação em modo de desenvolvimento

```bash
npm run start:dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Outros comandos úteis

```bash
# Build de produção
npm run build

# Iniciar em modo produção (após build)
npm run start:prod

# Gerar nova migration
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Reverter última migration
npm run migration:revert
```

---

## 📡 Endpoints da API

Todos os endpoints requerem o header de autenticação:
```
Authorization: Bearer <STATIC_JWT_SECRET>
```

### 🔄 Sincronização

#### `POST /energy/sync`
Dispara a sincronização manual de dados com a API da EIA.

**Body (opcional):**
```json
{
  "start": "2024-01-01T00",
  "end": "2024-01-01T23"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `start` | string (opcional) | Data/hora de início no formato `YYYY-MM-DDTHH` |
| `end` | string (opcional) | Data/hora de fim no formato `YYYY-MM-DDTHH` |

**Exemplo:**
```bash
curl -X POST http://localhost:3000/energy/sync \
  -H "Authorization: Bearer seu_token_estatico_super_secreto" \
  -H "Content-Type: application/json" \
  -d '{"start": "2024-01-01T00", "end": "2024-01-01T23"}'
```

---

### 📊 Relatórios

Todos os endpoints de relatórios aceitam os seguintes filtros via query string:

| Parâmetro | Tipo | Descrição | Exemplo |
|---|---|---|---|
| `start` | string (opcional) | Data/hora de início | `2024-01-01T00` |
| `end` | string (opcional) | Data/hora de fim | `2024-01-01T23` |
| `region` | string (opcional) | Código da região RTO | `PJM`, `MISO`, `ERCO` |

#### `GET /reports/total`
Retorna o consumo total de energia no período filtrado.

```bash
curl "http://localhost:3000/reports/total?start=2024-01-01T00&end=2024-01-01T23" \
  -H "Authorization: Bearer seu_token_estatico_super_secreto"
```

#### `GET /reports/average`
Retorna a média de consumo de energia no período filtrado.

```bash
curl "http://localhost:3000/reports/average?region=PJM" \
  -H "Authorization: Bearer seu_token_estatico_super_secreto"
```

#### `GET /reports/peak`
Retorna o pico de consumo de energia no período filtrado.

```bash
curl "http://localhost:3000/reports/peak?start=2024-01-01T00&end=2024-12-31T23" \
  -H "Authorization: Bearer seu_token_estatico_super_secreto"
```

#### `GET /reports/by-region`
Retorna o consumo agrupado por região RTO.

```bash
curl "http://localhost:3000/reports/by-region?start=2024-01-01T00&end=2024-01-07T23" \
  -H "Authorization: Bearer seu_token_estatico_super_secreto"
```

---

## 🔒 Autenticação

A API utiliza autenticação via **JWT Bearer Token estático**. O token é configurado através da variável de ambiente `STATIC_JWT_SECRET`.

Para autenticar, inclua o header em todas as requisições:

```
Authorization: Bearer <valor_de_STATIC_JWT_SECRET>
```

**Respostas de erro de autenticação:**
- `401 Unauthorized` — Token ausente ou inválido
- `429 Too Many Requests` — Limite de requisições excedido (padrão: 30 req/60s)

---

## 📖 Documentação Swagger

Com a aplicação em execução, acesse a documentação interativa:

```
http://localhost:3000/api
```

Na interface do Swagger:
1. Clique em **"Authorize"** (ícone de cadeado)
2. Informe o valor do `STATIC_JWT_SECRET` configurado no `.env`
3. Clique em **"Authorize"** e feche o modal
4. Teste qualquer endpoint diretamente pela interface

---

## 🧪 Testes

### Executar todos os testes unitários

```bash
npm run test
```

### Executar com cobertura de código

```bash
npm run test:cov
```

### Executar em modo watch (desenvolvimento)

```bash
npm run test:watch
```

### Executar testes E2E

> ⚠️ Requer banco de dados em execução.

```bash
npm run test:e2e
```

### Cobertura atual

| Métrica | Cobertura |
|---|---|
| Statements | 53.72% |
| Functions | 71.42% |
| Testes unitários | 47 cenários |

**Arquivos de teste:**
- `src/energy/energy.service.spec.ts` — 8 cenários
- `src/energy/energy.repository.spec.ts` — 11 cenários
- `src/eia/eia-http.client.spec.ts` — 7 cenários
- `src/energy/sync/sync.controller.spec.ts` — 4 cenários
- `src/reports/reports.service.spec.ts` — 8 cenários
- `src/reports/reports.controller.spec.ts` — 8 cenários

---

## 🔧 Variáveis de Ambiente

| Variável | Obrigatório | Padrão | Descrição |
|---|---|---|---|
| `NODE_ENV` | Não | `development` | Ambiente de execução |
| `PORT` | Não | `3000` | Porta da aplicação |
| `DB_HOST` | Sim | `localhost` | Host do PostgreSQL |
| `DB_PORT` | Não | `5432` | Porta do PostgreSQL |
| `DB_USERNAME` | Sim | `postgres` | Usuário do banco |
| `DB_PASSWORD` | Sim | `postgres` | Senha do banco |
| `DB_DATABASE` | Sim | `enerdata` | Nome do banco |
| `EIA_API_KEY` | **Sim** | — | Chave da API EIA |
| `EIA_BASE_URL` | Não | `https://api.eia.gov/v2` | URL base da EIA |
| `EIA_TIMEOUT_MS` | Não | `10000` | Timeout HTTP em ms |
| `STATIC_JWT_SECRET` | **Sim** | — | Token de autenticação |
| `THROTTLE_TTL` | Não | `60` | Janela de rate limit (segundos) |
| `THROTTLE_LIMIT` | Não | `30` | Máximo de requisições por janela |
| `SYNC_CRON_EXPRESSION` | Não | `0 * * * *` | Expressão Cron para sincronização |

> 💡 Por padrão, o Cron executa a cada hora (`0 * * * *`). Ajuste `SYNC_CRON_EXPRESSION` conforme necessário.

---

## 📁 Estrutura do Projeto

```
src/
├── app.module.ts              # Módulo raiz da aplicação
├── main.ts                    # Bootstrap da aplicação
├── common/
│   ├── exceptions/            # Filtros e exceções globais
│   └── guards/                # Guards de autenticação (StaticJwtGuard)
├── config/
│   ├── config.module.ts       # Módulo de configuração
│   └── env.schema.ts          # Validação de variáveis de ambiente (Zod)
├── database/
│   ├── database.module.ts     # Configuração do TypeORM
│   └── migrations/            # Migrations do banco de dados
├── eia/
│   ├── eia-http.client.ts     # Cliente HTTP para a API da EIA
│   └── eia.module.ts
├── energy/
│   ├── energy.entity.ts       # Entidade EnergyRecord
│   ├── energy.repository.ts   # Acesso a dados (upsert, queries)
│   ├── energy.service.ts      # Lógica de negócio
│   └── sync/
│       ├── sync.controller.ts # Endpoint de sincronização manual
│       ├── sync.dto.ts        # DTO de sincronização
│       └── sync.scheduler.ts  # Agendador de sincronização (Cron)
└── reports/
    ├── reports.controller.ts  # Endpoints de relatórios
    ├── reports.service.ts     # Lógica de agregação
    └── dto/
        └── report-filter.dto.ts
```

---

## 🗺️ Regiões RTO disponíveis

Exemplos de códigos de região da EIA:

| Código | Região |
|---|---|
| `PJM` | PJM Interconnection |
| `MISO` | Midcontinent ISO |
| `ERCO` | ERCOT (Texas) |
| `SWPP` | Southwest Power Pool |
| `CISO` | California ISO |
| `NYIS` | New York ISO |
| `ISNE` | ISO New England |

---

## 🤝 Testando com Postman

Uma coleção do Postman está disponível em [`docs/postman_collection.json`](docs/postman_collection.json).

**Para importar:**
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `docs/postman_collection.json`
4. Configure a variável de coleção `STATIC_TOKEN` com o valor do seu `STATIC_JWT_SECRET`

---

## 📄 Licença

Projeto desenvolvido como desafio técnico. Uso restrito.
