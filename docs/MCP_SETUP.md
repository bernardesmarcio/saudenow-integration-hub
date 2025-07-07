# Supabase MCP Setup

Este documento explica como configurar e usar o Supabase MCP (Model Context Protocol) no projeto Saudenow Integration Hub.

## O que é MCP?

MCP (Model Context Protocol) é um protocolo que permite que assistentes de IA como Claude acessem e interajam com dados e serviços externos de forma segura e controlada.

## Configuração do Supabase MCP

### 1. Instalação

O Supabase MCP já está configurado no arquivo `.claude/mcp_servers.json` e a dependência `mcp-supabase` foi adicionada ao `package.json`.

### 2. Configuração das Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:
   ```bash
   cp env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais do Supabase:
   ```env
   SUPABASE_URL=https://seu-projeto-id.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
   ```

### 3. Como obter as credenciais do Supabase

1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings** > **API**
4. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## Uso do MCP

Com o MCP configurado, você pode:

- **Consultar dados**: Fazer queries SQL diretamente no banco
- **Gerenciar tabelas**: Criar, modificar e deletar tabelas
- **Executar funções**: Chamar funções Edge Functions
- **Gerenciar permissões**: Configurar RLS (Row Level Security)

### Exemplos de uso

```sql
-- Consultar dados
SELECT * FROM users LIMIT 10;

-- Criar tabela
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados
INSERT INTO products (name, price) VALUES ('Produto Teste', 99.99);
```

## Segurança

- Nunca commite o arquivo `.env` no repositório
- Use sempre as chaves apropriadas para cada operação
- Configure RLS (Row Level Security) adequadamente
- Monitore o uso das APIs

## Troubleshooting

### MCP não conecta
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o projeto Supabase está ativo
3. Teste a conexão com o cliente Supabase

### Erro de permissão
1. Verifique se está usando a chave correta (anon vs service_role)
2. Confirme as políticas de RLS
3. Verifique se o usuário tem as permissões necessárias

## Recursos Adicionais

- [Documentação oficial do MCP Supabase](https://www.npmjs.com/package/mcp-supabase)
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security) 