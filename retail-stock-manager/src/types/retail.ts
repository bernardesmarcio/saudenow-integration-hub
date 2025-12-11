// Retail Pro API Types

export interface Product {
  sid: string;
  description1: string;
  description2?: string;
  upc?: string;
  inventory?: ProductInventory[];
}

export interface ProductInventory {
  sid: string;
  store_sid: string;
  store_name: string;
  quantity: number;
  minimum_quantity: number;
  po_ordered_quantity: number;
}

export interface ProductWithStock extends Product {
  stockInfo?: {
    quantity: number;
    minimum_quantity: number;
    po_ordered_quantity: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
  };
  loading?: boolean;
}

export interface ApiResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface StockFilter {
  search: string;
  stockStatus: "all" | "in-stock" | "out-of-stock" | "low-stock";
}

export interface RetailProConfig {
  baseUrl: string;
  targetStoreId: string;
  targetStoreName: string;
}

export const RETAIL_PRO_CONFIG: RetailProConfig = {
  baseUrl: "http://macserver-pdv.maconequi.local",
  targetStoreId: "591940807000125261",
  targetStoreName: "RES",
};
