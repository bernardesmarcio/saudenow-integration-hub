import React from 'react';

interface StockStatsProps {
  stats: {
    total: number;
    withStock: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
    stockLoadingProgress: { completed: number; total: number };
  };
}

export const StockStats: React.FC<StockStatsProps> = ({ stats }) => {
  const statsData = [
    {
      label: 'Total de Produtos',
      value: stats.total,
      color: 'text-gray-900',
      bgColor: 'bg-gray-100'
    },
    {
      label: 'Com Estoque',
      value: stats.inStock,
      color: 'text-green-900',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Sem Estoque',
      value: stats.outOfStock,
      color: 'text-red-900',
      bgColor: 'bg-red-100'
    },
    {
      label: 'Estoque Baixo',
      value: stats.lowStock,
      color: 'text-yellow-900',
      bgColor: 'bg-yellow-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <div className={`text-lg font-semibold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};