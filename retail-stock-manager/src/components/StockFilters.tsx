import React, { useState } from "react";
import type { StockFilter } from "../types/retail";

interface StockFiltersProps {
  filters: StockFilter;
  onFiltersChange: (filters: StockFilter) => void;
  onSearch: (query: string) => void;
}

export const StockFilters: React.FC<StockFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchQuery });
    onSearch(searchQuery);
  };

  const handleStockStatusChange = (status: StockFilter["stockStatus"]) => {
    onFiltersChange({ ...filters, stockStatus: status });
  };

  const stockStatusOptions = [
    { value: "all", label: "Todos" },
    { value: "in-stock", label: "Em Estoque" },
    { value: "out-of-stock", label: "Sem Estoque" },
    { value: "low-stock", label: "Estoque Baixo" },
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nome, descrição ou UPC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Stock Status Filter */}
        <div className="sm:w-48">
          <select
            value={filters.stockStatus}
            onChange={(e) =>
              handleStockStatusChange(
                e.target.value as StockFilter["stockStatus"],
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {stockStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
