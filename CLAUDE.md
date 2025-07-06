# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Saudenow Integration Hub** - Hub de integração event-driven para sistemas de saúde, usando TypeScript, Next.js 14, Supabase, Bull Queue, e deployment em Vercel + Railway.

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend**: Next.js 14, React 18, TailwindCSS, Radix UI, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Queue**: Bull + Redis
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Deploy**: Vercel (frontend) + Railway (backend/workers)

## Project Structure

```
packages/
├── middleware-api/      # API REST (Express + Supabase)
├── admin-dashboard/     # Frontend Next.js
└── workers/            # Background jobs (Bull)
database/supabase/      # Migrations, seeds, functions
```

## Development Commands

```bash
# Desenvolvimento
npm run dev              # Inicia todos os packages
npm run build           # Build de produção
npm run test            # Executa testes
npm run lint            # Linting
npm run type-check      # Type checking
npm run format          # Formatação com Prettier

# Package específico
npm run dev --workspace=@saudenow/middleware-api
npm run dev --workspace=@saudenow/admin-dashboard
npm run dev --workspace=@saudenow/workers
```

## Architecture Patterns

1. **Event-Driven Architecture**: Use Bull queues para comunicação assíncrona
2. **Circuit Breakers**: Implemente resiliência em integrações externas
3. **Retry Logic**: Configure tentativas automáticas para operações críticas
4. **API Gateway Pattern**: Centralize integrações externas no middleware-api

## Development Guidelines

### Segurança e Compliance
- Dados de saúde devem seguir LGPD/HIPAA
- Nunca exponha chaves ou dados sensíveis
- Use variáveis de ambiente para configurações

### Code Style
- Use TypeScript strict mode
- Siga convenções do ESLint/Prettier configurados
- Componentes React em PascalCase
- Hooks customizados com prefixo "use"

### Testing
- Testes unitários para lógica de negócio
- Testes de integração para APIs
- Cobertura mínima de 80%

### Commits
- Use conventional commits (feat:, fix:, docs:, etc.)
- Mensagens descritivas e contextuais

## Environment Variables

Principais variáveis necessárias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `DATABASE_URL`

## Common Tasks

### Adicionar nova integração
1. Crie endpoint no middleware-api
2. Configure queue worker se necessário
3. Adicione UI no admin-dashboard
4. Documente em docs/api-reference.md

### Deploy
- Frontend: `vercel --prod`
- Backend: `railway up`

## Claude AI Configuration

The project has Claude AI tool permissions configured in `.claude/settings.local.json` allowing:
- `ls` commands for directory exploration
- `find` commands for file searching
- `mkdir` commands for directory creation