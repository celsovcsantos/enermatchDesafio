# Desafio Enermatch: Integração e Análise de Dados Energéticos

[cite_start]**Data:** 31 de Março de 2026 [cite: 3]
[cite_start]**Responsável:** Ronald Junger (Tech Lead) [cite: 65, 66]

---

## 1. Objetivos

[cite_start]O objetivo deste teste é avaliar seu **raciocínio lógico**, sua capacidade de **estruturar uma integração** com serviços externos e a forma como você **modela e analisa dados**[cite: 6]. Também serão avaliados:

* [cite_start]Organização do código[cite: 7].
* [cite_start]Decisões de arquitetura[cite: 7].
* [cite_start]Tratamento de problemas comuns como persistência, erros e exposição de dados via API[cite: 7].

## 2. Descrição do Desafio

[cite_start]Você deverá desenvolver uma aplicação backend capaz de consumir dados reais de energia, processá-los, armazená-los e disponibilizar relatórios a partir dessas informações[cite: 9].

### Integração com API Externa

A aplicação deve integrar com a API pública da **U.S. [cite_start]Energy Information Administration (EIA)**[cite: 10].

* [cite_start]**Cadastro:** [https://www.eia.gov/opendata/](https://www.eia.gov/opendata/) [cite: 12]
* [cite_start]**Documentação:** [https://www.eia.gov/opendata/documentation.php](https://www.eia.gov/opendata/documentation.php) [cite: 13]
* [cite_start]**Endpoint Exemplo:** [Exemplo de consulta de eletricidade por região](https://www.eia.gov/opendata/browser/electricity/rto/region-data?frequency=local-hourly&data=value;&start=2026-03-01T00-03:00&end=2026-03-31T00-03:00&sortColumn=period;&sortDirection=desc;) [cite: 15]

## 3. Requisitos

* [cite_start]**Integração:** Consumir os dados da API da EIA corretamente[cite: 17].
* [cite_start]**Resiliência:** Tratar possíveis erros de integração como falhas de rede, timeout e respostas inesperadas[cite: 18].
* **Persistência:** Armazenar os dados em um banco de dados de livre escolha[cite: 19].
* [cite_start]**Modelagem:** Modelar os dados de forma que permita consultas eficientes[cite: 20].
* [cite_start]**API REST:** Criar endpoints para consulta de relatórios [ex: consumo total, média, picos, etc](cite: 21, 22).
* **Docker:** Containerizar toda a aplicação e disponibilizar um ambiente de testes também containerizado[cite: 23, 24].

## 4. Ambiente e Stack

### Infraestrutura (Opcional - "Visto com bons olhos")

A aplicação deve ser executável via Docker através do comando `docker-compose up`[cite: 28, 29, 30]. O ambiente deve conter:

* [cite_start]Microservice[cite: 32].
* [cite_start]Banco de dados[cite: 33].

### Linguagem e Stack

[cite_start]A linguagem é de livre escolha, com preferência para[cite: 35, 36]:

* [cite_start]**Node.js** [cite: 37]
* **Go** [cite: 38]

## 5. Uso de Inteligência Artificial

O uso de IA é permitido, desde que feito com transparência[cite: 39, 40]. Deve-se adicionar um comentário no código explicando:

* [cite_start]O motivo do uso[cite: 42].
* [cite_start]Como foi utilizada[cite: 43].
* Qual modelo foi utilizado [ex: GPT, Claude, etc](cite: 44).

**Exemplo:**

```javascript
// IA Usage:
// Reason: Helped to structure the HTTP client
// Model: GPT-4 / ChatGPT

http://googleusercontent.com/immersive_entry_chip/0
