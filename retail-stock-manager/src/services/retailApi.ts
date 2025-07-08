import axios from 'axios';
import type { Product, ProductInventory } from '../types/retail';
import { RETAIL_PRO_CONFIG } from '../types/retail';

const api = axios.create({
  baseURL: RETAIL_PRO_CONFIG.baseUrl,
  timeout: 30000,
});

// Add request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export class RetailApiService {
  /**
   * Fetch all products with basic info
   */
  static async getProducts(): Promise<Product[]> {
    try {
      const response = await api.get('/v1/rest/inventory', {
        params: {
          cols: 'sid,description1,description2,upc,sbsinventoryqtys'
        }
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products from Retail Pro');
    }
  }

  /**
   * Fetch detailed product info including inventory
   */
  static async getProductDetails(productSid: string): Promise<Product> {
    try {
      const response = await api.get(`/v1/rest/inventory/${productSid}`, {
        params: {
          cols: 'sid,description1,description2,upc,sbsinventoryqtys'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching product details for ${productSid}:`, error);
      throw new Error(`Failed to fetch product details for ${productSid}`);
    }
  }

  /**
   * Fetch inventory quantities for a specific product
   */
  static async getProductInventory(productSid: string): Promise<ProductInventory[]> {
    try {
      // First, get the product to find inventory quantity SIDs
      const product = await this.getProductDetails(productSid);
      
      if (!product.inventory || product.inventory.length === 0) {
        return [];
      }

      // Fetch detailed inventory for each quantity SID
      const inventoryPromises = product.inventory.map(async (inv) => {
        try {
          const response = await api.get(
            `/v1/rest/inventory/${productSid}/sbsinventoryqty/${inv.sid}`,
            {
              params: {
                cols: 'store_sid,store_name,quantity,minimum_quantity,po_ordered_quantity'
              }
            }
          );
          return response.data;
        } catch (error) {
          console.error(`Error fetching inventory for ${productSid}/${inv.sid}:`, error);
          return null;
        }
      });

      const inventoryResults = await Promise.all(inventoryPromises);
      return inventoryResults.filter(Boolean);
    } catch (error) {
      console.error(`Error fetching inventory for product ${productSid}:`, error);
      return [];
    }
  }

  /**
   * Fetch inventory for specific store (RES)
   */
  static async getStoreInventory(productSid: string): Promise<ProductInventory | null> {
    try {
      const allInventory = await this.getProductInventory(productSid);
      
      // Filter for target store (RES)
      const storeInventory = allInventory.find(
        inv => inv.store_sid === RETAIL_PRO_CONFIG.targetStoreId
      );

      return storeInventory || null;
    } catch (error) {
      console.error(`Error fetching store inventory for ${productSid}:`, error);
      return null;
    }
  }

  /**
   * Fetch products with stock info in parallel for better performance
   */
  static async getProductsWithStock(
    productSids: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, ProductInventory | null>> {
    const batchSize = 10; // Process 10 products at a time
    const results = new Map<string, ProductInventory | null>();
    let completed = 0;

    for (let i = 0; i < productSids.length; i += batchSize) {
      const batch = productSids.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (productSid) => {
        try {
          const inventory = await this.getStoreInventory(productSid);
          results.set(productSid, inventory);
          completed++;
          onProgress?.(completed, productSids.length);
          return { productSid, inventory };
        } catch (error) {
          console.error(`Error processing product ${productSid}:`, error);
          results.set(productSid, null);
          completed++;
          onProgress?.(completed, productSids.length);
          return { productSid, inventory: null };
        }
      });

      // Wait for current batch to complete before moving to next
      await Promise.all(batchPromises);
      
      // Small delay to avoid overwhelming the API
      if (i + batchSize < productSids.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Search products by name or UPC
   */
  static async searchProducts(query: string): Promise<Product[]> {
    try {
      const allProducts = await this.getProducts();
      
      if (!query.trim()) {
        return allProducts;
      }

      const searchTerm = query.toLowerCase().trim();
      
      return allProducts.filter(product => 
        product.description1?.toLowerCase().includes(searchTerm) ||
        product.description2?.toLowerCase().includes(searchTerm) ||
        product.upc?.toLowerCase().includes(searchTerm) ||
        product.sid?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Health check for API connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/v1/rest/inventory', {
        params: { cols: 'sid' },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}