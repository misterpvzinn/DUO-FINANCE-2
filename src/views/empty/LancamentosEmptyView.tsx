import React from 'react';
import { ArrowLeftRight, Calendar, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { formatMesAno } from '../../utils/money';
import { Button } from '../../components/ui/Button';

interface LancamentosEmptyViewProps {
  onNovoLancamentoClick: () => void;
}

export function LancamentosEmptyView({ onNovoLancamentoClick }: LancamentosEmptyViewProps) {
  const { mesSelecionado, regime, plano } = useAuthAndPlan();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Lançamentos
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Extrato de receitas, despesas e transferências • {formatMesAno(mesSelecionado)}
          </p>
        </div>

        <Button onClick={onNovoLancamentoClick} size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>Novo lançamento</span>
        </Button>
      </div>

      {/* Empty State Card */}
      <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <ArrowLeftRight className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Nenhum lançamento cadastrado ainda
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Os lançamentos do plano <b>{plano?.nome}</b> serão exibidos aqui conforme forem inseridos por você ou pelo seu parceiro(a).
          </p>
        </div>

        {/* Business rules callout */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 text-left text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider block">
            Regras de Lançamento Aplicadas:
          </span>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Valores inteiros em centavos garantindo precisão absoluta sem arredondamento floating-point.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Dupla temporalidade: cada registro possui <code>dataCompetencia</code> e <code>dataCaixa</code>.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Compras parceladas dividem o valor e compartilham a mesma competência.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
