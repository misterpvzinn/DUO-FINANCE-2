import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Heart,
  User,
} from 'lucide-react';
import { BudgetUsage, OrcamentoFinanceiro } from '../../types/goalsAndBudgets';
import { formatBRL } from '../../utils/money';

interface BudgetCardProps {
  usage: BudgetUsage;
  budget: OrcamentoFinanceiro;
  membro1Nome: string;
  membro2Nome: string;
  membro1Uid?: string;
  membro2Uid?: string;
  onEdit: (budget: OrcamentoFinanceiro) => void;
  onDisable: (budgetId: string) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({
  usage,
  budget,
  membro1Nome,
  membro2Nome,
  membro1Uid,
  membro2Uid,
  onEdit,
  onDisable,
  onDelete,
}: BudgetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getDonoLabel = () => {
    if (!budget.donoId) return 'Compartilhado';
    if (budget.donoId === membro1Uid) return membro1Nome;
    if (budget.donoId === membro2Uid) return membro2Nome;
    return 'Individual';
  };

  const isCompartilhado = !budget.donoId;

  // Status visual
  const statusConfig = {
    dentro: {
      label: 'Dentro do limite',
      badgeClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    proximo: {
      label: 'Próximo do limite',
      badgeClass:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
      barColor: 'bg-amber-500',
      icon: AlertTriangle,
    },
    acima: {
      label: 'Acima do orçamento',
      badgeClass:
        'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
      barColor: 'bg-rose-500',
      icon: AlertCircle,
    },
  }[usage.status];

  const StatusIcon = statusConfig.icon;
  const barWidth = Math.min(100, Math.max(0, usage.percentualUtilizado));

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors relative group">
      {/* Topo do Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              backgroundColor: `${usage.categoriaCor}1a`,
              color: usage.categoriaCor,
            }}
          >
            <PieIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {usage.nome}
            </h3>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span className="inline-flex items-center gap-1 font-medium">
                {isCompartilhado ? (
                  <Heart className="w-3 h-3 text-purple-500 fill-current" />
                ) : (
                  <User className="w-3 h-3 text-blue-500" />
                )}
                <span>{getDonoLabel()}</span>
              </span>
              <span>•</span>
              <span className="truncate">{usage.categoriaNome}</span>
            </div>
          </div>
        </div>

        {/* Menu de Opções */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Mais opções do orçamento"
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
                    onEdit(budget);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Editar orçamento
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDisable(budget.id);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Desativar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(budget.id);
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Valores e Barra */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <div>
            <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
              Gasto realizado
            </span>
            <span
              className={`text-lg font-bold ${
                usage.status === 'acima'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {formatBRL(usage.valorUtilizadoCentavos)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
              Limite mensal
            </span>
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {formatBRL(usage.valorLimiteCentavos)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${statusConfig.barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Status e Disponível */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${statusConfig.badgeClass}`}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{statusConfig.label}</span>
          </span>

          <span className="text-zinc-500 dark:text-zinc-400">
            {usage.status === 'acima' ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">
                Excedido em {formatBRL(usage.valorUtilizadoCentavos - usage.valorLimiteCentavos)}
              </span>
            ) : (
              <span>
                Disponível:{' '}
                <strong className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
                  {formatBRL(usage.valorDisponivelCentavos)}
                </strong>
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
