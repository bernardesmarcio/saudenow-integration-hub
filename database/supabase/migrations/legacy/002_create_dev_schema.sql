-- Migration: 002_create_dev_schema.sql
-- Description: Create dev schema and move tables from public to dev schema
-- Date: 2025-07-06

-- Step 1: Create dev schema
CREATE SCHEMA IF NOT EXISTS dev;

-- Step 2: Drop existing tables from public schema (if they exist)
DROP TABLE IF EXISTS public.dev_integration_logs CASCADE;
DROP TABLE IF EXISTS public.dev_vendas CASCADE;
DROP TABLE IF EXISTS public.dev_estoque CASCADE;
DROP TABLE IF EXISTS public.dev_users CASCADE;
DROP TABLE IF EXISTS public.dev_clientes CASCADE;
DROP TABLE IF EXISTS public.dev_produtos CASCADE;

-- Step 3: Create updated_at trigger function in dev schema
CREATE OR REPLACE FUNCTION dev.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create all tables in dev schema

-- 1. dev.produtos table
-- CREATE TABLE dev.produtos (...)
-- (comando comentado pois a tabela já existe)

-- Indexes for dev.produtos
CREATE INDEX IF NOT EXISTS idx_dev_produtos_sku ON dev.produtos(sku);
CREATE INDEX IF NOT EXISTS idx_dev_produtos_sap_id ON dev.produtos(sap_id);
CREATE INDEX IF NOT EXISTS idx_dev_produtos_categoria ON dev.produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_dev_produtos_ativo ON dev.produtos(ativo);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dev_produtos_updated_at') THEN
    CREATE TRIGGER update_dev_produtos_updated_at
      BEFORE UPDATE ON dev.produtos
      FOR EACH ROW
      EXECUTE FUNCTION dev.update_updated_at_column();
  END IF;
END $$;

-- 2. dev.clientes table
-- CREATE TABLE dev.clientes (...)
-- (comando comentado pois a tabela já existe)

-- Indexes for dev.clientes
CREATE INDEX IF NOT EXISTS idx_dev_clientes_cpf_cnpj ON dev.clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_dev_clientes_email ON dev.clientes(email);
CREATE INDEX IF NOT EXISTS idx_dev_clientes_tipo ON dev.clientes(tipo);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dev_clientes_updated_at') THEN
    CREATE TRIGGER update_dev_clientes_updated_at
      BEFORE UPDATE ON dev.clientes
      FOR EACH ROW
      EXECUTE FUNCTION dev.update_updated_at_column();
  END IF;
END $$;

-- 3. dev.estoque table
-- CREATE TABLE dev.estoque (...)
-- (comando comentado pois a tabela já existe)

-- Indexes for dev.estoque
CREATE INDEX IF NOT EXISTS idx_dev_estoque_produto_id ON dev.estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_dev_estoque_deposito ON dev.estoque(deposito);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dev_estoque_updated_at') THEN
    CREATE TRIGGER update_dev_estoque_updated_at
      BEFORE UPDATE ON dev.estoque
      FOR EACH ROW
      EXECUTE FUNCTION dev.update_updated_at_column();
  END IF;
END $$;

-- 4. dev.vendas table
-- CREATE TABLE dev.vendas (...)
-- (comando comentado pois a tabela já existe)

-- Indexes for dev.vendas
CREATE INDEX IF NOT EXISTS idx_dev_vendas_numero_venda ON dev.vendas(numero_venda);
CREATE INDEX IF NOT EXISTS idx_dev_vendas_cliente_id ON dev.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_dev_vendas_status ON dev.vendas(status);
CREATE INDEX IF NOT EXISTS idx_dev_vendas_origem ON dev.vendas(origem);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dev_vendas_updated_at') THEN
    CREATE TRIGGER update_dev_vendas_updated_at
      BEFORE UPDATE ON dev.vendas
      FOR EACH ROW
      EXECUTE FUNCTION dev.update_updated_at_column();
  END IF;
END $$;

-- 5. dev.integration_logs table
-- CREATE TABLE dev.integration_logs (...)
-- (comando comentado pois a tabela já existe)

-- Indexes for dev.integration_logs
CREATE INDEX IF NOT EXISTS idx_dev_integration_logs_source ON dev.integration_logs(source);
CREATE INDEX IF NOT EXISTS idx_dev_integration_logs_status ON dev.integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_dev_integration_logs_entity_type ON dev.integration_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_dev_integration_logs_created_at ON dev.integration_logs(created_at);

-- 6. dev.users table
-- CREATE TABLE dev.users (...)
-- (comando comentado pois a tabela já existe)

-- Indexes for dev.users
CREATE INDEX IF NOT EXISTS idx_dev_users_auth_user_id ON dev.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_users_email ON dev.users(email);
CREATE INDEX IF NOT EXISTS idx_dev_users_role ON dev.users(role);
CREATE INDEX IF NOT EXISTS idx_dev_users_active ON dev.users(active);

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dev_users_updated_at') THEN
    CREATE TRIGGER update_dev_users_updated_at
      BEFORE UPDATE ON dev.users
      FOR EACH ROW
      EXECUTE FUNCTION dev.update_updated_at_column();
  END IF;
END $$;

-- Step 5: Row Level Security (RLS) Policies

-- Enable RLS on all dev tables
ALTER TABLE dev.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dev.produtos
CREATE POLICY IF NOT EXISTS "dev_produtos_select_policy" ON dev.produtos
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "dev_produtos_insert_policy" ON dev.produtos
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_produtos_update_policy" ON dev.produtos
    FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_produtos_delete_policy" ON dev.produtos
    FOR DELETE USING (true);

-- RLS Policies for dev.clientes
CREATE POLICY IF NOT EXISTS "dev_clientes_select_policy" ON dev.clientes
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "dev_clientes_insert_policy" ON dev.clientes
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_clientes_update_policy" ON dev.clientes
    FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_clientes_delete_policy" ON dev.clientes
    FOR DELETE USING (true);

-- RLS Policies for dev.estoque
CREATE POLICY IF NOT EXISTS "dev_estoque_select_policy" ON dev.estoque
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "dev_estoque_insert_policy" ON dev.estoque
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_estoque_update_policy" ON dev.estoque
    FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_estoque_delete_policy" ON dev.estoque
    FOR DELETE USING (true);

-- RLS Policies for dev.vendas
CREATE POLICY IF NOT EXISTS "dev_vendas_select_policy" ON dev.vendas
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "dev_vendas_insert_policy" ON dev.vendas
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_vendas_update_policy" ON dev.vendas
    FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_vendas_delete_policy" ON dev.vendas
    FOR DELETE USING (true);

-- RLS Policies for dev.integration_logs
CREATE POLICY IF NOT EXISTS "dev_integration_logs_select_policy" ON dev.integration_logs
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "dev_integration_logs_insert_policy" ON dev.integration_logs
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_integration_logs_update_policy" ON dev.integration_logs
    FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_integration_logs_delete_policy" ON dev.integration_logs
    FOR DELETE USING (true);

-- RLS Policies for dev.users
CREATE POLICY IF NOT EXISTS "dev_users_select_policy" ON dev.users
    FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "dev_users_insert_policy" ON dev.users
    FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_users_update_policy" ON dev.users
    FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_users_delete_policy" ON dev.users
    FOR DELETE USING (true);

-- Step 6: Comments for documentation
COMMENT ON SCHEMA dev IS 'Development schema for SaúdeNow Integration Hub';
COMMENT ON TABLE dev.produtos IS 'Tabela de produtos para desenvolvimento';
COMMENT ON TABLE dev.clientes IS 'Tabela de clientes para desenvolvimento';
COMMENT ON TABLE dev.estoque IS 'Tabela de estoque para desenvolvimento';
COMMENT ON TABLE dev.vendas IS 'Tabela de vendas para desenvolvimento';
COMMENT ON TABLE dev.integration_logs IS 'Tabela de logs de integração para desenvolvimento';
COMMENT ON TABLE dev.users IS 'Tabela de usuários para desenvolvimento (sem FK para auth.users)';

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA dev TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA dev TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO authenticated, anon;