## Explicação da Estratégia de Performance

Minha estratégia de performance foi otimizar a busca na consulta utilizando o último ID consultado. 

### Fluxo de Consulta:
1. **Primeira Consulta (Full Scan)**:
   - Varre toda a tabela para montar o dashboard inicial.
   - Retorna os dados junto com o último ID por `origin`.
   - Exemplo: Se `email` tem 10k registros e `mobile` tem 200k, retorna:
     - Último ID de `email`: 10000
     - Último ID de `mobile`: 350000
   - O frontend armazena esses IDs no `sessionStorage`.

2. **Próximas Consultas (Otimizadas)**:
   - Envia os últimos IDs salvos para o backend.
   - A consulta filtra a partir desses IDs, evitando um `table scan` completo.
   - Reduz significativamente o tempo de busca, pois não precisa varrer a tabela inteira.

3. **WebSocket para Atualização em Tempo Real**:
   - No backend, criei um WebSocket que consulta periodicamente passando o último ID.
   - WebSocket é mais performático por ser `full-duplex`.

### Otimizações no Banco de Dados:
- **Índice Composto**: Criei um índice em `(origin, created_at)`, que é mais eficiente do que índices separados.
- **Consulta Agrupada**: Busca agrupada por `origin`, `date` e `id`.
- **JOIN Otimizado**: Utilizei `JOIN` (mais performático por usar paralelismo) e filtro pelo último ID, reduzindo I/O e volume de dados retornados.

### Melhoria Futura (Caso Real):
- **Pré-processamento Assíncrono**:
  - Na inserção dos dados, disparar um evento assíncrono para calcular e armazenar em um banco de consulta dedicado.
  - Reduziria ainda mais a carga no banco principal e melhoraria a performance.

---

## Como Testar Localmente

### Opção 1: Docker (Banco já configurado)
1. Clone o repositório:
   ```sh
   git clone https://github.com/alexfreire33/teste.git
   cd teste
   ```
2. Suba os containers (Aguarde finalizar todo o processo):
   ```sh
   docker compose up --build
   # ou
   docker-compose up --build
   ```
2. Url para testar localmente:  
  [http://localhost:3000/](http://localhost:3000/)

### Opção 2: Acessar Demonstração Online
- **Link do EC2 + RDS**:  
  [http://54.197.94.183:3000/](http://54.197.94.183:3000/)
- **Para dados em tempo real**:  
  Ative a opção **"Atualização automática (WebSocket)"** no dashboard.

---

**Observação**: O banco de dados usado localmente já está completo com índices e colunas otimizadas, hospedado em um Google Drive para facilitar o teste.