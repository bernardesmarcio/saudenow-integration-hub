#!/bin/bash

echo "🚀 Configurando Saudenow Integration Hub..."

# Instalar dependências
npm install

# Copiar arquivos de ambiente
cp .env.example .env.local

echo "✅ Setup concluído! Execute 'npm run dev' para iniciar o desenvolvimento."