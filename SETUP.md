# 🚀 Setup Completo - SaudeNow Integration Hub

## ⚡ **COMANDO ÚNICO PARA TUDO**

```bash
npm run start:dev
```

Este comando faz **TUDO automaticamente**:
1. ✅ Verifica Docker
2. ✅ Inicia Redis
3. ✅ Aguarda Redis ficar pronto  
4. ✅ Instala dependências
5. ✅ Inicia aplicação completa

## 🎯 **URLs Após Start**

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Bull Dashboard**: http://localhost:4000/admin/queues
- **Redis UI**: http://localhost:8081

## 🔧 **Fluxo Completo da Integração**

### **1. Frontend → API**
```
Usuário clica "Sincronizar" → POST /api/v1/retail-pro/stores/resende/sync
```

### **2. API → Fila Redis**
```
API cria job na fila → Redis armazena job → Retorna sucesso
```

### **3. Worker → Processamento**
```
Worker pega job → Chama Retail Pro → Processa dados → Atualiza cache
```

### **4. Frontend → Atualização**
```
Frontend consulta APIs → Mostra dados atualizados → UI refresh
```

## 🔍 **Como Verificar se Está Tudo Funcionando**

### ✅ **Redis Online**
```bash
docker ps | grep redis
# Deve mostrar: saudenow-redis
```

### ✅ **Workers Ativos**
Acesse: http://localhost:4000/admin/queues
- Deve mostrar interface Bull Queue

### ✅ **API Respondendo**
Acesse: http://localhost:3001/api/v1/retail-pro/health
- Deve retornar JSON com status

### ✅ **Frontend Funcionando**
Acesse: http://localhost:3000
- Interface moderna com sidebar

## 🛠️ **Comandos Úteis**

### **Gerenciar Redis**
```bash
npm run redis:start    # Só Redis
npm run redis:stop     # Parar Redis
npm run redis:logs     # Ver logs
```

### **Parar Tudo**
```bash
npm run stop:dev       # Para aplicação + Redis
```

### **Desenvolvimento Manual**
```bash
npm install           # Instalar deps
npm run redis:start   # Redis first
npm run dev          # Depois app
```

## ⚠️ **Troubleshooting**

### **Workers Error: Redis**
```
Error: Using a redis instance with enableReadyCheck...
```
**Solução**: `npm run redis:start`

### **Docker não encontrado**
```
Docker não está rodando
```
**Solução**: Abrir Docker Desktop

### **Porta ocupada**
```
Port 3000 is already in use
```
**Solução**: `npm run stop:dev`

## 🎨 **Interface Completa**

Todas as páginas funcionam:
- ✅ `/` - Dashboard
- ✅ `/retail-pro` - Estoque (25+ produtos)
- ✅ `/retail-pro/dashboard` - Monitoramento
- ✅ `/integrations` - Conectores
- ✅ `/monitoring` - Logs
- ✅ `/users` - Usuários  
- ✅ `/settings` - Configurações

## 🔄 **Testar Sincronização**

1. **Acesse**: http://localhost:3000/retail-pro
2. **Clique**: "Sincronizar Estoque"
3. **Aguarde**: 2-3 segundos
4. **Resultado**: Mensagem de sucesso + dados atualizados

## 📊 **Monitorar Filas**

1. **Acesse**: http://localhost:4000/admin/queues
2. **Veja**: Jobs em processamento
3. **Monitore**: Failed/Completed jobs

---

**🎯 Comando único**: `npm run start:dev`
**🌐 Interface**: http://localhost:3000  
**✅ Tudo automatizado!**