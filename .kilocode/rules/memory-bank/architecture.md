# System Architecture: Enerdata API

## Overview
A Enerdata API é construída sobre o framework NestJS, seguindo uma arquitetura modular e orientada a serviços. O sistema integra-se com a API externa da EIA, processa os dados e os armazena em um banco de dados PostgreSQL para análise posterior.

## Key Components

### 1. EIA Integration (`src/eia`)
- **EiaHttpClient:** Cliente HTTP baseado em Axios com interceptors para retentativas (retry) e timeouts.
- **EiaModule:** Encapsula a lógica de comunicação com a API externa.

### 2. Energy Management (`src/energy`)
- **EnergyRecord Entity:** Representa os dados de consumo de energia por região e período.
- **EnergyRepository:** Camada de acesso a dados que utiliza o TypeORM QueryBuilder para operações eficientes de `upsert` e consultas de relatórios.
- **EnergyService:** Lógica de negócio para processamento e persistência de dados.

### 3. Synchronization (`src/energy/sync`)
- **SyncScheduler:** Agendador de tarefas (Cron) para sincronização automática.
- **SyncController:** Endpoint para disparar a sincronização manualmente.

### 4. Reports (`src/reports`)
- **ReportsController:** Endpoints para consulta de métricas (total, média, pico, por região).
- **ReportsService:** Lógica de agregação e filtragem de dados para os relatórios.

### 5. Common Infrastructure (`src/common`)
- **StaticJwtGuard:** Autenticação via token estático.
- **HttpExceptionFilter:** Tratamento global de erros com formato de resposta padronizado.
- **Pino Logger:** Logging estruturado em JSON.

### 6. Database (`src/database`)
- **DatabaseModule:** Configuração do TypeORM com PostgreSQL.
- **Migrations:** Arquivos de migration para versionamento do schema do banco.
  - `1743471000000-CreateEnergyRecordsTable.ts`: Migration inicial com índices compostos e constraint unique.

## Data Flow
1.  **Coleta:** O `SyncScheduler` ou `SyncController` dispara o `SyncService`.
2.  **Integração:** O `SyncService` solicita dados ao `EiaHttpClient`.
3.  **Processamento:** Os dados brutos são mapeados para entidades `EnergyRecord`.
4.  **Persistência:** O `EnergyRepository` realiza o `upsert` no PostgreSQL.
5.  **Consulta:** O `ReportsController` solicita dados ao `ReportsService`, que consulta o `EnergyRepository` com filtros.

## Design Decisions
- **Modularidade:** Uso de módulos NestJS para separação de responsabilidades.
- **Resiliência:** Implementação de retries na integração com a EIA para lidar com instabilidades de rede.
- **Performance:** Uso de índices compostos no banco de dados e estratégia de `upsert` para evitar duplicatas e garantir integridade.
- **Segurança:** Proteção contra SQL Injection via QueryBuilder parameterizado e autenticação via JWT estático.

## Testes Unitários
- **47 testes unitários** cobrindo todos os principais serviços e controllers
- **Cobertura de código:** 53.72% statements, 71.42% funções
- **Arquivos de teste:**
  - `energy.service.spec.ts`: 8 cenários
  - `energy.repository.spec.ts`: 11 cenários
  - `eia-http.client.spec.ts`: 7 cenários
  - `sync.controller.spec.ts`: 4 cenários
  - `reports.service.spec.ts`: 8 cenários
  - `reports.controller.spec.ts`: 8 cenários
  - `app.controller.spec.ts`: 1 cenário
