// Product entity types for API
export interface ProdutoResponse {
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

export interface ProdutoCreateRequest {
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

export interface ProdutoUpdateRequest {
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

export interface ProdutoBulkCreateRequest {
  produtos: ProdutoCreateRequest[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  page?: number;
  limit?: number;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string[];
}

export interface ProdutoListResponse extends ApiResponse<ProdutoResponse[]> {
  count: number;
  page: number;
  limit: number;
}

export interface ProdutoSingleResponse extends ApiResponse<ProdutoResponse> {
  message: string;
}

// Query parameters for listing products
export interface ProdutoListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  ativo?: boolean;
  sap_id?: string;
  crm_id?: string;
  shopify_id?: string;
  retail_id?: string;
  sort_by?: 'nome' | 'sku' | 'categoria' | 'preco' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  preco_min?: number;
  preco_max?: number;
}

// Bulk operation responses
export interface BulkOperationResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    sku?: string;
    error: string;
  }>;
}

export interface ProdutoBulkResponse extends ApiResponse<BulkOperationResult> {
  message: string;
}