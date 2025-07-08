import React from 'react';
import type { ProductWithStock } from '../types/retail';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: ProductWithStock[];
  onRefreshStock: (productSid: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onRefreshStock
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m6 0h2m-8 4h8m4-4h-8V9a2 2 0 012-2h4a2 2 0 012 2v4z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
        <p className="mt-1 text-gray-500">
          Nenhum produto corresponde aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          Produtos ({products.length})
        </h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.sid}
            product={product}
            onRefreshStock={onRefreshStock}
          />
        ))}
      </div>
    </div>
  );
};