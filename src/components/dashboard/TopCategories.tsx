import React from 'react';
import { Tag } from 'lucide-react';
import { CategoryExpenseSummary } from '../../types/dashboard';
import { formatBRL } from '../../utils/money';

interface TopCategoriesProps {
  categories: CategoryExpenseSummary[];
}

export function TopCategories({ categories }: TopCategoriesProps) {
  if (categories.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Maiores Gastos
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Categorias com maior volume de despesas
          </p>
        </div>
        <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          Nenhuma despesa registrada neste período.
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Maiores Gastos
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Categorias com maior volume de despesas
        </p>
      </div>

      <div className="space-y-3.5">
        {categories.map((cat) => (
          <div key={cat.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {cat.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono shrink-0">
                <span className="text-[11px] text-zinc-400 font-sans">{cat.percentage}%</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {formatBRL(cat.totalCentavos)}
                </span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, cat.percentage)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
