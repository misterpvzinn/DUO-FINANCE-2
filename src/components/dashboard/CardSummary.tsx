import React from 'react';
import { CreditCard, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { CardDashboardSummary } from '../../types/dashboard';
import { formatBRL } from '../../utils/money';

interface CardSummaryProps {
  cards: CardDashboardSummary[];
  onNavigateToCards: () => void;
}

export function CardSummary({ cards, onNavigateToCards }: CardSummaryProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Cartões de Crédito
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Limites comprometidos e faturas abertas
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCards}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Gerenciar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const percent = card.percentualUtilizado;
          const barColor =
            percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div
              key={card.cardId}
              className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {card.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {card.bandeira || 'Crédito'} {card.ultimos4 ? `•••• ${card.ultimos4}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-sans">Disponível</span>
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {formatBRL(card.disponivelCentavos)}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Utilizado: {formatBRL(card.utilizadoCentavos)}</span>
                  <span>Limite: {formatBRL(card.limiteCentavos)}</span>
                </div>
              </div>

              {/* Próxima fatura se houver */}
              {card.proximaFaturaMes && card.proximaFaturaValorCentavos !== undefined && card.proximaFaturaValorCentavos > 0 && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span>Fatura {card.proximaFaturaMes}</span>
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatBRL(card.proximaFaturaValorCentavos)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
