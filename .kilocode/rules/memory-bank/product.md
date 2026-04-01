# Product Vision: Enerdata API

## Why this project exists
A Enerdata API foi criada para resolver a necessidade de monitoramento e análise de dados de consumo de energia elétrica nos Estados Unidos, utilizando a API pública da EIA. O projeto serve como uma ferramenta de integração que automatiza a coleta de dados e fornece uma interface simplificada para relatórios analíticos.

## Problems it solves
- **Complexidade da API EIA:** A API da EIA pode ser complexa de consultar diretamente para múltiplos períodos e regiões.
- **Persistência de Dados:** Oferece um armazenamento local (PostgreSQL) para evitar consultas repetitivas à API externa e permitir análises históricas rápidas.
- **Análise de Dados:** Simplifica a obtenção de métricas como consumo total, média e picos de demanda, que exigiriam processamento manual se feitos diretamente nos dados brutos.
- **Segurança e Controle:** Implementa autenticação e rate limiting para proteger o acesso aos dados e garantir a estabilidade do serviço.

## How it should work
1.  **Sincronização:** A aplicação possui um agendador (Cron) que busca dados da EIA periodicamente. Também permite a sincronização manual via endpoint.
2.  **Armazenamento:** Os dados são processados e armazenados em um banco de dados PostgreSQL, utilizando uma estratégia de `upsert` para evitar duplicatas.
3.  **Consulta:** Usuários autenticados podem consultar endpoints de relatórios, filtrando por período (data de início e fim), região RTO e tipo de dado.
4.  **Documentação:** Desenvolvedores podem acessar a documentação Swagger para entender os endpoints e testá-los.

## User Experience Goals
- **Simplicidade de Setup:** O uso de Docker permite que qualquer desenvolvedor suba o ambiente completo com um único comando.
- **Confiabilidade:** O sistema deve ser resiliente a falhas na API externa, realizando retentativas automáticas.
- **Performance:** Consultas de relatórios devem ser rápidas, aproveitando índices no banco de dados.
- **Clareza:** Logs estruturados e documentação em português facilitam a manutenção e o uso da API.
