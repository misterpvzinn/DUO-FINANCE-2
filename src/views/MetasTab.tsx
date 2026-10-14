import React, { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { MetaFinanceira } from '../types/goalsAndBudgets';
import { ContaPlano } from '../types/finance';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useGoals, GoalWithProgress } from '../hooks/useGoals';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalModal } from '../components/goals/GoalModal';
import { GoalContributionModal } from '../components/goals/GoalContributionModal';
import { Button } from '../components/ui/Button';

interface MetasTabProps {
  accounts: ContaPlano[];
}

export function MetasTab({ accounts }: MetasTabProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const {
    goalsWithProgress,
    createGoal,
    updateGoal,
    addContribution,
    completeGoal,
    cancelGoal,
    reactivateGoal,
  } = useGoals();

  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativas' | 'concluidas' | 'canceladas'>('ativas');
  const [donoFilter, setDonoFilter] = useState<string>('todos');

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<MetaFinanceira | null>(null);
  const [contributionGoal, setContributionGoal] = useState<MetaFinanceira | null>(null);

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  // Filtros aplicados
  const filteredGoals = goalsWithProgress.filter(({ goal }: GoalWithProgress) => {
    // 1. Filtro de status
    if (statusFilter === 'ativas' && goal.status !== 'ativa') return false;
    if (statusFilter === 'concluidas' && goal.status !== 'concluida') return false;
    if (statusFilter === 'canceladas' && goal.status !== 'cancelada') return false;

    // 2. Filtro de responsável
    if (donoFilter === 'compartilhada' && goal.donoId !== '') return false;
    if (donoFilter === membro1Uid && goal.donoId !== membro1Uid) return false;
    if (donoFilter === membro2Uid && goal.donoId !== membro2Uid) return false;

    return true;
  });

  // Ordenação: ativas primeiro, depois concluídas, depois canceladas
  const statusWeight: Record<string, number> = { ativa: 1, concluida: 2, cancelada: 3 };
  const sortedGoals = [...filteredGoals].sort((a: GoalWithProgress, b: GoalWithProgress) => {
    const wA = statusWeight[a.goal.status] || 99;
    const wB = statusWeight[b.goal.status] || 99;
    return wA - wB;
  });

  return (
    <div className="space-y-6">
      {/* Topo: Filtros e Botão Nova Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
            {(['ativas', 'todas', 'concluidas', 'canceladas'] as const).map((st) => (
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
                {st === 'ativas'
                  ? 'Ativas'
                  : st === 'todas'
                  ? 'Todas'
                  : st === 'concluidas'
                  ? 'Concluídas'
                  : 'Canceladas'}
              </button>
            ))}
          </div>

          {/* Responsável */}
          <select
            value={donoFilter}
            onChange={(e) => setDonoFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-hidden cursor-pointer"
          >
            <option value="todos">Todos os responsáveis</option>
            <option value="compartilhada">Compartilhadas</option>
            {membro1Uid && <option value={membro1Uid}>{membro1Nome}</option>}
            {membro2Uid && <option value={membro2Uid}>{membro2Nome}</option>}
          </select>
        </div>

        <Button
          onClick={() => {
            setGoalToEdit(null);
            setModalOpen(true);
          }}
          className="gap-1.5 text-xs shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova meta</span>
        </Button>
      </div>

      {/* Lista ou Estado Vazio */}
      {sortedGoals.length === 0 ? (
        <div className="py-16 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-[#14171c]/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Você ainda não possui metas.
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Defina objetivos financeiros para o casal e acompanhe a evolução dos seus sonhos.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setGoalToEdit(null);
              setModalOpen(true);
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar primeira meta</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGoals.map(({ goal, progress }: GoalWithProgress) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              membro1Nome={membro1Nome}
              membro2Nome={membro2Nome || 'Pessoa 2'}
              membro1Uid={membro1Uid}
              membro2Uid={membro2Uid}
              onAddContribution={(g: MetaFinanceira) => setContributionGoal(g)}
              onComplete={completeGoal}
              onCancel={cancelGoal}
              onReactivate={reactivateGoal}
              onEdit={(g: MetaFinanceira) => {
                setGoalToEdit(g);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <GoalModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setGoalToEdit(null);
        }}
        onSave={async (params: any) => {
          if (goalToEdit) {
            await updateGoal(goalToEdit.id, params);
          } else {
            await createGoal(params);
          }
        }}
        goalToEdit={goalToEdit}
        accounts={accounts}
      />

      <GoalContributionModal
        isOpen={!!contributionGoal}
        onClose={() => setContributionGoal(null)}
        goal={contributionGoal}
        accounts={accounts}
        onSave={async (goalId: string, params: any) => {
          await addContribution(goalId, params);
        }}
      />
    </div>
  );
}
