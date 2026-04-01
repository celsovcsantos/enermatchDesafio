# Technical Stack: Enerdata API

## Core Technologies
- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Framework:** NestJS 10.x
- **Database:** PostgreSQL 16
- **ORM:** TypeORM 0.3.x

## Key Dependencies
- **@nestjs/config:** Gerenciamento de configuração.
- **zod:** Validação de variáveis de ambiente.
- **@nestjs/axios:** Cliente HTTP para integração com a EIA.
- **@nestjs/schedule:** Agendamento de tarefas (Cron).
- **@nestjs/throttler:** Rate limiting.
- **@nestjs/swagger:** Documentação da API.
- **nestjs-pino:** Logging estruturado.
- **class-validator & class-transformer:** Validação e transformação de dados.

## Infrastructure & DevOps
- **Docker:** Containerização da aplicação.
- **Docker Compose:** Orquestração de containers (App + DB).
- **GitHub Actions:** (Potencial para CI/CD).

## Development Tools
- **ESLint:** Linting de código.
- **Prettier:** Formatação de código.
- **Jest:** Framework de testes (Unitários e E2E).
- **Postman:** Testes manuais de API (coleção disponível em `docs/postman_collection.json`).

## Technical Constraints
- **API EIA:** Requer chave de API válida e possui limites de taxa.
- **Segurança:** Autenticação via token estático (JWT) configurado no `.env`.
- **Persistência:** Uso obrigatório de PostgreSQL para armazenamento de dados.
