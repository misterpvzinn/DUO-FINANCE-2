import React, { useState, useEffect } from 'react';
import { Repeat, X, AlertCircle } from 'lucide-react';
import {
  RecorrenciaFinanceira,
  RecurrenceType,
  RecurrenceFrequency,
} from '../../types/recurrence';
import { ContaPlano, CategoriaPlano } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { Button } from '../ui/Button';

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: any) => Promise<void>;
  recurrenceToEdit?: RecorrenciaFinanceira | null;
  accounts: ContaPlano[];
  categories: CategoriaPlano[];
}

export function RecurrenceModal({
  isOpen,
  onClose,
  onSave,
  recurrenceToEdit,
  accounts,
  categories,
}: RecurrenceModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<RecurrenceType>('despesa');
  const [valorStr, setValorStr] = useState('');
  const [contaId, setContaId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [donoId, setDonoId] = useState('');
  const [frequencia, setFrequencia] = useState<RecurrenceFrequency>('mensal');
  const [diaExecucao, setDiaExecucao] = useState<number>(5);
  const [diaSemana, setDiaSemana] = useState<number>(1); // Segunda-feira
  const [mesExecucao, setMesExecucao] = useState<number>(1); // Janeiro
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recurrenceToEdit) {
      setNome(recurrenceToEdit.nome);
      setTipo(recurrenceToEdit.tipo);
      setValorStr((recurrenceToEdit.valorCentavos / 100).toFixed(2));
      setContaId(recurrenceToEdit.contaId);
      setContaDestinoId(recurrenceToEdit.contaDestinoId || '');
      setCategoriaId(recurrenceToEdit.categoriaId || '');
      setDonoId(recurrenceToEdit.donoId || '');
      setFrequencia(recurrenceToEdit.frequencia);
      setDiaExecucao(recurrenceToEdit.diaExecucao || 5);
      setDiaSemana(recurrenceToEdit.diaSemana !== undefined ? recurrenceToEdit.diaSemana : 1);
      setMesExecucao(recurrenceToEdit.mesExecucao || 1);
      setDataInicio(recurrenceToEdit.dataInicio);
      setDataFim(recurrenceToEdit.dataFim || '');
      setObservacao(recurrenceToEdit.observacao || '');
    } else {
      setNome('');
      setTipo('despesa');
      setValorStr('');
      setContaId(accounts[0]?.id || '');
      setContaDestinoId('');
      setCategoriaId('');
      setDonoId('');
      setFrequencia('mensal');
      setDiaExecucao(5);
      setDiaSemana(1);
      setMesExecucao(1);
      setDataInicio(new Date().toISOString().split('T')[0]);
      setDataFim('');
      setObservacao('');
    }
    setError(null);
  }, [recurrenceToEdit, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da recorrência é obrigatório.');
      return;
    }

    const valorFloat = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(valorFloat) || valorFloat <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    const valorCentavos = Math.round(valorFloat * 100);

    if (!contaId) {
      setError('Selecione uma conta.');
      return;
    }

    if (tipo === 'transferencia') {
      if (!contaDestinoId) {
        setError('Selecione a conta de destino para a transferência.');
        return;
      }
      if (contaId === contaDestinoId) {
        setError('A conta de origem e destino devem ser diferentes.');
        return;
      }
    } else {
      if (!categoriaId) {
        setError('Selecione uma categoria.');
        return;
      }
    }

    if (dataFim && dataFim < dataInicio) {
      setError('A data final não pode ser anterior à data de início.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        nome: nome.trim(),
        tipo,
        valorCentavos,
        contaId,
        contaDestinoId: tipo === 'transferencia' ? contaDestinoId : undefined,
        categoriaId: tipo !== 'transferencia' ? categoriaId : undefined,
        donoId: donoId || '',
        frequencia,
        diaExecucao: frequencia === 'mensal' || frequencia === 'anual' ? diaExecucao : undefined,
        diaSemana: frequencia === 'semanal' ? diaSemana : undefined,
        mesExecucao: frequencia === 'anual' ? mesExecucao : undefined,
        dataInicio,
        dataFim: dataFim || undefined,
        observacao: observacao.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar recorrência financeira.');
    } finally {
      setLoading(false);
    }
  };

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  const filteredCategories = categories.filter((c) => {
    if (tipo === 'receita') return c.tipo === 'receita';
    if (tipo === 'despesa') return c.tipo !== 'receita';
    return false;
  });

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
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {recurrenceToEdit ? 'Editar Recorrência' : 'Nova Recorrência'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Lançamentos automáticos periódicos
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de Recorrência (Regra 26) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tipo de Operação *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['despesa', 'receita', 'transferencia'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    tipo === t
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {t === 'despesa' ? 'Despesa' : t === 'receita' ? 'Receita' : 'Transferência'}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome da Recorrência *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Salário, Aluguel, Academia, Aporte"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Contas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {tipo === 'transferencia' ? 'Conta de Origem *' : 'Conta *'}
              </label>
              <select
                required
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="" disabled>Selecione a conta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nome}
                  </option>
                ))}
              </select>
            </div>

            {tipo === 'transferencia' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Conta de Destino *
                </label>
                <select
                  required
                  value={contaDestinoId}
                  onChange={(e) => setContaDestinoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>Selecione o destino</option>
                  {accounts
                    .filter((acc) => acc.id !== contaId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.nome}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Categoria *
                </label>
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>Selecione a categoria</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Responsável e Frequência */}
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
                <option value="">Compartilhado (Casal)</option>
                {membro1Uid && <option value={membro1Uid}>{membro1Nome}</option>}
                {membro2Uid && <option value={membro2Uid}>{membro2Nome}</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Frequência *
              </label>
              <select
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          {/* Campos Específicos de Frequência */}
          {frequencia === 'mensal' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Dia do Mês de Execução (1 a 31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={diaExecucao}
                onChange={(e) => setDiaExecucao(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {frequencia === 'semanal' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Dia da Semana *
              </label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={0}>Domingo</option>
                <option value={1}>Segunda-feira</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
                <option value={6}>Sábado</option>
              </select>
            </div>
          )}

          {frequencia === 'anual' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Dia do Mês (1 a 31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={diaExecucao}
                  onChange={(e) => setDiaExecucao(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mês de Execução *
                </label>
                <select
                  value={mesExecucao}
                  onChange={(e) => setMesExecucao(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
                </select>
              </div>
            </div>
          )}

          {/* Datas de Início e Fim */}
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
                Data Final (opcional)
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Cobrado todo dia 10 na conta jurídica"
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
              {loading ? 'Salvando...' : recurrenceToEdit ? 'Atualizar' : 'Criar Recorrência'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
