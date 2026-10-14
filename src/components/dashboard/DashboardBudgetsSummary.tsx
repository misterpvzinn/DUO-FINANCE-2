import React from 'react';
import { PieChart, ArrowRight, AlertTriangle } from 'lucide-react';
import { useBudgets } from '../../hooks/useBudgets';
import { formatBRL } from '../../utils/money';

interface DashboardBudgetsSummaryProps {
  onNavigateToBudgets: () => void;
}

export function DashboardBudgetsSummary({
  onNavigateToBudgets,
}: DashboardBudgetsSummaryProps) {
  const { budgetUsages, loading } = useBudgets();

  if (loading || budgetUsages.length === 0) return null;

  const topBudgets = budgetUsages.slice(0, 3);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Orçamentos Mensais
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Limites de gastos por categoria
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToBudgets}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {topBudgets.map((usage) => {
          const barColor =
            usage.status === 'acima'
              ? 'bg-rose-500'
              : usage.status === 'proximo'
              ? 'bg-amber-500'
              : 'bg-emerald-500';

          return (
            <div key={usage.orcamentoId} className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {usage.nome}
                </span>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatBRL(usage.valorUtilizadoCentavos)} / {formatBRL(usage.valorLimiteCentavos)}
                  </span>
                  <span
                    className={`font-bold ${
                      usage.status === 'acima'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {usage.percentualUtilizado}%
                  </span>
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.min(100, usage.percentualUtilizado)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
