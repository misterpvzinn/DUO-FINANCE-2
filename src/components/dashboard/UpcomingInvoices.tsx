import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { UpcomingInvoiceSummary } from '../../types/dashboard';
import { formatBRL, formatDataCompleta } from '../../utils/money';

interface UpcomingInvoicesProps {
  invoices: UpcomingInvoiceSummary[];
  onNavigateToCards: () => void;
}

export function UpcomingInvoices({ invoices, onNavigateToCards }: UpcomingInvoicesProps) {
  if (invoices.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string, isVencida: boolean) => {
    if (isVencida) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
          <AlertCircle className="w-3 h-3" />
          <span>Vencida</span>
        </span>
      );
    }
    if (status === 'fechada') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
          <Clock className="w-3 h-3" />
          <span>Fechada</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400">
        <Clock className="w-3 h-3" />
        <span>Aberta</span>
      </span>
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Próximas Faturas
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Vencimentos e compromissos de cartão de crédito
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCards}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors"
        >
          Ver cartões
        </button>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
        {invoices.map((inv) => (
          <div
            key={inv.faturaId}
            className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 text-xs"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {inv.cartaoNome}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-500">
                  {inv.mesReferencia}
                </span>
                {getStatusBadge(inv.status, inv.isVencida)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span>
                  Vence em {formatDataCompleta(new Date(inv.vencimento + 'T12:00:00'))}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`font-mono font-bold text-xs ${
                  inv.isVencida ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {formatBRL(inv.valorCentavos)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
