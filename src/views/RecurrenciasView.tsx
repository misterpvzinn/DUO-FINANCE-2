import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  RecorrenciaFinanceira,
  RecurrenceType,
  RecurrenceFrequency,
} from '../types/recurrence';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useRecurrences } from '../hooks/useRecurrences';
import { RecurrenceCard } from '../components/recurrences/RecurrenceCard';
import { RecurrenceModal } from '../components/recurrences/RecurrenceModal';
import { RecurrenceHistoryModal } from '../components/recurrences/RecurrenceHistoryModal';
import { Button } from '../components/ui/Button';

export function RecurrenciasView() {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const {
    recurrences,
    accounts,
    categories,
    accountsMap,
    categoriesMap,
    loading,
    createRecurrence,
    updateRecurrence,
    pauseRecurrence,
    resumeRecurrence,
    deleteRecurrence,
    executeNow,
    processDue,
  } = useRecurrences();

  // Filtros (Regra 25)
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativas' | 'inativas'>('ativas');
  const [tipoFilter, setTipoFilter] = useState<'todos' | RecurrenceType>('todos');
  const [frequenciaFilter, setFrequenciaFilter] = useState<'todas' | RecurrenceFrequency>('todas');
  const [donoFilter, setDonoFilter] = useState<string>('todos');

  // Modais e Feedback
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [recurrenceToEdit, setRecurrenceToEdit] = useState<RecorrenciaFinanceira | null>(null);
  const [selectedForHistory, setSelectedForHistory] = useState<RecorrenciaFinanceira | null>(null);
  const [processingDue, setProcessingDue] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  const filteredRecurrences = recurrences.filter((rec) => {
    // 1. Status
    if (statusFilter === 'ativas' && !rec.ativa) return false;
    if (statusFilter === 'inativas' && rec.ativa) return false;

    // 2. Tipo
    if (tipoFilter !== 'todos' && rec.tipo !== tipoFilter) return false;

    // 3. Frequência
    if (frequenciaFilter !== 'todas' && rec.frequencia !== frequenciaFilter) return false;

    // 4. Responsável
    if (donoFilter === 'compartilhada' && rec.donoId !== '') return false;
    if (donoFilter === membro1Uid && rec.donoId !== membro1Uid) return false;
    if (donoFilter === membro2Uid && rec.donoId !== membro2Uid) return false;

    return true;
  });

  const handleProcessDue = async () => {
    setProcessingDue(true);
    setFeedbackMsg(null);
    try {
      const res = await processDue();
      if (res.processedCount > 0) {
        setFeedbackMsg({
          type: 'success',
          text: `${res.processedCount} lançamento(s) pendente(s) processado(s) com sucesso.`,
        });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: 'Todas as recorrências estão em dia. Nenhuma ocorrência pendente.',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Erro ao processar recorrências pendentes.',
      });
    } finally {
      setProcessingDue(false);
    }
  };

  const handleExecuteNow = async (rec: RecorrenciaFinanceira) => {
    if (
      !window.confirm(
        `Confirma a execução imediata da recorrência "${rec.nome}"? Um lançamento financeiro será gerado agora.`
      )
    ) {
      return;
    }

    try {
      await executeNow(rec.id);
      setFeedbackMsg({
        type: 'success',
        text: `Lançamento gerado com sucesso para a recorrência "${rec.nome}".`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Erro ao executar recorrência.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir esta configuração de recorrência? Os lançamentos já gerados não serão apagados.'
      )
    ) {
      return;
    }

    try {
      await deleteRecurrence(id);
      setFeedbackMsg({
        type: 'success',
        text: 'Recorrência removida com sucesso.',
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Erro ao excluir recorrência.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-indigo-500" />
            <span>Recorrências</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automatize o lançamento de receitas, despesas e transferências periódicas
          </p>
        </div>

        {/* Ações principais */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleProcessDue}
            disabled={processingDue}
            className="text-xs gap-1.5"
            title="Verifica e gera lançamentos pendentes até a data de hoje"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processingDue ? 'animate-spin' : ''}`} />
            <span>{processingDue ? 'Verificando...' : 'Processar pendentes'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setRecurrenceToEdit(null);
              setModalOpen(true);
            }}
            className="text-xs gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova recorrência</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] font-semibold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros (Regra 25) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
          {(['ativas', 'todas', 'inativas'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              {st === 'ativas' ? 'Ativas' : st === 'todas' ? 'Todas' : 'Pausadas'}
            </button>
          ))}
        </div>

        {/* Tipo */}
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as any)}
          className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
        >
          <option value="todos">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
          <option value="transferencia">Transferências</option>
        </select>

        {/* Frequência */}
        <select
          value={frequenciaFilter}
          onChange={(e) => setFrequenciaFilter(e.target.value as any)}
          className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
        >
          <option value="todas">Todas as frequências</option>
          <option value="mensal">Mensal</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="anual">Anual</option>
        </select>

        {/* Responsável */}
        <select
          value={donoFilter}
          onChange={(e) => setDonoFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
        >
          <option value="todos">Todos os responsáveis</option>
          <option value="compartilhada">Compartilhadas</option>
          {membro1Uid && <option value={membro1Uid}>{membro1Nome}</option>}
          {membro2Uid && <option value={membro2Uid}>{membro2Nome || 'Pessoa 2'}</option>}
        </select>
      </div>

      {/* Grid de Recorrências ou Estado Vazio */}
      {filteredRecurrences.length === 0 ? (
        <div className="py-16 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-[#14171c]/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Repeat className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Você ainda não possui recorrências.
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Cadastre contas recorrentes como salário, aluguel ou aportes mensais para gerar lançamentos automáticos.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setRecurrenceToEdit(null);
              setModalOpen(true);
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar recorrência</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecurrences.map((rec) => (
            <RecurrenceCard
              key={rec.id}
              recurrence={rec}
              contaOrigem={accountsMap.get(rec.contaId)}
              contaDestino={rec.contaDestinoId ? accountsMap.get(rec.contaDestinoId) : undefined}
              categoria={rec.categoriaId ? categoriesMap.get(rec.categoriaId) : undefined}
              membro1Nome={membro1Nome}
              membro2Nome={membro2Nome || 'Pessoa 2'}
              membro1Uid={membro1Uid}
              membro2Uid={membro2Uid}
              onEdit={(r) => {
                setRecurrenceToEdit(r);
                setModalOpen(true);
              }}
              onPause={pauseRecurrence}
              onResume={resumeRecurrence}
              onExecuteNow={handleExecuteNow}
              onViewHistory={(r) => {
                setSelectedForHistory(r);
                setHistoryModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <RecurrenceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setRecurrenceToEdit(null);
        }}
        onSave={async (params) => {
          if (recurrenceToEdit) {
            await updateRecurrence(recurrenceToEdit.id, params);
          } else {
            await createRecurrence(params);
          }
        }}
        recurrenceToEdit={recurrenceToEdit}
        accounts={accounts}
        categories={categories}
      />

      {/* Modal de Histórico */}
      <RecurrenceHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedForHistory(null);
        }}
        recurrence={selectedForHistory}
      />
    </div>
  );
}
