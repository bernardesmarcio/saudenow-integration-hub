# 🧪 Guia de Teste - Integração Retail Pro

Este documento fornece instruções detalhadas para testar a integração com o Retail Pro na loja Resende.

## 📋 Pré-requisitos

### 1. **Ambiente de Desenvolvimento**

```bash
# Navegue até o diretório workers
cd packages/workers

# Instale as dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
```

### 2. **Variáveis de Ambiente**

Configure no arquivo `.env`:

```bash
# Retail Pro
RETAIL_PRO_BASE_URL=http://macserver-pdv.maconequi.local
RETAIL_PRO_TIMEOUT=30000

# Redis (para cache)
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase (para persistência)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Serviços Necessários**

```bash
# Inicie o Redis (Docker)
npm run redis:up

# Verifique se o Retail Pro está acessível
curl http://macserver-pdv.maconequi.local/v1/rest/inventory?limit=1
```

## 🚀 Executando os Testes

### Teste Automatizado Completo

```bash
# Execute todos os testes da integração
npm run test:retail-pro
```

### Testes Individuais

#### 1. **Health Check**

```bash
# Teste básico de conectividade
curl -X GET http://macserver-pdv.maconequi.local/v1/rest/inventory?limit=1
```

#### 2. **Busca de Produtos**

```bash
# Teste via API Retail Pro diretamente
curl "http://macserver-pdv.maconequi.local/v1/rest/inventory?cols=sid,alu,description1,description2,vendor_name&limit=10&offset=0"
```

#### 3. **Consulta de Estoque - Loja Resende**

```bash
# Substitua {inventory_sid} por um SID válido
curl "http://macserver-pdv.maconequi.local/v1/rest/inventory/{inventory_sid}/sbsinventoryqty/621769196001438846?cols=store_sid,store_name,quantity,minimum_quantity,po_ordered_quantity,po_received_quantity"
```

## 🔧 Testes via Middleware API

### 1. **Inicie o Middleware API**

```bash
cd packages/middleware-api
npm run dev
```

### 2. **Teste os Endpoints**

#### Informações Gerais

```bash
curl http://localhost:3001/api/v1/retail-pro
```

#### Produtos da Loja Resende

```bash
curl "http://localhost:3001/api/v1/retail-pro/stores/resende/products?page=1&limit=10&include_stock=true"
```

#### Estoque da Loja Resende

```bash
curl "http://localhost:3001/api/v1/retail-pro/stores/resende/stock?page=1&limit=10&status=all"
```

#### Status de Sincronização

```bash
curl http://localhost:3001/api/v1/retail-pro/stores/resende/sync
```

#### Health Check

```bash
curl http://localhost:3001/api/v1/retail-pro/health
```

## 🖥️ Teste do Frontend

### 1. **Inicie o Admin Dashboard**

```bash
cd packages/admin-dashboard
npm run dev
```

### 2. **Acesse a Interface**

- URL: http://localhost:3000/retail-pro
- Verifique:
  - ✅ Cards de estatísticas carregam
  - ✅ Tabela de produtos é exibida
  - ✅ Filtros funcionam
  - ✅ Paginação funciona
  - ✅ Botões de sincronização respondem

## 📊 Verificação de Performance

### 1. **Teste de Throughput**

```bash
# Execute múltiplas requisições concorrentes
for i in {1..10}; do
  curl "http://localhost:3001/api/v1/retail-pro/stores/resende/products?page=$i&limit=50" &
done
wait
```

### 2. **Monitoramento de Cache**

```bash
# Verifique hits/misses do Redis
redis-cli monitor | grep "retailpro"
```

### 3. **Teste de Stress**

```bash
# Use Apache Bench para teste de carga
ab -n 100 -c 10 http://localhost:3001/api/v1/retail-pro/stores/resende/products
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. **Erro de Conectividade**

```bash
# Verifique se o Retail Pro está acessível
ping macserver-pdv.maconequi.local

# Teste conectividade HTTP
telnet macserver-pdv.maconequi.local 80
```

#### 2. **Timeout nas Requisições**

- Aumente `RETAIL_PRO_TIMEOUT` no .env
- Verifique latência de rede
- Considere usar VPN se estiver remoto

#### 3. **Cache Redis Não Funciona**

```bash
# Verifique se Redis está rodando
redis-cli ping

# Monitore operações
redis-cli monitor
```

#### 4. **Dados Não Aparecem**

- Verifique se o SID da loja está correto: `621769196001438846`
- Confirme se há produtos cadastrados no Retail Pro
- Verifique logs dos workers

## 📈 Métricas e Monitoramento

### 1. **Logs dos Workers**

```bash
cd packages/workers
npm run dev

# Em outro terminal, monitore logs
tail -f logs/worker.log
```

### 2. **Métricas Redis**

```bash
# Conecte ao Redis
redis-cli

# Verifique métricas
> KEYS retailpro:*
> GET retailpro:metrics:sync:621769196001438846
```

### 3. **Health Check Completo**

```bash
# Teste health check
curl http://localhost:3001/api/v1/retail-pro/health
```

## ✅ Checklist de Validação

### Funcionalidades Básicas

- [ ] Conectividade com Retail Pro OK
- [ ] Busca de produtos funciona
- [ ] Consulta de estoque funciona
- [ ] Transformação de dados OK
- [ ] Cache Redis operacional

### APIs do Middleware

- [ ] GET /api/v1/retail-pro
- [ ] GET /api/v1/retail-pro/stores/resende/products
- [ ] GET /api/v1/retail-pro/stores/resende/stock
- [ ] GET /api/v1/retail-pro/stores/resende/sync
- [ ] POST /api/v1/retail-pro/stores/resende/sync
- [ ] GET /api/v1/retail-pro/health

### Frontend

- [ ] Página carrega sem erros
- [ ] Estatísticas são exibidas
- [ ] Tabela de produtos funciona
- [ ] Filtros e busca funcionam
- [ ] Paginação funciona
- [ ] Sincronização manual funciona

### Performance

- [ ] Tempo de resposta < 5 segundos
- [ ] Cache hit rate > 70%
- [ ] Throughput > 100 produtos/minuto
- [ ] Sem memory leaks

### Monitoramento

- [ ] Logs são gerados
- [ ] Métricas são coletadas
- [ ] Health checks passam
- [ ] Alertas funcionam

## 🚨 Cenários de Erro

### 1. **Simular Falha de Rede**

```bash
# Bloquear temporariamente o Retail Pro
sudo iptables -A OUTPUT -d macserver-pdv.maconequi.local -j DROP

# Executar testes
npm run test:retail-pro

# Restaurar conectividade
sudo iptables -D OUTPUT -d macserver-pdv.maconequi.local -j DROP
```

### 2. **Simular Sobrecarga**

```bash
# Teste com muitas requisições simultâneas
for i in {1..50}; do
  npm run test:retail-pro &
done
```

### 3. **Teste de Recovery**

- Pare o Redis, execute testes, reinicie Redis
- Teste circuit breaker com endpoints inválidos
- Verifique retry logic com timeouts

## 📋 Relatórios de Teste

### Template de Relatório

```markdown
# Relatório de Teste - Retail Pro Integration

**Data**: [DATA]
**Ambiente**: [DEV/PROD]
**Versão**: [VERSÃO]

## Resultados

- ✅/❌ Conectividade
- ✅/❌ APIs
- ✅/❌ Frontend
- ✅/❌ Performance
- ✅/❌ Monitoramento

## Métricas

- Tempo de resposta médio: [X]ms
- Taxa de sucesso: [X]%
- Throughput: [X] req/s
- Cache hit rate: [X]%

## Issues Encontradas

1. [Descrição]
2. [Descrição]

## Próximos Passos

1. [Ação]
2. [Ação]
```

## 🎯 Objetivos de Performance

| Métrica           | Objetivo      | Crítico      |
| ----------------- | ------------- | ------------ |
| Tempo de resposta | < 3s          | < 10s        |
| Taxa de sucesso   | > 95%         | > 80%        |
| Throughput        | > 100 req/min | > 50 req/min |
| Cache hit rate    | > 80%         | > 50%        |
| Uptime            | > 99%         | > 95%        |

---

💡 **Dica**: Execute os testes regularmente para garantir que a integração continue funcionando conforme esperado, especialmente após mudanças no Retail Pro ou na rede.
