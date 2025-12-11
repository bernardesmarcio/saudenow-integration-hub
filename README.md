# Saudenow Integration Hub

Hub de integração event-driven para sistemas de saúde, construído com tecnologias modernas e práticas de desenvolvimento AI-assisted.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14, React 18, TailwindCSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Queue**: Bull + Redis
- **Monorepo**: Turborepo
- **Deploy**: Vercel (frontend) + Railway (backend/workers)

## 📦 Estrutura do Monorepo

```
saudenow-integration-hub/
├── packages/
│   ├── middleware-api/      # API REST para integrações
│   ├── admin-dashboard/     # Dashboard administrativo Next.js
│   └── workers/            # Background jobs com Bull
├── database/
│   └── supabase/           # Migrations, seeds e functions
├── docs/                   # Documentação do projeto
├── scripts/                # Scripts utilitários
├── docker/                 # Configurações Docker
└── .github/workflows/      # CI/CD pipelines
```

## 🛠️ Setup de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm 9+
- Docker & Docker Compose
- Conta no Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/saudenow/saudenow-integration-hub.git
cd saudenow-integration-hub

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Inicie os serviços locais (Redis + PostgreSQL)
docker-compose -f docker/docker-compose.yml up -d

# Inicie o desenvolvimento
npm run dev
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia todos os packages em modo desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Executa testes
- `npm run lint` - Linting do código
- `npm run format` - Formatação com Prettier

## 🏗️ Arquitetura

O sistema segue uma arquitetura event-driven com:

- **Circuit Breakers** para resiliência
- **Retry Logic** para operações críticas
- **Queue System** para processamento assíncrono
- **API Gateway** pattern para integrações externas

## 🚀 Deploy

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend & Workers (Railway)

```bash
railway up
```

## 📄 Licença

Propriedade privada da Saudenow. Todos os direitos reservados.
