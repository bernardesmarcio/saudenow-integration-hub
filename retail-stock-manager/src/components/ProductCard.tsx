import React from "react";
import type { ProductWithStock } from "../types/retail";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProductCardProps {
  product: ProductWithStock;
  onRefreshStock: (productSid: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onRefreshStock,
}) => {
  const getStockStatusBadge = () => {
    if (!product.stockInfo) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Sem dados
        </span>
      );
    }

    if (product.stockInfo.isOutOfStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Sem estoque
        </span>
      );
    }

    if (product.stockInfo.isLowStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Estoque baixo
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Em estoque
      </span>
    );
  };

  const getStockColor = () => {
    if (!product.stockInfo) return "text-gray-500";
    if (product.stockInfo.isOutOfStock) return "text-red-600";
    if (product.stockInfo.isLowStock) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {product.description1}
          </h3>
          {product.description2 && (
            <p className="text-xs text-gray-500 truncate mt-1">
              {product.description2}
            </p>
          )}
        </div>
        <div className="ml-2 flex-shrink-0">{getStockStatusBadge()}</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">SID:</span>
          <span className="font-mono text-xs">{product.sid}</span>
        </div>

        {product.upc && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">UPC:</span>
            <span className="font-mono text-xs">{product.upc}</span>
          </div>
        )}

        {product.stockInfo && (
          <>
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantidade:</span>
                <span className={`font-semibold ${getStockColor()}`}>
                  {product.stockInfo.quantity}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mínimo:</span>
                <span className="text-gray-700">
                  {product.stockInfo.minimum_quantity}
                </span>
              </div>

              {product.stockInfo.po_ordered_quantity > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Em pedido:</span>
                  <span className="text-blue-600">
                    {product.stockInfo.po_ordered_quantity}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onRefreshStock(product.sid)}
          disabled={product.loading}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-xs flex items-center"
        >
          {product.loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-1" />
              Atualizando...
            </>
          ) : (
            <>
              <svg
                className="h-3 w-3 mr-1"
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
              Atualizar
            </>
          )}
        </button>
      </div>
    </div>
  );
};
