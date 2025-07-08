#!/bin/bash

# Script para iniciar ambiente de desenvolvimento completo
echo "🚀 Iniciando SaudeNow Integration Hub..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

# Parar containers existentes se estiverem rodando
echo "🛑 Parando containers existentes..."
docker-compose down > /dev/null 2>&1

# Iniciar Redis
echo "🔴 Iniciando Redis..."
docker-compose up -d redis

# Aguardar Redis estar pronto
echo "⏳ Aguardando Redis ficar pronto..."
until docker exec saudenow-redis redis-cli ping > /dev/null 2>&1; do
    printf "."
    sleep 1
done
echo " ✅ Redis pronto!"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Iniciar aplicação
echo "🏃‍♂️ Iniciando aplicação..."
npm run dev