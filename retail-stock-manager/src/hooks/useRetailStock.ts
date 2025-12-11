import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  ProductWithStock,
  StockFilter,
  ProductInventory,
} from "../types/retail";
import { RetailApiService } from "../services/retailApi";

export const useRetailStock = () => {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockProgress, setStockProgress] = useState({
    completed: 0,
    total: 0,
  });

  const [filters, setFilters] = useState<StockFilter>({
    search: "",
    stockStatus: "all",
  });

  // Cache for stock data to avoid redundant API calls
  const [stockCache] = useState(new Map<string, ProductInventory | null>());

  /**
   * Load initial products list
   */
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const productsData = await RetailApiService.getProducts();
      const productsWithStock: ProductWithStock[] = productsData.map(
        (product) => ({
          ...product,
          loading: false,
        }),
      );

      setProducts(productsWithStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load stock information for all products
   */
  const loadStockInfo = useCallback(async () => {
    if (products.length === 0) return;

    setStockLoading(true);
    setStockProgress({ completed: 0, total: products.length });

    try {
      const productSids = products.map((p) => p.sid);

      // Get stock info with progress tracking
      const stockMap = await RetailApiService.getProductsWithStock(
        productSids,
        (completed, total) => {
          setStockProgress({ completed, total });
        },
      );

      // Update products with stock information
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const stockInfo = stockMap.get(product.sid);

          // Cache the stock data
          if (stockInfo !== undefined) {
            stockCache.set(product.sid, stockInfo);
          }

          if (stockInfo) {
            return {
              ...product,
              stockInfo: {
                quantity: stockInfo.quantity,
                minimum_quantity: stockInfo.minimum_quantity,
                po_ordered_quantity: stockInfo.po_ordered_quantity,
                isOutOfStock: stockInfo.quantity <= 0,
                isLowStock:
                  stockInfo.quantity > 0 &&
                  stockInfo.quantity <= stockInfo.minimum_quantity,
              },
              loading: false,
            };
          }

          return {
            ...product,
            stockInfo: undefined,
            loading: false,
          };
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load stock information",
      );
    } finally {
      setStockLoading(false);
    }
  }, [products, stockCache]);

  /**
   * Refresh stock for a specific product
   */
  const refreshProductStock = useCallback(
    async (productSid: string) => {
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.sid === productSid ? { ...product, loading: true } : product,
        ),
      );

      try {
        const stockInfo = await RetailApiService.getStoreInventory(productSid);

        // Update cache
        stockCache.set(productSid, stockInfo);

        setProducts((prevProducts) =>
          prevProducts.map((product) => {
            if (product.sid === productSid) {
              if (stockInfo) {
                return {
                  ...product,
                  stockInfo: {
                    quantity: stockInfo.quantity,
                    minimum_quantity: stockInfo.minimum_quantity,
                    po_ordered_quantity: stockInfo.po_ordered_quantity,
                    isOutOfStock: stockInfo.quantity <= 0,
                    isLowStock:
                      stockInfo.quantity > 0 &&
                      stockInfo.quantity <= stockInfo.minimum_quantity,
                  },
                  loading: false,
                };
              } else {
                return {
                  ...product,
                  stockInfo: undefined,
                  loading: false,
                };
              }
            }
            return product;
          }),
        );
      } catch (err) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.sid === productSid
              ? { ...product, loading: false }
              : product,
          ),
        );
        console.error(
          `Failed to refresh stock for product ${productSid}:`,
          err,
        );
      }
    },
    [stockCache],
  );

  /**
   * Search products
   */
  const searchProducts = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);

      try {
        const searchResults = await RetailApiService.searchProducts(query);
        const productsWithStock: ProductWithStock[] = searchResults.map(
          (product) => {
            // Check if we have cached stock data
            const cachedStock = stockCache.get(product.sid);

            if (cachedStock) {
              return {
                ...product,
                stockInfo: {
                  quantity: cachedStock.quantity,
                  minimum_quantity: cachedStock.minimum_quantity,
                  po_ordered_quantity: cachedStock.po_ordered_quantity,
                  isOutOfStock: cachedStock.quantity <= 0,
                  isLowStock:
                    cachedStock.quantity > 0 &&
                    cachedStock.quantity <= cachedStock.minimum_quantity,
                },
                loading: false,
              };
            }

            return {
              ...product,
              loading: false,
            };
          },
        );

        setProducts(productsWithStock);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search products",
        );
      } finally {
        setLoading(false);
      }
    },
    [stockCache],
  );

  /**
   * Filter products based on current filters
   */
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.description1?.toLowerCase().includes(searchTerm) ||
          product.description2?.toLowerCase().includes(searchTerm) ||
          product.upc?.toLowerCase().includes(searchTerm) ||
          product.sid?.toLowerCase().includes(searchTerm),
      );
    }

    // Apply stock status filter
    switch (filters.stockStatus) {
      case "in-stock":
        filtered = filtered.filter(
          (product) => product.stockInfo && product.stockInfo.quantity > 0,
        );
        break;
      case "out-of-stock":
        filtered = filtered.filter(
          (product) => product.stockInfo && product.stockInfo.quantity <= 0,
        );
        break;
      case "low-stock":
        filtered = filtered.filter(
          (product) => product.stockInfo && product.stockInfo.isLowStock,
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [products, filters]);

  /**
   * Statistics
   */
  const stats = useMemo(() => {
    const total = products.length;
    const withStock = products.filter((p) => p.stockInfo).length;
    const inStock = products.filter(
      (p) => p.stockInfo && p.stockInfo.quantity > 0,
    ).length;
    const outOfStock = products.filter(
      (p) => p.stockInfo && p.stockInfo.quantity <= 0,
    ).length;
    const lowStock = products.filter(
      (p) => p.stockInfo && p.stockInfo.isLowStock,
    ).length;

    return {
      total,
      withStock,
      inStock,
      outOfStock,
      lowStock,
      stockLoadingProgress: stockProgress,
    };
  }, [products, stockProgress]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products: filteredProducts,
    loading,
    stockLoading,
    error,
    filters,
    stats,
    stockProgress,

    // Actions
    setFilters,
    loadProducts,
    loadStockInfo,
    refreshProductStock,
    searchProducts,

    // Utilities
    clearError: () => setError(null),
  };
};
