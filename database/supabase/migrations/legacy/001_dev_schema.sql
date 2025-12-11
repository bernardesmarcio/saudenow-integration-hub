-- Migration: 001_dev_schema.sql
-- Description: Create development schema with dev_ prefix tables
-- Date: 2025-07-06

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. dev_produtos table
CREATE TABLE dev_produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    preco DECIMAL(10,2),
    custo DECIMAL(10,2),
    peso DECIMAL(8,3),
    dimensoes JSONB,
    imagens TEXT[],
    ativo BOOLEAN DEFAULT true,
    sap_id TEXT,
    crm_id TEXT,
    shopify_id TEXT,
    retail_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dev_produtos
CREATE INDEX idx_dev_produtos_sku ON dev_produtos(sku);
CREATE INDEX idx_dev_produtos_sap_id ON dev_produtos(sap_id);
CREATE INDEX idx_dev_produtos_categoria ON dev_produtos(categoria);
CREATE INDEX idx_dev_produtos_ativo ON dev_produtos(ativo);

-- Trigger for updated_at
CREATE TRIGGER update_dev_produtos_updated_at
    BEFORE UPDATE ON dev_produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. dev_clientes table
CREATE TABLE dev_clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf_cnpj TEXT UNIQUE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    endereco JSONB,
    tipo TEXT CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica')),
    ativo BOOLEAN DEFAULT true,
    sap_id TEXT,
    crm_id TEXT,
    shopify_id TEXT,
    retail_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dev_clientes
CREATE INDEX idx_dev_clientes_cpf_cnpj ON dev_clientes(cpf_cnpj);
CREATE INDEX idx_dev_clientes_email ON dev_clientes(email);
CREATE INDEX idx_dev_clientes_tipo ON dev_clientes(tipo);

-- Trigger for updated_at
CREATE TRIGGER update_dev_clientes_updated_at
    BEFORE UPDATE ON dev_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. dev_estoque table
CREATE TABLE dev_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID REFERENCES dev_produtos(id),
    deposito TEXT NOT NULL,
    quantidade INTEGER DEFAULT 0,
    quantidade_reservada INTEGER DEFAULT 0,
    quantidade_disponivel INTEGER GENERATED ALWAYS AS (quantidade - quantidade_reservada) STORED,
    ultima_movimentacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produto_id, deposito)
);

-- Indexes for dev_estoque
CREATE INDEX idx_dev_estoque_produto_id ON dev_estoque(produto_id);
CREATE INDEX idx_dev_estoque_deposito ON dev_estoque(deposito);

-- Trigger for updated_at
CREATE TRIGGER update_dev_estoque_updated_at
    BEFORE UPDATE ON dev_estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. dev_vendas table
CREATE TABLE dev_vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_venda TEXT NOT NULL UNIQUE,
    cliente_id UUID REFERENCES dev_clientes(id),
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'entregue')),
    origem TEXT,
    origem_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dev_vendas
CREATE INDEX idx_dev_vendas_numero_venda ON dev_vendas(numero_venda);
CREATE INDEX idx_dev_vendas_cliente_id ON dev_vendas(cliente_id);
CREATE INDEX idx_dev_vendas_status ON dev_vendas(status);
CREATE INDEX idx_dev_vendas_origem ON dev_vendas(origem);

-- Trigger for updated_at
CREATE TRIGGER update_dev_vendas_updated_at
    BEFORE UPDATE ON dev_vendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. dev_integration_logs table
CREATE TABLE dev_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    status TEXT CHECK (status IN ('success', 'error', 'pending', 'retry')),
    details JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dev_integration_logs
CREATE INDEX idx_dev_integration_logs_source ON dev_integration_logs(source);
CREATE INDEX idx_dev_integration_logs_status ON dev_integration_logs(status);
CREATE INDEX idx_dev_integration_logs_entity_type ON dev_integration_logs(entity_type);
CREATE INDEX idx_dev_integration_logs_created_at ON dev_integration_logs(created_at);

-- 6. dev_users table (extends auth.users)
CREATE TABLE dev_users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'readonly')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dev_users
CREATE INDEX idx_dev_users_email ON dev_users(email);
CREATE INDEX idx_dev_users_role ON dev_users(role);
CREATE INDEX idx_dev_users_active ON dev_users(active);

-- Trigger for updated_at
CREATE TRIGGER update_dev_users_updated_at
    BEFORE UPDATE ON dev_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all dev_ tables
ALTER TABLE dev_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dev_produtos
CREATE POLICY "dev_produtos_select_policy" ON dev_produtos
    FOR SELECT USING (true);

CREATE POLICY "dev_produtos_insert_policy" ON dev_produtos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_produtos_update_policy" ON dev_produtos
    FOR UPDATE USING (true);

CREATE POLICY "dev_produtos_delete_policy" ON dev_produtos
    FOR DELETE USING (true);

-- RLS Policies for dev_clientes
CREATE POLICY "dev_clientes_select_policy" ON dev_clientes
    FOR SELECT USING (true);

CREATE POLICY "dev_clientes_insert_policy" ON dev_clientes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_clientes_update_policy" ON dev_clientes
    FOR UPDATE USING (true);

CREATE POLICY "dev_clientes_delete_policy" ON dev_clientes
    FOR DELETE USING (true);

-- RLS Policies for dev_estoque
CREATE POLICY "dev_estoque_select_policy" ON dev_estoque
    FOR SELECT USING (true);

CREATE POLICY "dev_estoque_insert_policy" ON dev_estoque
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_estoque_update_policy" ON dev_estoque
    FOR UPDATE USING (true);

CREATE POLICY "dev_estoque_delete_policy" ON dev_estoque
    FOR DELETE USING (true);

-- RLS Policies for dev_vendas
CREATE POLICY "dev_vendas_select_policy" ON dev_vendas
    FOR SELECT USING (true);

CREATE POLICY "dev_vendas_insert_policy" ON dev_vendas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_vendas_update_policy" ON dev_vendas
    FOR UPDATE USING (true);

CREATE POLICY "dev_vendas_delete_policy" ON dev_vendas
    FOR DELETE USING (true);

-- RLS Policies for dev_integration_logs
CREATE POLICY "dev_integration_logs_select_policy" ON dev_integration_logs
    FOR SELECT USING (true);

CREATE POLICY "dev_integration_logs_insert_policy" ON dev_integration_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "dev_integration_logs_update_policy" ON dev_integration_logs
    FOR UPDATE USING (true);

CREATE POLICY "dev_integration_logs_delete_policy" ON dev_integration_logs
    FOR DELETE USING (true);

-- RLS Policies for dev_users
CREATE POLICY "dev_users_select_policy" ON dev_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "dev_users_insert_policy" ON dev_users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "dev_users_update_policy" ON dev_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "dev_users_delete_policy" ON dev_users
    FOR DELETE USING (auth.uid() = id);

-- Comments for documentation
COMMENT ON TABLE dev_produtos IS 'Tabela de produtos para desenvolvimento com prefixo dev_';
COMMENT ON TABLE dev_clientes IS 'Tabela de clientes para desenvolvimento com prefixo dev_';
COMMENT ON TABLE dev_estoque IS 'Tabela de estoque para desenvolvimento com prefixo dev_';
COMMENT ON TABLE dev_vendas IS 'Tabela de vendas para desenvolvimento com prefixo dev_';
COMMENT ON TABLE dev_integration_logs IS 'Tabela de logs de integração para desenvolvimento com prefixo dev_';
COMMENT ON TABLE dev_users IS 'Tabela de usuários para desenvolvimento com prefixo dev_';