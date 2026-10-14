import React from 'react';
import { Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { formatBRL } from '../../utils/money';

interface DashboardGoalsSummaryProps {
  onNavigateToGoals: () => void;
}

export function DashboardGoalsSummary({ onNavigateToGoals }: DashboardGoalsSummaryProps) {
  const { activeGoals, loading } = useGoals();

  if (loading || activeGoals.length === 0) return null;

  const topGoals = activeGoals.slice(0, 3);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Metas Financeiras
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Progresso dos objetivos do casal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToGoals}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {topGoals.map(({ goal, progress }) => (
          <div key={goal.id} className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {goal.nome}
              </span>
              <div className="flex items-center gap-2 font-mono shrink-0">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {formatBRL(goal.valorAtualCentavos)} / {formatBRL(goal.valorObjetivoCentavos)}
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {progress.percentual}%
                </span>
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress.percentualVisual}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
