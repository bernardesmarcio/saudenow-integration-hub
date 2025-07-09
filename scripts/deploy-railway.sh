#!/bin/bash

# Deploy Script for Railway - Saudenow Integration Hub
set -e

echo "🚀 Iniciando deploy do Saudenow Integration Hub no Railway..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi

# Verificar se está logado no Railway
if ! railway whoami &> /dev/null; then
    print_error "Não está logado no Railway. Execute: railway login"
    exit 1
fi

print_status "Railway CLI verificado"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    print_error "Execute este script na raiz do projeto (saudenow-integration-hub)"
    exit 1
fi

print_status "Diretório do projeto verificado"

# Build do projeto
print_status "Executando build do projeto..."
npm run build || {
    print_error "Falha no build do projeto"
    exit 1
}

print_status "Build concluído com sucesso"

# Deploy do middleware-api
print_status "Fazendo deploy do middleware-api..."
cd packages/middleware-api
railway up --detach || {
    print_error "Falha no deploy do middleware-api"
    exit 1
}
cd ../..

print_status "Middleware-api deployed com sucesso"

# Deploy dos workers
print_status "Fazendo deploy dos workers..."
cd packages/workers
railway up --detach || {
    print_error "Falha no deploy dos workers"
    exit 1
}
cd ../..

print_status "Workers deployed com sucesso"

print_status "🎉 Deploy concluído com sucesso!"
print_warning "Não esqueça de configurar as variáveis de ambiente no Railway dashboard"
print_warning "Configure Redis e PostgreSQL como add-ons no Railway"

echo ""
echo "🌐 Próximos passos:"
echo "1. Acesse o Railway dashboard"
echo "2. Configure as variáveis de ambiente"
echo "3. Adicione Redis como add-on"
echo "4. Teste os endpoints"
echo ""
echo "📊 Para monitorar logs:"
echo "railway logs --service middleware-api"
echo "railway logs --service workers"