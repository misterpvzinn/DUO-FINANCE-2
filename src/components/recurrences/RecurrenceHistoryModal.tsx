import React from 'react';
import { History, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { RecorrenciaFinanceira } from '../../types/recurrence';
import { useRecurrenceExecutions } from '../../hooks/useRecurrenceExecutions';
import { formatDataCurta } from '../../utils/money';

interface RecurrenceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurrence: RecorrenciaFinanceira | null;
}

export function RecurrenceHistoryModal({
  isOpen,
  onClose,
  recurrence,
}: RecurrenceHistoryModalProps) {
  const { executions, loading } = useRecurrenceExecutions(recurrence?.id);

  if (!isOpen || !recurrence) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Histórico de Execuções
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]">
                {recurrence.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Carregando histórico...
            </div>
          ) : executions.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Clock className="w-6 h-6 text-zinc-400 mx-auto" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Nenhum lançamento foi gerado por esta recorrência ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
              {executions.map((exec) => (
                <div
                  key={exec.id}
                  className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                        Ocorrência de {formatDataCurta(new Date(`${exec.dataPrevista}T12:00:00`))}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Executada em {formatDataCurta(new Date(`${exec.dataExecucao}T12:00:00`))}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Gerada
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
