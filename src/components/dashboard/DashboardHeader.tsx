import React from 'react';
import { Calendar, Filter, Sparkles, SlidersHorizontal } from 'lucide-react';
import { DashboardPeriodType } from '../../types/dashboard';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { formatMesAno } from '../../utils/money';

interface DashboardHeaderProps {
  periodType: DashboardPeriodType;
  onPeriodChange: (period: DashboardPeriodType) => void;
  periodLabel: string;
}

const PERIOD_OPTIONS: { id: DashboardPeriodType; label: string }[] = [
  { id: 'mes_atual', label: 'Mês Atual' },
  { id: 'mes_anterior', label: 'Mês Anterior' },
  { id: 'ultimos_3_meses', label: '3 Meses' },
  { id: 'ultimos_6_meses', label: '6 Meses' },
  { id: 'ultimos_12_meses', label: '12 Meses' },
];

export function DashboardHeader({
  periodType,
  onPeriodChange,
  periodLabel,
}: DashboardHeaderProps) {
  const { plano, mesSelecionado, regime, filtroPessoa, membro1Nome, membro2Nome } =
    useAuthAndPlan();

  const getPessoaLabel = () => {
    if (filtroPessoa === 'todos') return 'Ambos (Casal)';
    const uids = plano?.memberIds || [];
    if (filtroPessoa === uids[0]) return membro1Nome;
    if (filtroPessoa === uids[1]) return membro2Nome || 'Pessoa 2';
    return 'Individual';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
          <span>Visão Geral</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {formatMesAno(mesSelecionado)}
          </span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Regime de {regime === 'competencia' ? 'Competência' : 'Caixa'} • Visualizando {getPessoaLabel()}
        </p>
      </div>

      {/* Seletor de Período do Dashboard */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start sm:self-auto overflow-x-auto max-w-full">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPeriodChange(opt.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              periodType === opt.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
