import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ArrowRight,
  User,
  Heart,
} from 'lucide-react';
import { LancamentoFinanceiro, CategoriaPlano, ContaPlano } from '../../types/finance';
import { formatBRL, formatDataCurta } from '../../utils/money';

interface RecentTransactionsProps {
  transactions: LancamentoFinanceiro[];
  categoriesMap: Map<string, CategoriaPlano>;
  accountsMap: Map<string, ContaPlano>;
  onNavigateToTransactions: () => void;
  regime: string;
}

export function RecentTransactions({
  transactions,
  categoriesMap,
  accountsMap,
  onNavigateToTransactions,
  regime,
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Últimos Lançamentos
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Movimentações mais recentes
          </p>
        </div>
        <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          Nenhum lançamento recente.
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Últimos Lançamentos
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Movimentações mais recentes
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToTransactions}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
        {transactions.map((tx) => {
          const dateTimestamp = regime === 'competencia' ? tx.dataCompetencia : tx.dataCaixa;
          const txDate = dateTimestamp ? dateTimestamp.toDate() : new Date();
          const categoria = tx.categoriaId ? categoriesMap.get(tx.categoriaId) : null;
          const contaOrigem = tx.contaId ? accountsMap.get(tx.contaId) : null;

          const isReceita = tx.tipo === 'receita';
          const isDespesa = tx.tipo === 'despesa';

          return (
            <div
              key={tx.id}
              className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isReceita
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : isDespesa
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {tx.descricao}
                    </span>
                    {!tx.donoId ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
                        Compartilhado
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 truncate">
                    <span>{formatDataCurta(txDate)}</span>
                    {categoria && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-600 dark:text-zinc-400">{categoria.nome}</span>
                      </>
                    )}
                    {contaOrigem && (
                      <>
                        <span>•</span>
                        <span>{contaOrigem.nome}</span>
                      </>
                    )}
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
                      : 'text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {isReceita ? '+' : isDespesa ? '-' : ''}
                  {formatBRL(tx.valorCentavos)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
