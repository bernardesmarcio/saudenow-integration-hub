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

## Root Commands (Turborepo)
```bash
# Desenvolvimento
npm run dev              # Inicia todos os packages em paralelo
npm run build           # Build de produção (respeitando dependências)
npm run test            # Executa testes em todos os packages
npm run lint            # Linting com ESLint + TypeScript
npm run type-check      # Verificação de tipos TypeScript
npm run format          # Formatação com Prettier
npm run clean           # Limpa arquivos de build (.next, dist)

# Release Management
npm run changeset       # Cria novo changeset para versionamento
npm run version-packages # Atualiza versões dos packages
npm run release         # Build + lint + test + publish
```

## Package-Specific Commands

### @saudenow/admin-dashboard (Next.js 14)
```bash
# Desenvolvimento (porta padrão 3000)
npm run dev --workspace=@saudenow/admin-dashboard

# Scripts disponíveis:
# - dev: next dev
# - build: next build
# - start: next start
# - lint: next lint
# - type-check: tsc --noEmit
# - clean: rm -rf .next
```

### @saudenow/middleware-api (Next.js API)
```bash
# Desenvolvimento (porta 3001)
npm run dev --workspace=@saudenow/middleware-api

# Scripts disponíveis:
# - dev: next dev -p 3001
# - build: next build
# - start: next start -p 3001
# - test: jest (com coverage threshold 70%)
# - lint: eslint src --ext .ts
# - type-check: tsc --noEmit
# - clean: rm -rf .next dist
```

### @saudenow/workers (Background Jobs)
```bash
# Desenvolvimento com hot reload
npm run dev --workspace=@saudenow/workers

# Scripts disponíveis:
# - dev: tsx watch src/index.ts
# - start: node dist/index.js
# - build: tsc
# - test: jest
# - lint: eslint src --ext .ts
# - type-check: tsc --noEmit
# - clean: rm -rf dist

# Redis local (Docker)
# - redis:up: docker-compose up -d redis
# - redis:down: docker-compose down
# - redis:logs: docker-compose logs -f redis

# Utilitários
# - test:sap: tsx scripts/test-sap.ts
# - start:local: node scripts/start-local.js
```

## Architecture Patterns

1. **Event-Driven Architecture**: Use Bull queues para comunicação assíncrona
   - Padrão: `integration:${integrationId}:${action}` para nomes de filas
   - Eventos emitidos: `integration.created`, `integration.synced`, `integration.failed`
   
2. **Circuit Breakers**: Implemente resiliência em integrações externas
   - Threshold: 5 falhas em 1 minuto
   - Timeout: 30 segundos para reset
   - Estados: CLOSED, OPEN, HALF_OPEN
   
3. **Retry Logic**: Configure tentativas automáticas para operações críticas
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
   - Max retries: 5 tentativas
   - Idempotência obrigatória
   
4. **API Gateway Pattern**: Centralize integrações externas no middleware-api
   - Rota base: `/api/integrations/[provider]/[action]`
   - Autenticação unificada via Supabase Auth
   - Rate limiting por tenant

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

### ESLint Configuration
```javascript
// .eslintrc.js
{
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": false,              // Sem ponto e vírgula
  "singleQuote": true,        // Aspas simples
  "tabWidth": 2,              // Indentação de 2 espaços
  "trailingComma": "es5",     // Vírgula em arrays/objetos
  "printWidth": 80,           // Largura máxima de linha
  "arrowParens": "always"     // Parênteses em arrow functions
}
```

### Testing
- Testes unitários para lógica de negócio
- Testes de integração para APIs
- Cobertura mínima de 70% (configurado no Jest)
- Use `describe` e `it` para organização
- Mock Supabase client em testes unitários
- Use Supertest para testes de API

### Commits
- Use conventional commits (feat:, fix:, docs:, etc.)
- Mensagens descritivas e contextuais

## Environment Variables

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave pública para frontend
- `SUPABASE_SERVICE_ROLE_KEY` - Chave admin para backend
- `DATABASE_URL` - String de conexão PostgreSQL

### Redis/Queue
- `REDIS_URL` - URL do Redis (formato: redis://localhost:6379)
- `BULL_REDIS_HOST` - Host do Redis para Bull
- `BULL_REDIS_PORT` - Porta do Redis para Bull

### Monitoring
- `SENTRY_DSN` - URL do Sentry para error tracking
- `LOG_LEVEL` - Nível de log (debug, info, warn, error)

### Integrations (adicionar conforme necessário)
- `SAP_API_KEY` - Chave API do SAP
- `SAP_BASE_URL` - URL base do SAP
- `INTEGRATION_TIMEOUT` - Timeout padrão (30000ms)

## Key Dependencies

### Frontend (@saudenow/admin-dashboard)
- **UI Framework**: Next.js 14, React 18, TailwindCSS
- **Component Library**: Radix UI (headless components)
- **Data Fetching**: @tanstack/react-query v5
- **Auth**: @supabase/auth-helpers-nextjs
- **Icons**: lucide-react
- **Charts**: recharts
- **Utils**: clsx, tailwind-merge, class-variance-authority

### Backend (@saudenow/middleware-api)
- **Framework**: Next.js API Routes + Express middleware
- **Database**: @supabase/supabase-js
- **Queue**: Bull + ioredis
- **Validation**: Zod
- **API Docs**: swagger-jsdoc, swagger-ui-express
- **Testing**: Jest + Supertest
- **Logging**: Pino
- **Rate Limiting**: express-rate-limit

### Workers (@saudenow/workers)
- **Queue Processing**: Bull + ioredis
- **HTTP Client**: Axios + retry-axios
- **Scheduling**: node-cron
- **Monitoring**: Bull Board
- **Retry Logic**: p-retry
- **Logging**: Pino + Winston
- **Utils**: Lodash

## Testing Configuration

### Jest Setup (middleware-api)
- **Environment**: Node
- **Coverage Threshold**: 70% (branches, functions, lines, statements)
- **Test Files**: `*.test.ts`, `*.spec.ts`, `__tests__/**`
- **Setup File**: `jest.setup.js`
- **Module Aliases**: `@/` maps to `src/`

### Testing Commands
```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=@saudenow/middleware-api
npm run test --workspace=@saudenow/workers

# Run tests with coverage
npm run test -- --coverage

# Run tests in watch mode
npm run test -- --watch
```

## Build Process

### Turborepo Pipeline
- **Build Order**: Respects package dependencies (`dependsOn: ["^build"]`)
- **Outputs**: `.next/**`, `dist/**`
- **Caching**: Enabled for builds, disabled for dev/test
- **Environment Variables**: Automatically included in build context

### Build Outputs
- **admin-dashboard**: `.next/` (Next.js optimized build)
- **middleware-api**: `.next/` (Next.js API build)
- **workers**: `dist/` (TypeScript compilation)

## Common Tasks

### Adicionar nova integração
1. Crie endpoint no middleware-api em `src/app/api/integrations/[integration-name]/route.ts`
2. Adicione tipos em `src/types/integrations.ts`
3. Configure queue worker em `packages/workers/src/processors/`
4. Implemente circuit breaker se necessário em `src/lib/circuit-breaker.ts`
5. Adicione UI no admin-dashboard em `src/app/(dashboard)/integrations/`
6. Configure credenciais no Supabase (`integrations` table)
7. Documente endpoints em `src/app/api/swagger/route.ts`

### Executar testes específicos
```bash
# Testar arquivo específico
npm run test -- path/to/file.test.ts

# Testar com pattern matching
npm run test -- --testNamePattern="should process queue"

# Debug tests
npm run test -- --detectOpenHandles --forceExit
```

### Database Operations
```bash
# Aplicar migrations
npx supabase db push

# Gerar tipos TypeScript do schema
npx supabase gen types typescript --project-id=$PROJECT_ID > database/types.ts

# Seed database
npx tsx database/supabase/seeds/dev.ts
```

### Queue Management
```bash
# Monitorar filas localmente
npm run dev --workspace=@saudenow/workers
# Acesse http://localhost:4000/admin/queues

# Limpar filas Redis
redis-cli FLUSHDB
```

### Deploy
- Frontend: `vercel --prod`
- Backend: `railway up`
- Workers: Configure no Railway com variáveis de ambiente

## API Design Standards

### REST Conventions
- Use Next.js App Router conventions: `route.ts` files
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (delete)
- Status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
- Response format:
  ```typescript
  {
    success: boolean,
    data?: any,
    error?: { message: string, code: string }
  }
  ```

### Error Handling
- Use custom error classes extending `Error`
- Log errors with context using Pino
- Return user-friendly error messages
- Include correlation IDs for debugging

## Database Schema Conventions

### Naming
- Tables: snake_case plural (e.g., `integrations`, `sync_logs`)
- Columns: snake_case (e.g., `created_at`, `tenant_id`)
- Foreign keys: `{table}_id` (e.g., `integration_id`)

### Standard Columns
- `id`: UUID primary key
- `created_at`: timestamp with timezone
- `updated_at`: timestamp with timezone
- `tenant_id`: UUID for multi-tenancy
- `is_active`: boolean for soft deletes

### Supabase RLS (Row Level Security)
- Enable RLS on all tables
- Use service role key only in backend
- Frontend uses anon key with RLS policies

## Performance Optimization

### Caching Strategy
- Use Redis for session data and frequently accessed configs
- Cache integration credentials (encrypted)
- TTL: 5 minutes for dynamic data, 1 hour for static

### Query Optimization
- Use database indexes on foreign keys and frequently queried columns
- Paginate large result sets (default: 50 items)
- Use Supabase's query builder efficiently

### Frontend Performance
- Use React Query for data fetching and caching
- Implement optimistic updates
- Lazy load heavy components
- Use Next.js Image optimization

## Monitoring and Logging

### Structured Logging
```typescript
logger.info({
  action: 'integration.sync',
  integrationId: id,
  duration: endTime - startTime,
  recordsProcessed: count
})
```

### Metrics to Track
- API response times
- Queue processing times
- Integration sync success/failure rates
- Error rates by type

## Security Patterns

### Authentication
- Supabase Auth with JWT tokens
- Session management via cookies
- Multi-factor authentication support

### Data Encryption
- Encrypt sensitive data at rest (credentials, API keys)
- Use HTTPS for all communications
- Sanitize user inputs

### Rate Limiting
- API: 100 requests per minute per tenant
- Queue: Max 1000 jobs per hour per integration
- Webhook: 50 requests per minute

## Claude AI Configuration

The project has Claude AI tool permissions configured in `.claude/settings.local.json` allowing:
- `ls` commands for directory exploration
- `find` commands for file searching
- `mkdir` commands for directory creation

## Supabase MCP Integration

The project uses Supabase Model Context Protocol (MCP) for AI-assisted database operations:
- Configuration: See `MCP_SETUP.md` for setup instructions
- Enables Claude to query and analyze database schema
- Helps with migration generation and query optimization