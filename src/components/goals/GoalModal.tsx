import React, { useState, useEffect } from 'react';
import { Target, X, AlertCircle } from 'lucide-react';
import { MetaFinanceira } from '../../types/goalsAndBudgets';
import { ContaPlano } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { Button } from '../ui/Button';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (params: any) => Promise<void>;
  goalToEdit?: any;
  accounts?: ContaPlano[];
}

export function GoalModal({
  isOpen,
  onClose,
  onSave,
  goalToEdit,
  accounts = [],
}: GoalModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorObjetivoStr, setValorObjetivoStr] = useState('');
  const [valorInicialStr, setValorInicialStr] = useState('');
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dataAlvo, setDataAlvo] = useState('');
  const [donoId, setDonoId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setNome(goalToEdit.nome);
      setDescricao(goalToEdit.descricao || '');
      setValorObjetivoStr((goalToEdit.valorObjetivoCentavos / 100).toFixed(2));
      setValorInicialStr((goalToEdit.valorAtualCentavos / 100).toFixed(2));
      setDataInicio(goalToEdit.dataInicio);
      setDataAlvo(goalToEdit.dataAlvo || '');
      setDonoId(goalToEdit.donoId || '');
      setContaDestinoId(goalToEdit.contaDestinoId || '');
    } else {
      setNome('');
      setDescricao('');
      setValorObjetivoStr('');
      setValorInicialStr('');
      setDataInicio(new Date().toISOString().split('T')[0]);
      setDataAlvo('');
      setDonoId('');
      setContaDestinoId('');
    }
    setError(null);
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da meta é obrigatório.');
      return;
    }

    const valorObjetivoFloat = parseFloat(valorObjetivoStr.replace(',', '.'));
    if (isNaN(valorObjetivoFloat) || valorObjetivoFloat <= 0) {
      setError('Informe um valor objetivo válido maior que zero.');
      return;
    }
    const valorObjetivoCentavos = Math.round(valorObjetivoFloat * 100);

    let valorInicialCentavos = 0;
    if (valorInicialStr) {
      const valorInicialFloat = parseFloat(valorInicialStr.replace(',', '.'));
      if (isNaN(valorInicialFloat) || valorInicialFloat < 0) {
        setError('O valor inicial não pode ser negativo.');
        return;
      }
      valorInicialCentavos = Math.round(valorInicialFloat * 100);
    }

    if (dataAlvo && dataAlvo < dataInicio) {
      setError('A data alvo não pode ser anterior à data de início.');
      return;
    }

    setLoading(true);
    try {
      if (onSave) {
        await onSave({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          valorObjetivoCentavos,
          valorInicialCentavos,
          dataInicio,
          dataAlvo: dataAlvo || undefined,
          donoId: donoId || '',
          contaDestinoId: contaDestinoId || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar meta financeira.');
    } finally {
      setLoading(false);
    }
  };

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

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
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {goalToEdit ? 'Editar Meta' : 'Nova Meta Financeira'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Planeje e acompanhe seus objetivos a dois
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

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome da Meta *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reserva de emergência, Viagem, Carro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: 6 meses de custos fixos guardados"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Valores: Objetivo e Inicial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Valor Objetivo (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={valorObjetivoStr}
                onChange={(e) => setValorObjetivoStr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Valor Já Acumulado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valorInicialStr}
                onChange={(e) => setValorInicialStr(e.target.value)}
                disabled={!!goalToEdit}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono disabled:opacity-60 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Datas: Início e Alvo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Data Alvo (opcional)
              </label>
              <input
                type="date"
                value={dataAlvo}
                onChange={(e) => setDataAlvo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Responsável e Conta Relacionada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Responsável
              </label>
              <select
                value={donoId}
                onChange={(e) => setDonoId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Compartilhada (Casal)</option>
                {membro1Uid && <option value={membro1Uid}>{membro1Nome}</option>}
                {membro2Uid && <option value={membro2Uid}>{membro2Nome}</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Conta Guardada (opcional)
              </label>
              <select
                value={contaDestinoId}
                onChange={(e) => setContaDestinoId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Nenhuma / Não vinculada</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nome} ({acc.tipo})
                  </option>
                ))}
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
              {loading ? 'Salvando...' : goalToEdit ? 'Atualizar Meta' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
