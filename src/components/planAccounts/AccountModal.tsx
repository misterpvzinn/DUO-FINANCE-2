import React, { useState, useEffect } from 'react';
import { Wallet, X, AlertCircle } from 'lucide-react';
import { ContaPlano } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { Button } from '../ui/Button';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: Omit<ContaPlano, 'id'>) => Promise<void>;
  accountToEdit?: ContaPlano | null;
}

const PRESET_COLORS = [
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo (Nubank-like)
  '#f97316', // Laranja (Inter-like)
  '#10b981', // Verde
  '#f59e0b', // Âmbar
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#64748b', // Slate
];

export function AccountModal({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
}: AccountModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<ContaPlano['tipo']>('corrente');
  const [saldoInicialStr, setSaldoInicialStr] = useState('0,00');
  const [donoId, setDonoId] = useState('');
  const [cor, setCor] = useState(PRESET_COLORS[0]);
  const [ativa, setAtiva] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setNome(accountToEdit.nome);
      setTipo(accountToEdit.tipo);
      setSaldoInicialStr(((accountToEdit.saldoInicialCentavos || 0) / 100).toFixed(2));
      setDonoId(accountToEdit.donoId || '');
      setCor(accountToEdit.cor || PRESET_COLORS[0]);
      setAtiva(accountToEdit.ativa !== false);
    } else {
      setNome('');
      setTipo('corrente');
      setSaldoInicialStr('0,00');
      setDonoId('');
      setCor(PRESET_COLORS[0]);
      setAtiva(true);
    }
    setError(null);
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da conta é obrigatório.');
      return;
    }

    const saldoFloat = parseFloat(saldoInicialStr.replace(',', '.'));
    if (isNaN(saldoFloat) || saldoFloat < 0) {
      setError('O saldo inicial não pode ser negativo.');
      return;
    }
    const saldoInicialCentavos = Math.round(saldoFloat * 100);

    setLoading(true);
    try {
      await onSave({
        nome: nome.trim(),
        tipo,
        saldoInicialCentavos,
        donoId: donoId || '',
        cor,
        ativa,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar conta.');
    } finally {
      setLoading(false);
    }
  };

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs"
              style={{ backgroundColor: cor }}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {accountToEdit ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Conta bancária, carteira ou investimento
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

        {/* Formulário */}
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
              Nome da Conta / Instituição *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank, Itaú, Carteira, Reserva Inter"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tipo e Saldo Inicial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Tipo de Conta *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as ContaPlano['tipo'])}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="carteira">Carteira / Dinheiro</option>
                <option value="investimento">Investimento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Saldo Inicial (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={saldoInicialStr}
                onChange={(e) => setSaldoInicialStr(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Titularidade
            </label>
            <select
              value={donoId}
              onChange={(e) => setDonoId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Compartilhada (Casal)</option>
              {membro1Uid && <option value={membro1Uid}>{membro1Nome}</option>}
              {membro2Uid && <option value={membro2Uid}>{membro2Nome || 'Pessoa 2'}</option>}
            </select>
          </div>

          {/* Paleta de Cores */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    cor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Status Ativa */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                Conta Ativa
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Contas inativas não aparecem para novos lançamentos
              </span>
            </div>
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
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
              {loading ? 'Salvando...' : accountToEdit ? 'Atualizar Conta' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
