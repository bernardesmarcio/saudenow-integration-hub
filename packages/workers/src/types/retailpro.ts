// Retail Pro Integration Types

export interface RetailProConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  batchSize: number;
  stores: {
    [key: string]: RetailProStore;
  };
}

export interface RetailProStore {
  id: string;
  name: string;
  sid: string;
  active: boolean;
}

// API Response Types
export interface RetailProApiResponse<T> {
  data: T[];
  total?: number;
  offset?: number;
  limit?: number;
}

// Product Types
export interface RetailProProduct {
  sid: string;
  alu: string;
  description1: string;
  description2: string;
  vendor_name: string;
  sbsinventoryqtys?: RetailProInventoryQty[];
  // Additional fields that may be present
  upc?: string;
  price?: number;
  cost?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RetailProInventoryQty {
  store_sid: string;
  store_name: string;
  quantity: number;
  minimum_quantity: number;
  po_ordered_quantity: number;
  po_received_quantity: number;
}

// Processed Product Type (after transformation)
export interface ProcessedRetailProProduct {
  sid: string;
  alu: string;
  description: string; // description1 + description2
  brand: string; // vendor_name
  upc?: string;
  price?: number;
  cost?: number;
  active: boolean;
  stock?: ProcessedRetailProStock;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessedRetailProStock {
  store_sid: string;
  store_name: string;
  quantity: number;
  minimum_quantity: number;
  po_ordered_quantity: number;
  po_received_quantity: number;
  status: "in_stock" | "out_of_stock" | "low_stock" | "no_data";
  last_updated: Date;
}

// API Request Parameters
export interface RetailProProductQuery {
  cols?: string;
  limit?: number;
  offset?: number;
  search?: string;
  store_sid?: string;
}

export interface RetailProStockQuery {
  cols?: string;
  store_sid: string;
  inventory_sids?: string[];
}

// Batch Processing Types
export interface RetailProBatchResult<T> {
  success: T[];
  errors: RetailProBatchError[];
  total: number;
  processed: number;
}

export interface RetailProBatchError {
  sid: string;
  error: string;
  timestamp: Date;
}

// Sync Status Types
export interface RetailProSyncStatus {
  store_sid: string;
  last_product_sync: Date | null;
  last_stock_sync: Date | null;
  products_synced: number;
  stock_synced: number;
  errors: number;
  status: "idle" | "syncing" | "error" | "completed";
}

// Queue Job Types
export interface RetailProSyncJob {
  type: "full_sync" | "incremental_sync" | "stock_sync" | "product_sync";
  store_sid: string;
  options: {
    batch_size?: number;
    offset?: number;
    limit?: number;
    force?: boolean;
  };
  metadata?: {
    triggered_by: string;
    priority: "low" | "medium" | "high" | "critical";
  };
}

// Cache Keys
export const RETAIL_PRO_CACHE_KEYS = {
  PRODUCTS: (store_sid: string) => `retailpro:products:${store_sid}`,
  STOCK: (store_sid: string, product_sid: string) =>
    `retailpro:stock:${store_sid}:${product_sid}`,
  SYNC_STATUS: (store_sid: string) => `retailpro:sync:${store_sid}`,
  STORE_CONFIG: (store_sid: string) => `retailpro:config:${store_sid}`,
  BATCH_LOCK: (store_sid: string) => `retailpro:lock:${store_sid}`,
} as const;

// Error Types
export class RetailProError extends Error {
  constructor(
    message: string,
    public code: string,
    public store_sid?: string,
    public product_sid?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "RetailProError";
  }
}

export class RetailProTimeoutError extends RetailProError {
  constructor(store_sid?: string, product_sid?: string) {
    super(
      "Timeout na requisição para Retail Pro",
      "TIMEOUT",
      store_sid,
      product_sid,
    );
    this.name = "RetailProTimeoutError";
  }
}

export class RetailProNotFoundError extends RetailProError {
  constructor(resource: string, id: string) {
    super(`${resource} não encontrado: ${id}`, "NOT_FOUND", undefined, id);
    this.name = "RetailProNotFoundError";
  }
}

export class RetailProRateLimitError extends RetailProError {
  constructor(store_sid?: string) {
    super("Rate limit excedido para Retail Pro", "RATE_LIMIT", store_sid);
    this.name = "RetailProRateLimitError";
  }
}

// Constants
export const RETAIL_PRO_CONSTANTS = {
  DEFAULT_BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 500,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  CACHE_TTL: {
    PRODUCTS: 4 * 60 * 60, // 4 hours
    STOCK: 5 * 60, // 5 minutes
    SYNC_STATUS: 30 * 60, // 30 minutes
    CONFIG: 60 * 60, // 1 hour
  },
  STORES: {
    RESENDE: {
      ID: "resende",
      NAME: "Loja Resende",
      SID: "621769196001438846",
    },
  },
} as const;

// Database Integration Types
export interface RetailProProductEntity {
  id: string;
  retail_id: string; // sid
  sku: string; // alu
  nome: string; // description
  descricao?: string;
  categoria?: string;
  marca: string; // vendor_name
  preco?: number;
  custo?: number;
  upc?: string;
  ativo: boolean;
  metadata?: {
    retail_pro: {
      sid: string;
      alu: string;
      description1: string;
      description2: string;
      vendor_name: string;
      last_sync: string;
    };
  };
  created_at: Date;
  updated_at: Date;
}

export interface RetailProEstoqueEntity {
  id: string;
  produto_id: string;
  loja_sid: string;
  loja_nome: string;
  quantidade: number;
  quantidade_minima: number;
  quantidade_pedido: number;
  quantidade_recebida: number;
  status: "disponivel" | "indisponivel" | "baixo_estoque" | "sem_dados";
  ultima_atualizacao: Date;
  metadata?: {
    retail_pro: {
      store_sid: string;
      last_sync: string;
    };
  };
}
