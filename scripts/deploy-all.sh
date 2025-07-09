#!/bin/bash

# Master Deploy Script - Saudenow Integration Hub
set -e

echo "🚀 MASTER DEPLOY - Saudenow Integration Hub"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}🎯 $1${NC}"
    echo "----------------------------------------"
}

# Verificar pré-requisitos
print_header "VERIFICANDO PRÉ-REQUISITOS"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado"
    exit 1
fi
print_status "Node.js $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado"
    exit 1
fi
print_status "npm $(npm --version)"

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi
print_status "Railway CLI instalado"

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI não encontrado. Instale com: npm install -g vercel"
    exit 1
fi
print_status "Vercel CLI instalado"

# Verificar autenticação Railway
if ! railway whoami &> /dev/null; then
    print_error "Não está logado no Railway. Execute: railway login"
    exit 1
fi
print_status "Autenticado no Railway"

# Verificar diretório
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    print_error "Execute este script na raiz do projeto"
    exit 1
fi
print_status "Diretório do projeto verificado"

# Instalar dependências
print_header "INSTALANDO DEPENDÊNCIAS"
npm install
print_status "Dependências instaladas"

# Executar testes
print_header "EXECUTANDO TESTES"
npm run lint
print_status "Lint passed"

npm run type-check
print_status "Type check passed"

# Build do projeto
print_header "BUILDING PROJETO"
npm run build
print_status "Build concluído"

# Deploy Railway (Backend + Workers)
print_header "DEPLOY RAILWAY"

print_info "Fazendo deploy do middleware-api..."
cd packages/middleware-api
railway up --detach
print_status "Middleware-api deployed"

print_info "Fazendo deploy dos workers..."
cd ../workers
railway up --detach
print_status "Workers deployed"
cd ../..

# Deploy Vercel (Frontend)
print_header "DEPLOY VERCEL"

print_info "Fazendo deploy do admin-dashboard..."
cd packages/admin-dashboard
vercel --prod
print_status "Admin-dashboard deployed"
cd ../..

# Verificar deploys
print_header "VERIFICANDO DEPLOYS"

print_info "Aguardando serviços ficarem online..."
sleep 30

# Aqui você pode adicionar health checks específicos
print_warning "Verifique manualmente os health checks:"
print_info "- Railway middleware-api: https://seu-middleware-api.railway.app/api/health"
print_info "- Railway workers: https://seu-workers.railway.app/health"
print_info "- Vercel frontend: https://seu-app.vercel.app"

# Finalização
print_header "DEPLOY CONCLUÍDO"
print_status "🎉 Deploy realizado com sucesso!"

echo ""
echo "🌐 URLs de produção:"
echo "   Frontend: https://seu-app.vercel.app"
echo "   Backend: https://seu-middleware-api.railway.app"
echo "   Workers: https://seu-workers.railway.app"
echo "   Queue Dashboard: https://seu-workers.railway.app/admin/queues"
echo ""
echo "📊 Monitoramento:"
echo "   Railway logs: railway logs --service middleware-api"
echo "   Vercel logs: vercel logs"
echo ""
echo "⚠️  Próximos passos:"
echo "   1. Configure as variáveis de ambiente no Railway"
echo "   2. Configure as variáveis de ambiente no Vercel"
echo "   3. Adicione Redis como add-on no Railway"
echo "   4. Teste as funcionalidades principais"
echo ""
echo "📖 Veja o arquivo DEPLOY_GUIDE.md para instruções detalhadas"