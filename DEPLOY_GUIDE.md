# 🚀 Guia de Deploy - Saudenow Integration Hub

Este guia contém as instruções completas para fazer deploy do Saudenow Integration Hub em produção.

## 📋 **Pré-requisitos**

1. **Contas necessárias:**
   - [Railway](https://railway.app) (backend + workers)
   - [Vercel](https://vercel.com) (frontend)
   - [Supabase](https://supabase.com) (database)

2. **CLIs instalados:**
   ```bash
   npm install -g @railway/cli
   npm install -g vercel
   ```

3. **Autenticação:**
   ```bash
   railway login
   vercel login
   ```

## 🎯 **Sequência de Deploy**

### **1. Preparar o Projeto**

```bash
# Build do projeto
npm run build

# Verificar se tudo está funcionando
npm run lint
npm run type-check
```

### **2. Deploy Backend (Railway)**

```bash
# Executar script de deploy
./scripts/deploy-railway.sh
```

**Ou manualmente:**

```bash
# Middleware API
cd packages/middleware-api
railway up --detach

# Workers
cd ../workers
railway up --detach
```

### **3. Deploy Frontend (Vercel)**

```bash
# Executar script de deploy
./scripts/deploy-vercel.sh
```

**Ou manualmente:**

```bash
cd packages/admin-dashboard
vercel --prod
```

## 🔧 **Configuração de Variáveis de Ambiente**

### **Railway (Backend + Workers)**

Acesse o Railway dashboard e configure:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
DATABASE_URL=postgresql://postgres:senha@host:5432/database

# Redis (adicionar Redis como add-on no Railway)
REDIS_URL=redis://default:password@host:port
BULL_REDIS_HOST=host
BULL_REDIS_PORT=port
BULL_REDIS_PASSWORD=password

# Application
NODE_ENV=production
PORT=3001 # Para middleware-api
# PORT=4000 # Para workers
INTEGRATION_TIMEOUT=30000

# Monitoring
SENTRY_DSN=https://sua-chave@sentry.io/projeto
LOG_LEVEL=info
```

### **Vercel (Frontend)**

Acesse o Vercel dashboard e configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
NEXT_PUBLIC_API_URL=https://seu-middleware-api.railway.app
NEXT_PUBLIC_WORKERS_URL=https://seu-workers.railway.app
```

## 🎛️ **Configuração do Railway**

### **1. Criar Projeto no Railway**

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Conecte seu repositório

### **2. Configurar Serviços**

**Middleware API:**
- Service Name: `middleware-api`
- Root Directory: `packages/middleware-api`
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: `3001`

**Workers:**
- Service Name: `workers`
- Root Directory: `packages/workers`
- Build Command: `npm run build`
- Start Command: `npm start`
- Port: `4000`

### **3. Adicionar Add-ons**

**Redis:**
1. No Railway dashboard, clique em "Add Service"
2. Selecione "Redis"
3. As variáveis de ambiente serão configuradas automaticamente

**PostgreSQL (opcional se não usar Supabase):**
1. No Railway dashboard, clique em "Add Service"
2. Selecione "PostgreSQL"
3. Configure `DATABASE_URL` automaticamente

## 🌐 **Configuração do Vercel**

### **1. Criar Projeto no Vercel**

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "Add New Project"
3. Importe seu repositório GitHub
4. Configure:
   - Framework Preset: `Next.js`
   - Root Directory: `packages/admin-dashboard`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### **2. Configurar Domínio**

1. No Vercel dashboard, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

## 🔍 **Verificação de Deploy**

### **1. Verificar Backend (Railway)**

```bash
# Health check do middleware-api
curl https://seu-middleware-api.railway.app/api/health

# Health check dos workers
curl https://seu-workers.railway.app/health
```

### **2. Verificar Frontend (Vercel)**

```bash
# Acessar aplicação
curl https://seu-app.vercel.app

# Verificar API proxy
curl https://seu-app.vercel.app/api/health
```

### **3. Verificar Integração Completa**

1. Acesse o frontend
2. Teste funcionalidades principais:
   - Dashboard
   - Sincronização Retail Pro
   - Monitoramento
   - Logs

## 📊 **Monitoramento**

### **Logs do Railway**

```bash
# Middleware API
railway logs --service middleware-api

# Workers
railway logs --service workers
```

### **Logs do Vercel**

```bash
# Frontend
vercel logs

# Em tempo real
vercel logs --follow
```

### **Métricas**

- **Railway**: Dashboard integrado com métricas de CPU, memória, network
- **Vercel**: Analytics e Web Vitals
- **Supabase**: Database usage e performance

## 🚨 **Troubleshooting**

### **Problemas Comuns**

**1. Build falha no Railway**
```bash
# Verificar logs
railway logs --service middleware-api
railway logs --service workers

# Soluções:
# - Verificar Dockerfile
# - Verificar dependências
# - Verificar variáveis de ambiente
```

**2. Frontend não conecta com backend**
```bash
# Verificar variáveis de ambiente no Vercel
# Verificar CORS no backend
# Verificar health checks
```

**3. Workers não processam jobs**
```bash
# Verificar Redis connection
# Verificar logs dos workers
# Verificar queue configuration
```

## 📈 **Otimizações**

### **Performance**

1. **Railway**: Configure auto-scaling
2. **Vercel**: Enable Edge Functions
3. **Supabase**: Configure connection pooling
4. **Redis**: Configure persistence

### **Segurança**

1. **Environment Variables**: Use Railway/Vercel secrets
2. **CORS**: Configure origins específicos
3. **Rate Limiting**: Configure limits por endpoint
4. **Authentication**: Use Supabase Auth

## 🔄 **Deploy Automático**

### **GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
          
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🎯 **URLs de Produção**

Após o deploy, você terá:

- **Frontend**: `https://seu-app.vercel.app`
- **Backend API**: `https://seu-middleware-api.railway.app`
- **Workers**: `https://seu-workers.railway.app`
- **Queue Dashboard**: `https://seu-workers.railway.app/admin/queues`

## 📞 **Suporte**

Para problemas ou dúvidas:
1. Verifique os logs primeiro
2. Consulte a documentação das plataformas
3. Abra issue no repositório

---

✅ **Deploy concluído com sucesso!** Sua aplicação está pronta para produção.