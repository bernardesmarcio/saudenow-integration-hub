# ✅ Deploy Checklist - Saudenow Integration Hub

## 📋 **Pré-Deploy**

### **1. Ambiente Local**

- [ ] Projeto builda sem erros (`npm run build`)
- [ ] Testes passam (`npm run test`)
- [ ] Linting OK (`npm run lint`)
- [ ] Type checking OK (`npm run type-check`)
- [ ] Git commit atualizado

### **2. Credenciais**

- [ ] Railway CLI instalado (`npm install -g @railway/cli`)
- [ ] Vercel CLI instalado (`npm install -g vercel`)
- [ ] Autenticado no Railway (`railway login`)
- [ ] Autenticado no Vercel (`vercel login`)

### **3. Configurações**

- [ ] Projeto Supabase criado
- [ ] Variáveis de ambiente preparadas
- [ ] Dockerfiles configurados
- [ ] Health checks implementados

## 🚀 **Deploy Railway**

### **Middleware API**

- [ ] Deploy executado (`./scripts/deploy-railway.sh`)
- [ ] Serviço online no Railway dashboard
- [ ] Health check funcionando (`/api/health`)
- [ ] Logs sem erros críticos

### **Workers**

- [ ] Deploy executado
- [ ] Serviço online no Railway dashboard
- [ ] Health check funcionando (`/health`)
- [ ] Redis conectado
- [ ] Schedulers iniciados

### **Add-ons Railway**

- [ ] Redis adicionado como add-on
- [ ] Variáveis de ambiente do Redis configuradas
- [ ] PostgreSQL configurado (se não usar Supabase)

## 🌐 **Deploy Vercel**

### **Frontend**

- [ ] Deploy executado (`./scripts/deploy-vercel.sh`)
- [ ] Build sem erros
- [ ] Aplicação online
- [ ] Assets carregando corretamente

### **Configurações Vercel**

- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado (se aplicável)
- [ ] Rewrites funcionando (`/api/*` → Railway)

## 🔧 **Configuração Variáveis**

### **Railway (Backend + Workers)**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `BULL_REDIS_HOST`
- [ ] `BULL_REDIS_PORT`
- [ ] `NODE_ENV=production`
- [ ] `PORT` (3001 para API, 4000 para workers)
- [ ] `INTEGRATION_TIMEOUT=30000`
- [ ] `LOG_LEVEL=info`

### **Vercel (Frontend)**

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_API_URL` (URL do Railway)
- [ ] `NEXT_PUBLIC_WORKERS_URL` (URL do Workers)

## 🔍 **Verificação de Deploy**

### **1. Health Checks**

- [ ] Middleware API: `https://seu-middleware-api.railway.app/api/health`
- [ ] Workers: `https://seu-workers.railway.app/health`
- [ ] Frontend: `https://seu-app.vercel.app`

### **2. Funcionalidades Principais**

- [ ] Dashboard carrega corretamente
- [ ] Autenticação funciona
- [ ] API endpoints respondem
- [ ] Workers processam jobs
- [ ] Queue dashboard acessível

### **3. Integrações**

- [ ] Supabase conectado
- [ ] Redis funcionando
- [ ] Logs estruturados
- [ ] Métricas coletadas

## 📊 **Monitoramento**

### **Logs**

- [ ] Railway logs configurados
- [ ] Vercel logs configurados
- [ ] Structured logging funcionando
- [ ] Error tracking (Sentry, se configurado)

### **Métricas**

- [ ] Railway dashboard mostrando métricas
- [ ] Vercel analytics funcionando
- [ ] Queue metrics visíveis
- [ ] Health checks periódicos

## 🚨 **Troubleshooting**

### **Problemas Comuns**

- [ ] **Build falha**: Verificar dependências e Dockerfile
- [ ] **Variables não definidas**: Verificar Railway/Vercel dashboard
- [ ] **CORS errors**: Verificar origins configurados
- [ ] **Redis connection**: Verificar add-on e variáveis
- [ ] **Database connection**: Verificar Supabase URL

### **Comandos Úteis**

```bash
# Logs em tempo real
railway logs --service middleware-api --follow
railway logs --service workers --follow
vercel logs --follow

# Redeploy
railway up --detach
vercel --prod

# Status dos serviços
railway status
vercel list
```

## 🎯 **Pós-Deploy**

### **1. Testes de Produção**

- [ ] Testar todas as páginas principais
- [ ] Testar sincronização Retail Pro
- [ ] Testar background jobs
- [ ] Testar error handling

### **2. Performance**

- [ ] Verificar tempos de resposta
- [ ] Verificar uso de memória/CPU
- [ ] Verificar cache funcionando
- [ ] Verificar otimizações de imagem

### **3. Segurança**

- [ ] HTTPS funcionando
- [ ] Rate limiting ativo
- [ ] Autenticação segura
- [ ] Variáveis sensíveis protegidas

## 📈 **Otimizações**

### **Railway**

- [ ] Auto-scaling configurado
- [ ] Resource limits definidos
- [ ] Persistent volumes (se necessário)
- [ ] Backup strategy

### **Vercel**

- [ ] Edge functions (se aplicável)
- [ ] Image optimization
- [ ] Caching headers
- [ ] Analytics configurado

## 🔄 **Automação**

### **CI/CD**

- [ ] GitHub Actions configurado
- [ ] Deploy automático no push
- [ ] Rollback strategy
- [ ] Environment promotion

### **Monitoramento Contínuo**

- [ ] Health checks automáticos
- [ ] Alertas configurados
- [ ] Logs centralizados
- [ ] Métricas dashboard

## ✅ **Deploy Completo**

Quando todos os itens acima estiverem marcados:

- [ ] **Deploy realizado com sucesso**
- [ ] **Aplicação funcionando em produção**
- [ ] **Monitoramento ativo**
- [ ] **Documentação atualizada**

---

## 🎯 **Comandos Rápidos**

### **Deploy Master**

```bash
./scripts/deploy-all.sh
```

### **Deploy Individual**

```bash
./scripts/deploy-railway.sh
./scripts/deploy-vercel.sh
```

### **Verificação Rápida**

```bash
curl https://seu-middleware-api.railway.app/api/health
curl https://seu-workers.railway.app/health
curl https://seu-app.vercel.app
```

**🎉 Pronto! Sua aplicação está em produção!**
