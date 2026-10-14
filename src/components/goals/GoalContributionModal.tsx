import React, { useState } from 'react';
import { PlusCircle, X, AlertCircle, Wallet } from 'lucide-react';
import { MetaFinanceira } from '../../types/goalsAndBudgets';
import { ContaPlano } from '../../types/finance';
import { formatBRL } from '../../utils/money';
import { Button } from '../ui/Button';

interface GoalContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: MetaFinanceira | null;
  accounts: ContaPlano[];
  onSave: (goalId: string, params: any) => Promise<void>;
}

export function GoalContributionModal({
  isOpen,
  onClose,
  goal,
  accounts,
  onSave,
}: GoalContributionModalProps) {
  const [valorStr, setValorStr] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [contaOrigemId, setContaOrigemId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valorFloat = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(valorFloat) || valorFloat <= 0) {
      setError('Informe um valor de aporte maior que zero.');
      return;
    }
    const valorCentavos = Math.round(valorFloat * 100);

    setLoading(true);
    try {
      await onSave(goal.id, {
        valorCentavos,
        data,
        contaOrigemId: contaOrigemId || undefined,
        observacao: observacao.trim() || undefined,
      });
      setValorStr('');
      setObservacao('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar aporte para a meta.');
    } finally {
      setLoading(false);
    }
  };

  const valorFaltante = Math.max(
    0,
    goal.valorObjetivoCentavos - goal.valorAtualCentavos
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Aporte na Meta
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                {goal.nome}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumo Atual */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1">
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Acumulado:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {formatBRL(goal.valorAtualCentavos)}
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Objetivo:</span>
              <span className="font-mono font-semibold">
                {formatBRL(goal.valorObjetivoCentavos)}
              </span>
            </div>
            <div className="flex justify-between text-indigo-600 dark:text-indigo-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
              <span>Faltam:</span>
              <span className="font-mono font-bold">
                {formatBRL(valorFaltante)}
              </span>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Valor do Aporte (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              placeholder="0,00"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
              className="w-full px-3 py-2 text-base rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Data do Aporte *
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Conta de Origem */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Debitar de uma Conta (opcional)
            </label>
            <select
              value={contaOrigemId}
              onChange={(e) => setContaOrigemId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Apenas registrar na meta (sem débito em conta)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nome} ({acc.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Aporte mensal de poupança"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs"
            >
              {loading ? 'Registrando...' : 'Confirmar Aporte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
