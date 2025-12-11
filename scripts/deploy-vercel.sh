#!/bin/bash

# Deploy Script for Vercel - Admin Dashboard
set -e

echo "🚀 Iniciando deploy do Admin Dashboard no Vercel..."

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

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI não encontrado. Instale com: npm install -g vercel"
    exit 1
fi

print_status "Vercel CLI verificado"

# Verificar se estamos no diretório correto
if [ ! -f "packages/admin-dashboard/package.json" ]; then
    print_error "Execute este script na raiz do projeto (saudenow-integration-hub)"
    exit 1
fi

print_status "Diretório do projeto verificado"

# Navegar para o diretório do frontend
cd packages/admin-dashboard

# Build do frontend
print_status "Executando build do frontend..."
npm run build || {
    print_error "Falha no build do frontend"
    exit 1
}

print_status "Build do frontend concluído"

# Deploy para Vercel
print_status "Fazendo deploy para Vercel..."
vercel --prod || {
    print_error "Falha no deploy para Vercel"
    exit 1
}

print_status "🎉 Deploy do frontend concluído com sucesso!"
print_warning "Não esqueça de configurar as variáveis de ambiente no Vercel dashboard"

echo ""
echo "🌐 Próximos passos:"
echo "1. Acesse o Vercel dashboard"
echo "2. Configure as variáveis de ambiente:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NEXT_PUBLIC_API_URL (URL do Railway)"
echo "   - NEXT_PUBLIC_WORKERS_URL (URL do Railway Workers)"
echo "3. Teste o frontend"
echo ""
echo "📊 Para ver logs:"
echo "vercel logs"