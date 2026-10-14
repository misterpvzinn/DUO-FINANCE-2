import React from 'react';
import { Repeat, ArrowRight, TrendingUp, TrendingDown, ArrowRightLeft, Clock } from 'lucide-react';
import { useRecurrences } from '../../hooks/useRecurrences';
import { formatBRL, formatDataCurta } from '../../utils/money';

interface DashboardRecurrencesSummaryProps {
  onNavigateToRecurrences: () => void;
}

export function DashboardRecurrencesSummary({
  onNavigateToRecurrences,
}: DashboardRecurrencesSummaryProps) {
  const { upcomingRecurrences, loading } = useRecurrences();

  if (loading || upcomingRecurrences.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Próximas Recorrências
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Lançamentos previstos programados
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToRecurrences}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
        {upcomingRecurrences.map((rec) => {
          const isReceita = rec.tipo === 'receita';
          const isDespesa = rec.tipo === 'despesa';

          return (
            <div
              key={rec.id}
              className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isReceita
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : isDespesa
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {isReceita ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : isDespesa ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                    {rec.nome}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>Previsto: {formatDataCurta(new Date(`${rec.proximaExecucao}T12:00:00`))}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`font-mono font-bold text-xs ${
                    isReceita
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isDespesa
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {isReceita ? '+' : isDespesa ? '-' : ''}
                  {formatBRL(rec.valorCentavos)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
