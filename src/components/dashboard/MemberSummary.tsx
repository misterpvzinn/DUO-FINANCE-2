import React from 'react';
import { User, Heart, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { MemberFinancialSummary } from '../../types/dashboard';
import { formatBRL } from '../../utils/money';

interface MemberSummaryProps {
  members: MemberFinancialSummary[];
}

export function MemberSummary({ members }: MemberSummaryProps) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Movimentação por Pessoa
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Detalhamento entre despesas compartilhadas e individuais
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {members.map((m) => {
          const isCompartilhado = !m.uid;
          return (
            <div
              key={m.uid || 'shared'}
              className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isCompartilhado
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {isCompartilhado ? (
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {m.name}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] font-sans flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span>Receitas</span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatBRL(m.incomeCentavos)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] font-sans flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-rose-500" />
                    <span>Despesas</span>
                  </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    -{formatBRL(m.expenseCentavos)}
                  </span>
                </div>

                {m.investmentCentavos > 0 && (
                  <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                    <span className="text-[11px] font-sans flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-sky-500" />
                      <span>Investido</span>
                    </span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {formatBRL(m.investmentCentavos)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] font-sans font-semibold text-zinc-700 dark:text-zinc-300">
                    Saldo
                  </span>
                  <span
                    className={`font-bold ${
                      m.netCentavos >= 0
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatBRL(m.netCentavos)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
