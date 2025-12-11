import React from "react";
import { useRetailStock } from "../hooks/useRetailStock";
import { StockStats } from "./StockStats";
import { StockFilters } from "./StockFilters";
import { ProductList } from "./ProductList";
import { LoadingSpinner } from "./LoadingSpinner";

export const StockManager: React.FC = () => {
  const {
    products,
    loading,
    stockLoading,
    error,
    filters,
    stats,
    stockProgress,
    setFilters,
    loadProducts,
    loadStockInfo,
    refreshProductStock,
    searchProducts,
    clearError,
  } = useRetailStock();

  const handleRefreshAll = () => {
    loadProducts();
  };

  const handleLoadStock = () => {
    loadStockInfo();
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchProducts(query);
    } else {
      loadProducts();
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg text-gray-600">
          Carregando produtos...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stock Loading Progress */}
      {stockLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <LoadingSpinner size="sm" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Carregando informações de estoque...
              </h3>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-blue-700 mb-1">
                  <span>Progresso</span>
                  <span>
                    {stockProgress.completed} de {stockProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${stockProgress.total > 0 ? (stockProgress.completed / stockProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Atualizando..." : "Atualizar Produtos"}
          </button>

          <button
            onClick={handleLoadStock}
            disabled={stockLoading || products.length === 0}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            {stockLoading ? "Carregando..." : "Carregar Estoque"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <StockStats stats={stats} />

      {/* Filters */}
      <StockFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Products List */}
      <ProductList products={products} onRefreshStock={refreshProductStock} />
    </div>
  );
};
