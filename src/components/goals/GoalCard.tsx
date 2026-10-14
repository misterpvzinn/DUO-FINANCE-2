import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Calendar,
  Clock,
  Heart,
  User,
  RotateCcw,
} from 'lucide-react';
import { MetaFinanceira, GoalProgress } from '../../types/goalsAndBudgets';
import { formatBRL, formatDataCurta } from '../../utils/money';
import { Button } from '../ui/Button';

interface GoalCardProps {
  goal: MetaFinanceira;
  progress: GoalProgress;
  membro1Nome: string;
  membro2Nome: string;
  membro1Uid?: string;
  membro2Uid?: string;
  onAddContribution: (goal: MetaFinanceira) => void;
  onComplete: (goalId: string) => void;
  onCancel: (goalId: string) => void;
  onReactivate: (goalId: string) => void;
  onEdit: (goal: MetaFinanceira) => void;
}

export function GoalCard({
  goal,
  progress,
  membro1Nome,
  membro2Nome,
  membro1Uid,
  membro2Uid,
  onAddContribution,
  onComplete,
  onCancel,
  onReactivate,
  onEdit,
}: GoalCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getDonoLabel = () => {
    if (!goal.donoId) return 'Compartilhada';
    if (goal.donoId === membro1Uid) return membro1Nome;
    if (goal.donoId === membro2Uid) return membro2Nome;
    return 'Individual';
  };

  const isCompartilhada = !goal.donoId;
  const isConcluida = goal.status === 'concluida';
  const isCancelada = goal.status === 'cancelada';
  const isAtiva = goal.status === 'ativa';

  // Cores da barra de progresso
  const progressBarColor = isConcluida
    ? 'bg-emerald-500'
    : isCancelada
    ? 'bg-zinc-400 dark:bg-zinc-600'
    : progress.percentual >= 80
    ? 'bg-blue-600'
    : 'bg-indigo-600';

  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#14171c] border transition-all shadow-xs flex flex-col justify-between gap-4 relative group ${
        isConcluida
          ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
          : isCancelada
          ? 'border-zinc-200 dark:border-zinc-800 opacity-75'
          : 'border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Topo do Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isConcluida
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : isCancelada
                ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
            }`}
          >
            {isConcluida ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isCancelada ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <Target className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {goal.nome}
              </h3>
              {isConcluida && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Concluída
                </span>
              )}
              {isCancelada && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Cancelada
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span className="inline-flex items-center gap-1 font-medium">
                {isCompartilhada ? (
                  <Heart className="w-3 h-3 text-purple-500 fill-current" />
                ) : (
                  <User className="w-3 h-3 text-blue-500" />
                )}
                <span>{getDonoLabel()}</span>
              </span>
              {goal.dataAlvo && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span>Até {formatDataCurta(new Date(`${goal.dataAlvo}T12:00:00`))}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu de Opções */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Mais opções da meta"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-zinc-700 shadow-xl py-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(goal);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Editar meta
                </button>

                {isAtiva && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onComplete(goal.id);
                      }}
                      className="w-full text-left px-3 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                      Concluir meta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onCancel(goal.id);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      Cancelar meta
                    </button>
                  </>
                )}

                {(isConcluida || isCancelada) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReactivate(goal.id);
                    }}
                    className="w-full text-left px-3 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                  >
                    Reativar meta
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Valores e Barra de Progresso */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <div>
            <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
              Acumulado
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatBRL(goal.valorAtualCentavos)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
              Objetivo
            </span>
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {formatBRL(goal.valorObjetivoCentavos)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${progress.percentualVisual}%` }}
          />
        </div>

        {/* Informações de status e dias restantes */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {progress.percentual}%
          </span>

          {progress.isAtingida ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Meta atingida! 🎉
            </span>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">
              Faltam{' '}
              <strong className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
                {formatBRL(progress.valorRestanteCentavos)}
              </strong>
            </span>
          )}
        </div>

        {/* Alerta neutro de prazo se preenchido */}
        {goal.dataAlvo && progress.diasRestantes !== undefined && !isConcluida && (
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Clock className="w-3 h-3" />
            {progress.prazoUltrapassado ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Prazo alvo ultrapassado em {Math.abs(progress.diasRestantes)} dias
              </span>
            ) : (
              <span>
                {progress.diasRestantes === 0
                  ? 'Vence hoje'
                  : `Restam ${progress.diasRestantes} dias`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ação rápida de Aporte */}
      {isAtiva && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddContribution(goal)}
            className="w-full gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Adicionar valor</span>
          </Button>
        </div>
      )}
    </div>
  );
}
