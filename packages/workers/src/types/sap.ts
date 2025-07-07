export interface SapProduto {
  id: string;
  sku: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco?: number;
  custo?: number;
  peso?: number;
  dimensoes?: {
    altura: number;
    largura: number;
    profundidade: number;
  };
  imagens?: string[];
  ativo: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SapEstoque {
  produto_id: string;
  sku: string;
  quantidade: number;
  quantidade_reservada?: number;
  quantidade_disponivel?: number;
  deposito: string;
  localizacao?: string;
  lote?: string;
  validade?: string;
  custo_medio?: number;
  ultima_movimentacao?: string;
  updated_at: string;
}

export interface SapCliente {
  id: string;
  nome: string;
  tipo: 'PF' | 'PJ';
  cpf_cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  ativo: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SapVenda {
  id: string;
  numero_venda: string;
  cliente_id: string;
  data_venda: string;
  valor_total: number;
  valor_desconto?: number;
  valor_frete?: number;
  status: 'pendente' | 'processando' | 'aprovada' | 'enviada' | 'entregue' | 'cancelada';
  origem: 'sap' | 'ecommerce' | 'loja' | 'outros';
  items: SapVendaItem[];
  pagamento?: {
    forma: string;
    parcelas?: number;
    status: string;
  };
  entrega?: {
    tipo: string;
    prazo: number;
    endereco?: any;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SapVendaItem {
  produto_id: string;
  sku: string;
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
  total: number;
}

export interface SapApiResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  };
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

export interface SapDeltaRequest {
  modified_since?: string;
  limit?: number;
  page?: number;
  deposito?: string;
  include_deleted?: boolean;
}

export interface SapEstoqueCriticalRequest {
  threshold: number;
  depositos?: string[];
  categorias?: string[];
}

export interface SapError {
  code: string;
  message: string;
  details?: any;
}