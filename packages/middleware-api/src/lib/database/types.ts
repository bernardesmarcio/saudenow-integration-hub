export interface Database {
  public: {
    Tables: {
      // Public schema tables (if any)
    };
  };
  dev: {
    Tables: {
      produtos: {
        Row: DevProduto;
        Insert: DevProdutoInsert;
        Update: DevProdutoUpdate;
      };
      clientes: {
        Row: DevCliente;
        Insert: DevClienteInsert;
        Update: DevClienteUpdate;
      };
      estoque: {
        Row: DevEstoque;
        Insert: DevEstoqueInsert;
        Update: DevEstoqueUpdate;
      };
      vendas: {
        Row: DevVenda;
        Insert: DevVendaInsert;
        Update: DevVendaUpdate;
      };
      integration_logs: {
        Row: DevIntegrationLog;
        Insert: DevIntegrationLogInsert;
        Update: DevIntegrationLogUpdate;
      };
      users: {
        Row: DevUser;
        Insert: DevUserInsert;
        Update: DevUserUpdate;
      };
    };
  };
}

// Dev Produto Types
export interface DevProduto {
  id: string;
  sku: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  preco: number | null;
  custo: number | null;
  peso: number | null;
  dimensoes: {
    altura?: number;
    largura?: number;
    profundidade?: number;
  } | null;
  imagens: string[] | null;
  ativo: boolean;
  sap_id: string | null;
  crm_id: string | null;
  shopify_id: string | null;
  retail_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DevProdutoInsert {
  id?: string;
  sku: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco?: number;
  custo?: number;
  peso?: number;
  dimensoes?: {
    altura?: number;
    largura?: number;
    profundidade?: number;
  };
  imagens?: string[];
  ativo?: boolean;
  sap_id?: string;
  crm_id?: string;
  shopify_id?: string;
  retail_id?: string;
  metadata?: Record<string, any>;
}

export interface DevProdutoUpdate {
  sku?: string;
  nome?: string;
  descricao?: string;
  categoria?: string;
  preco?: number;
  custo?: number;
  peso?: number;
  dimensoes?: {
    altura?: number;
    largura?: number;
    profundidade?: number;
  };
  imagens?: string[];
  ativo?: boolean;
  sap_id?: string;
  crm_id?: string;
  shopify_id?: string;
  retail_id?: string;
  metadata?: Record<string, any>;
}

// Dev Cliente Types
export interface DevCliente {
  id: string;
  cpf_cnpj: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  endereco: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  } | null;
  tipo: "pessoa_fisica" | "pessoa_juridica" | null;
  ativo: boolean;
  sap_id: string | null;
  crm_id: string | null;
  shopify_id: string | null;
  retail_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DevClienteInsert {
  id?: string;
  cpf_cnpj?: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  tipo?: "pessoa_fisica" | "pessoa_juridica";
  ativo?: boolean;
  sap_id?: string;
  crm_id?: string;
  shopify_id?: string;
  retail_id?: string;
  metadata?: Record<string, any>;
}

export interface DevClienteUpdate {
  cpf_cnpj?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  tipo?: "pessoa_fisica" | "pessoa_juridica";
  ativo?: boolean;
  sap_id?: string;
  crm_id?: string;
  shopify_id?: string;
  retail_id?: string;
  metadata?: Record<string, any>;
}

// Dev Estoque Types
export interface DevEstoque {
  id: string;
  produto_id: string;
  deposito: string;
  quantidade: number;
  quantidade_reservada: number;
  quantidade_disponivel: number;
  ultima_movimentacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface DevEstoqueInsert {
  id?: string;
  produto_id: string;
  deposito: string;
  quantidade?: number;
  quantidade_reservada?: number;
  ultima_movimentacao?: string;
}

export interface DevEstoqueUpdate {
  produto_id?: string;
  deposito?: string;
  quantidade?: number;
  quantidade_reservada?: number;
  ultima_movimentacao?: string;
}

// Dev Venda Types
export interface DevVenda {
  id: string;
  numero_venda: string;
  cliente_id: string;
  data_venda: string;
  total: number;
  status: "pendente" | "confirmada" | "cancelada" | "entregue";
  origem: string | null;
  origem_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DevVendaInsert {
  id?: string;
  numero_venda: string;
  cliente_id: string;
  data_venda?: string;
  total: number;
  status?: "pendente" | "confirmada" | "cancelada" | "entregue";
  origem?: string;
  origem_id?: string;
  metadata?: Record<string, any>;
}

export interface DevVendaUpdate {
  numero_venda?: string;
  cliente_id?: string;
  data_venda?: string;
  total?: number;
  status?: "pendente" | "confirmada" | "cancelada" | "entregue";
  origem?: string;
  origem_id?: string;
  metadata?: Record<string, any>;
}

// Dev Integration Log Types
export interface DevIntegrationLog {
  id: string;
  source: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  status: "success" | "error" | "pending" | "retry";
  details: Record<string, any> | null;
  error_message: string | null;
  duration_ms: number | null;
  retry_count: number;
  created_at: string;
}

export interface DevIntegrationLogInsert {
  id?: string;
  source: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  status?: "success" | "error" | "pending" | "retry";
  details?: Record<string, any>;
  error_message?: string;
  duration_ms?: number;
  retry_count?: number;
}

export interface DevIntegrationLogUpdate {
  source?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  status?: "success" | "error" | "pending" | "retry";
  details?: Record<string, any>;
  error_message?: string;
  duration_ms?: number;
  retry_count?: number;
}

// Dev User Types
export interface DevUser {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string | null;
  role: "admin" | "user" | "readonly";
  permissions: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DevUserInsert {
  id?: string;
  auth_user_id?: string;
  email: string;
  name?: string;
  role?: "admin" | "user" | "readonly";
  permissions?: Record<string, any>;
  active?: boolean;
}

export interface DevUserUpdate {
  auth_user_id?: string;
  email?: string;
  name?: string;
  role?: "admin" | "user" | "readonly";
  permissions?: Record<string, any>;
  active?: boolean;
}

// Utility types for dev schema
export type DevTableName = keyof Database["dev"]["Tables"];
export type DevTableRow<T extends DevTableName> =
  Database["dev"]["Tables"][T]["Row"];
export type DevTableInsert<T extends DevTableName> =
  Database["dev"]["Tables"][T]["Insert"];
export type DevTableUpdate<T extends DevTableName> =
  Database["dev"]["Tables"][T]["Update"];

// Legacy utility types (for public schema if needed)
export type PublicTableName = keyof Database["public"]["Tables"];
export type PublicTableRow<T extends PublicTableName> =
  Database["public"]["Tables"][T]["Row"];
export type PublicTableInsert<T extends PublicTableName> =
  Database["public"]["Tables"][T]["Insert"];
export type PublicTableUpdate<T extends PublicTableName> =
  Database["public"]["Tables"][T]["Update"];
