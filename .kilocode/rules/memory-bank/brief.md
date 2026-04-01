# Project Brief: Enerdata API

Este projeto é uma API robusta desenvolvida para o desafio Enermatch, focada na integração, persistência e análise de dados energéticos provenientes da EIA (U.S. Energy Information Administration).

## Core Requirements
- **Integração com API EIA:** Coleta de dados horários de eletricidade por região RTO.
- **Resiliência:** Implementação de retries, timeouts e tratamento de erros na integração.
- **Persistência:** Armazenamento eficiente em PostgreSQL usando TypeORM.
- **Análise de Dados:** Endpoints para relatórios de consumo (total, média, pico, por região).
- **Segurança:** Autenticação via token estático (JWT) e proteção contra Rate Limiting.
- **Observabilidade:** Logs estruturados com Pino e documentação Swagger.
- **Infraestrutura:** Containerização completa com Docker e Docker Compose.

## Goals
- Fornecer uma interface confiável para acessar dados históricos de energia.
- Garantir a integridade dos dados através de processos de sincronização resilientes.
- Oferecer insights rápidos através de endpoints de relatórios otimizados.
- Facilitar o setup e desenvolvimento através de Docker.

## Scope
- **In-Scope:** Sincronização de dados da EIA, armazenamento em banco relacional, endpoints de relatórios, autenticação estática, logs e documentação.
- **Out-of-Scope:** Comentários de IA (Item 5 do desafio original) e Item 6 do desafio original, conforme solicitado.
