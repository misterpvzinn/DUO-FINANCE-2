import React, { useState, useEffect } from 'react';
import { PieChart, X, AlertCircle } from 'lucide-react';
import { OrcamentoFinanceiro } from '../../types/goalsAndBudgets';
import { CategoriaPlano } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { Button } from '../ui/Button';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (params: any) => Promise<void>;
  budgetToEdit?: any;
  categories?: CategoriaPlano[];
  defaultMonth?: string;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSave,
  budgetToEdit,
  categories = [],
  defaultMonth = new Date().toISOString().slice(0, 7),
}: BudgetModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [limiteStr, setLimiteStr] = useState('');
  const [mesReferencia, setMesReferencia] = useState(defaultMonth);
  const [donoId, setDonoId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      setNome(budgetToEdit.nome);
      setCategoriaId(budgetToEdit.categoriaId);
      setLimiteStr((budgetToEdit.valorLimiteCentavos / 100).toFixed(2));
      setMesReferencia(budgetToEdit.mesReferencia);
      setDonoId(budgetToEdit.donoId || '');
    } else {
      setNome('');
      setCategoriaId(categories[0]?.id || '');
      setLimiteStr('');
      setMesReferencia(defaultMonth);
      setDonoId('');
    }
    setError(null);
  }, [budgetToEdit, defaultMonth, categories, isOpen]);

  if (!isOpen) return null;

  const handleCategoriaChange = (catId: string) => {
    setCategoriaId(catId);
    if (!nome || !budgetToEdit) {
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        setNome(`Orçamento ${cat.nome}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome do orçamento é obrigatório.');
      return;
    }
    if (!categoriaId) {
      setError('Selecione uma categoria.');
      return;
    }

    const limiteFloat = parseFloat(limiteStr.replace(',', '.'));
    if (isNaN(limiteFloat) || limiteFloat <= 0) {
      setError('Informe um valor limite válido maior que zero.');
      return;
    }
    const valorLimiteCentavos = Math.round(limiteFloat * 100);

    if (!mesReferencia) {
      setError('O mês de referência é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      if (onSave) {
        await onSave({
          nome: nome.trim(),
          categoriaId,
          valorLimiteCentavos,
          mesReferencia,
          donoId: donoId || '',
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar orçamento financeiro.');
    } finally {
      setLoading(false);
    }
  };

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  // Filtra categorias apenas de despesa (não receita)
  const despesaCategories = categories.filter((c) => c.tipo !== 'receita' && c.ativa !== false);

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
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {budgetToEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Defina tetos de gastos para suas categorias
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

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Categoria *
            </label>
            <select
              required
              value={categoriaId}
              onChange={(e) => handleCategoriaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {despesaCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.tipo.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Orçamento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Orçamento Alimentação"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Limite */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Limite Mensal (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              value={limiteStr}
              onChange={(e) => setLimiteStr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mês e Responsável */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Mês *
              </label>
              <input
                type="month"
                required
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Responsável
              </label>
              <select
                value={donoId}
                onChange={(e) => setDonoId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Compartilhado</option>
                {membro1Uid && <option value={membro1Uid}>{membro1Nome}</option>}
                {membro2Uid && <option value={membro2Uid}>{membro2Nome}</option>}
              </select>
            </div>
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
              {loading ? 'Salvando...' : budgetToEdit ? 'Atualizar Orçamento' : 'Criar Orçamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
