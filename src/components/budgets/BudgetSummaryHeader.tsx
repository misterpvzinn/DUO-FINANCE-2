import React from 'react';
import { PieChart, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { BudgetSummary } from '../../types/goalsAndBudgets';
import { formatBRL } from '../../utils/money';

interface BudgetSummaryHeaderProps {
  summary: BudgetSummary;
}

export function BudgetSummaryHeader({ summary }: BudgetSummaryHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Orçado */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <PieChart className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
            Total Orçado
          </span>
          <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {formatBRL(summary.totalOrcadoCentavos)}
          </span>
        </div>
      </div>

      {/* Total Utilizado */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <TrendingDown className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
            Total Utilizado
          </span>
          <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
            {formatBRL(summary.totalUtilizadoCentavos)}
          </span>
        </div>
      </div>

      {/* Total Disponível */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
            Disponível
          </span>
          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
            {formatBRL(summary.totalDisponivelCentavos)}
          </span>
        </div>
      </div>

      {/* Acima do Limite */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            summary.quantidadeAcimaLimite > 0
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
            Acima do Limite
          </span>
          <span
            className={`font-mono font-bold text-sm ${
              summary.quantidadeAcimaLimite > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {summary.quantidadeAcimaLimite} {summary.quantidadeAcimaLimite === 1 ? 'categoria' : 'categorias'}
          </span>
        </div>
      </div>
    </div>
  );
}
