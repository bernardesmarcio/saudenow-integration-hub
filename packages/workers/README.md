# SaúdeNow Workers

Background workers para integração SAP com foco em estoque realtime.

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env.local
# Editar .env.local com suas configurações

# Iniciar desenvolvimento local (inclui Redis)
npm run start:local

# Ou manualmente:
npm run redis:up    # Iniciar Redis
npm run dev         # Iniciar workers
```

## 📋 Pré-requisitos

- Node.js 18+
- Docker (para Redis)
- Supabase configurado
- Credenciais SAP

## 🏗️ Arquitetura

```
src/
├── config/           # Configurações (Redis, DB, ambiente)
├── services/         # Serviços de integração SAP
├── workers/          # Workers e processadores
├── lib/              # Utilitários (cache, retry, circuit breaker)
├── types/            # Tipos TypeScript
└── index.ts         # Entrada principal
```

## ⚡ Workers Implementados

### 🔥 Estoque Realtime (CRÍTICO)
- **Sync Estoque**: A cada 2 minutos
- **Estoque Crítico**: A cada 1 minuto
- **Cache Redis**: TTL 30s (crítico 15s)
- **Circuit Breaker**: Proteção contra falhas SAP

### 📦 Outras Integrações
- **Produtos**: A cada 30 minutos
- **Clientes**: A cada 1 hora
- **Vendas**: A cada 10 minutos
- **Full Sync**: Diário às 2h

## 🛠️ Comandos

```bash
# Desenvolvimento
npm run dev              # Inicia workers com hot reload
npm run build           # Build para produção
npm run start           # Inicia versão buildada

# Redis
npm run redis:up        # Inicia Redis
npm run redis:down      # Para Redis
npm run redis:logs      # Logs do Redis

# Testes
npm run test:sap        # Testa integração SAP
npm test               # Testes unitários

# Utilitários
npm run start:local     # Setup completo local
```

## 🔧 Configuração

### Variáveis de Ambiente (.env.local)

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-key

# Redis
REDIS_URL=redis://localhost:6379

# SAP Integration
SAP_API_URL=https://sap-api.empresa.com
SAP_API_KEY=sua_chave_sap
SAP_RATE_LIMIT=100

# Cache TTL (segundos)
CACHE_TTL_ESTOQUE=30
CACHE_TTL_PRODUTOS=300
CACHE_TTL_CLIENTES=600
```

## 📊 Monitoramento

### Redis UI
- URL: http://localhost:8081
- Visualizar cache, queues, jobs

### Logs
- Estruturados com Pino
- Níveis: debug, info, warn, error
- Componentes separados (queue, worker, sap, cache)

### Health Checks
- Circuit breakers por serviço
- Rate limiting automático
- Retry com backoff exponencial

## 🎯 Foco Estoque Realtime

### Por que é Crítico?
- E-commerce depende de dados precisos
- Evitar overselling
- Experiência do cliente

### Como Alcançamos Realtime?
1. **Sync Delta**: Só produtos modificados
2. **Cache Redis**: TTL 30s para consultas rápidas
3. **Priorização**: Estoque crítico tem prioridade
4. **Retry Agressivo**: 10 tentativas para operações críticas

### Fluxo de Dados
```
SAP API → Worker → Transform → Supabase → Cache Redis
                      ↓
              Alertas (estoque crítico)
```

## 🚨 Alertas

### Estoque Zerado
- Notificação imediata
- Slack + Email
- Prioridade máxima

### Estoque Crítico (≤10)
- Verificação a cada 1 minuto
- Cache especial (TTL 15s)
- Monitoramento contínuo

### Falhas de Integração
- Circuit breaker ativo
- Retry automático
- Escalação após 5 minutos

## 📈 Performance

### Métricas Alvo
- **Estoque**: Lag ≤ 2 minutos
- **Cache Hit Rate**: ≥ 80%
- **SAP Uptime**: ≥ 99.5%
- **Queue Processing**: < 30s

### Otimizações
- Batch requests
- Connection pooling
- Rate limiting inteligente
- Delta sync apenas

## 🐳 Docker

### Desenvolvimento
```bash
docker-compose up -d redis     # Apenas Redis
```

### Produção (Railway)
- Redis configurado
- Workers como serviços
- Auto-scaling habilitado

## 🧪 Testes

```bash
# Testar integração SAP
npm run test:sap

# Testar workers específicos
npm test -- --grep "estoque"

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Railway
1. Conectar repositório
2. Configurar variáveis de ambiente
3. Deploy automático via Git

### Monitoramento Produção
- Logs centralizados
- Métricas via telemetria
- Alertas Slack/Email

## 🔍 Troubleshooting

### Redis não conecta
```bash
docker ps                     # Verificar container
docker logs <container-id>    # Ver logs
npm run redis:up              # Reiniciar
```

### SAP API indisponível
- Circuit breaker ativado automaticamente
- Verificar logs de retry
- Testar health check

### Queue backing up
- Verificar Redis memory
- Aumentar concorrência
- Limpar jobs antigos

## 📝 Próximos Passos

- [ ] Webhook SAP para updates instantâneos
- [ ] Dashboard de monitoramento
- [ ] Alertas avançados
- [ ] Métricas de performance
- [ ] Auto-scaling por demanda

## 🤝 Contribuição

1. Fork do projeto
2. Criar feature branch
3. Commit com conventional commits
4. Abrir Pull Request

## 📄 Licença

MIT License - ver LICENSE file