#!/bin/sh

# Script de start para Railway
# Usa a porta fornecida pelo Railway ou fallback para 3001

export PORT=${PORT:-3001}

echo "🚀 Starting middleware-api on port $PORT"
echo "🌐 Environment: $NODE_ENV"
echo "📍 Binding to 0.0.0.0:$PORT"

# Start Next.js server using npm
exec npm start