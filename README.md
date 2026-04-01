# 🔋 Enerdata API

API robusta para integração, persistência e análise de dados de consumo de energia elétrica nos Estados Unidos, utilizando a API pública da **EIA (U.S. Energy Information Administration)**.

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Decisões Técnicas](#-decisões-técnicas)
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

## 🏗 Decisões Técnicas

### Arquitetura Modular

A API segue a arquitetura modular do NestJS, separando responsabilidades em módulos coesos:

| Módulo | Responsabilidade |
|---|---|
| `EiaModule` | Comunicação HTTP com API externa da EIA |
| `EnergyModule` | Persistência e lógica de negócio de registros de energia |
| `SyncModule` | Agendamento (Cron) e controle de sincronização |
| `ReportsModule` | Agregação e consulta de dados para relatórios |

### Estratégia de Upsert

O [`EnergyRepository.upsertRecords()`](src/energy/energy.repository.ts:31) utiliza `ON CONFLICT DO UPDATE` do PostgreSQL para evitar duplicatas, garantindo idempotência — a mesma operação pode ser executada múltiplas vezes sem alterar o resultado.

### Índices Compostos

A [migration inicial](src/database/migrations/1743471000000-CreateEnergyRecordsTable.ts) define:
- **Índice composto unique** em `(period, subregion)` — garante integridade e acelera consultas por período + região.
- **Índices em `period`** e `subregion` individualmente — otimizam filtros usados nos endpoints de relatório.

### Resiliência na Integração EIA

O [`EiaHttpClient`](src/eia/eia-http.client.ts) implementa:
- **Retry automático** via Axios interceptor com backoff exponencial.
- **Timeout configurável** (`EIA_TIMEOUT_MS`) para evitar requisições pendentes.
- **Validação de resposta** que rejeita payloads malformados.

### Autenticação Estática (JWT)

O [`StaticJwtGuard`](src/common/guards/static-jwt.guard.ts) compara o token do header `Authorization: Bearer` diretamente com `STATIC_JWT_SECRET`. Essa escolha é adequada para:
- Projetos de escopo fechado (sem múltiplos usuários).
- Ambientes internos onde um token compartilhado é suficiente.
- Evita a complexidade de OAuth2 / JWT dinâmico com refresh tokens.

### Migrations TypeORM

O schema do banco é versionado via migrations, permitindo:
- Reprodução do banco em qualquer ambiente.
- Rollback controlado de mudanças.
- Histórico audível de evolução do schema.

A aplicação executa migrations automaticamente na inicialização (via ` synchronize: false` + script de bootstrap).

### Rate Limiting

O `@nestjs/throttler` protege contra abuso com limite configurável (padrão: 30 req/60s por IP), adequado para ambientes compartilhados.

### Logging Estruturado

O `nestjs-pino` emite logs em formato JSON, facilitando integração com ferramentas de observabilidade (Datadog, ELK, CloudWatch).

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

> ⚠️ O PostgreSQL será exposto na porta **5433** do host. O arquivo `.env` já está configurado com `DB_PORT=5433` para esse cenário.

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
| `DB_PORT` | Não | `5433` | Porta do PostgreSQL (5433 quando usando Docker Compose localmente) |
| `DB_USERNAME` | Sim | `postgres` | Usuário do banco |
| `DB_PASSWORD` | Sim | `postgres` | Senha do banco |
| `DB_DATABASE` | Sim | `enerdata` | Nome do banco |
| `EIA_API_KEY` | **Sim** | — | Chave da API EIA |
| `EIA_BASE_URL` | Não | `https://api.eia.gov/v2` | URL base da EIA |
| `EIA_TIMEOUT_MS` | Não | `10000` | Timeout HTTP em ms |
| `STATIC_JWT_SECRET` | **Sim** | — | Token de autenticação |
| `THROTTLE_TTL` | Não | `60` | Janela de rate limit (segundos) |
| `THROTTLE_LIMIT` | Não | `30` | Máximo de requisições por janela |
| `SYNC_CRON_EXPRESSION` | Não | `0 */10 * * * *` | Expressão Cron para sincronização (a cada 10 min) |

> ⚠️ **Nota sobre `DB_PORT`:** Quando você roda a aplicação localmente (`npm run start:dev`) com o PostgreSQL via `docker compose up -d postgres`, o banco é exposto na porta **5433** do host (conforme `docker-compose.yml`). O `.env` já vem configurado com `DB_PORT=5433` para esse cenário. Se usar um PostgreSQL nativo na porta-padrão 5432, altere para `DB_PORT=5432`.
> 
> 💡 O Cron padrão executa a cada 10 minutos (`0 */10 * * * *`). Ajuste `SYNC_CRON_EXPRESSION` conforme necessário.

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

A coleção completa pode ser importada diretamente no Postman.

**Opção 1 — Importar do arquivo:**
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `docs/postman_collection.json`
4. Configure a variável de coleção `STATIC_TOKEN` com o valor do seu `STATIC_JWT_SECRET`

**Opção 2 — Cole o JSON abaixo diretamente:**

```json
{
	"info": {
		"_postman_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
		"name": "Enerdata API",
		"description": "Coleção para testar a API de monitoramento de energia",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Sincronização",
			"item": [
				{
					"name": "Disparar Sincronização Manual",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{STATIC_TOKEN}}",
								"type": "text"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\n    \"start\": \"2024-01-01T00\",\n    \"end\": \"2024-01-01T23\"\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{BASE_URL}}/energy/sync",
							"host": ["{{BASE_URL}}"],
							"path": ["energy", "sync"]
						}
					},
					"response": []
				}
			]
		},
		{
			"name": "Relatórios",
			"item": [
				{
					"name": "Consumo Total",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{STATIC_TOKEN}}",
								"type": "text"
							}
						],
						"url": {
							"raw": "{{BASE_URL}}/reports/total?start=2024-01-01T00&end=2024-01-01T23",
							"host": ["{{BASE_URL}}"],
							"path": ["reports", "total"],
							"query": [
								{ "key": "start", "value": "2024-01-01T00" },
								{ "key": "end", "value": "2024-01-01T23" }
							]
						}
					},
					"response": []
				},
				{
					"name": "Média de Consumo",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{STATIC_TOKEN}}",
								"type": "text"
							}
						],
						"url": {
							"raw": "{{BASE_URL}}/reports/average?region=PJM",
							"host": ["{{BASE_URL}}"],
							"path": ["reports", "average"],
							"query": [
								{ "key": "region", "value": "PJM" }
							]
						}
					},
					"response": []
				},
				{
					"name": "Pico de Consumo",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{STATIC_TOKEN}}",
								"type": "text"
							}
						],
						"url": {
							"raw": "{{BASE_URL}}/reports/peak",
							"host": ["{{BASE_URL}}"],
							"path": ["reports", "peak"]
						}
					},
					"response": []
				},
				{
					"name": "Consumo por Região",
					"request": {
						"method": "GET",
						"header": [
							{
								"key": "Authorization",
								"value": "Bearer {{STATIC_TOKEN}}",
								"type": "text"
							}
						],
						"url": {
							"raw": "{{BASE_URL}}/reports/by-region",
							"host": ["{{BASE_URL}}"],
							"path": ["reports", "by-region"]
						}
					},
					"response": []
				}
			]
		}
	],
	"event": [
		{
			"listen": "prerequest",
			"script": { "type": "text/javascript", "exec": [""] }
		},
		{
			"listen": "test",
			"script": { "type": "text/javascript", "exec": [""] }
		}
	],
	"variable": [
		{
			"key": "BASE_URL",
			"value": "http://localhost:3000",
			"type": "string"
		},
		{
			"key": "STATIC_TOKEN",
			"value": "seu_token_estatico_super_secreto",
			"type": "string"
		}
	]
}
```

**Variáveis da coleção:**

| Variável | Valor padrão | Descrição |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | URL base da API |
| `STATIC_TOKEN` | `seu_token_estatico_super_secreto` | Token de autenticação (substitua pelo valor do seu `.env`) |

---

## 📄 Licença

Projeto desenvolvido como desafio técnico. Uso restrito.
