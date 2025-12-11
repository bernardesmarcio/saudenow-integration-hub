#!/bin/bash

# Script para parar ambiente de desenvolvimento
echo "🛑 Parando SaudeNow Integration Hub..."

# Parar aplicação Node.js
echo "⏹️ Parando aplicação..."
pkill -f "turbo run dev" || true
pkill -f "next dev" || true
pkill -f "tsx watch" || true

# Parar containers Docker
echo "🐳 Parando containers Docker..."
docker-compose down

echo "✅ Ambiente parado com sucesso!"