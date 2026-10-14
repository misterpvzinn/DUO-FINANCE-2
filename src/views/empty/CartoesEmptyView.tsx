import React from 'react';
import { CreditCard, Plus, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { Button } from '../../components/ui/Button';

export function CartoesEmptyView() {
  const { plano } = useAuthAndPlan();

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Cartões de Crédito
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gestão de cartões individuais e compartilhados do casal
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => alert('Os cartões e faturas serão ativados na etapa correspondente.')}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Cartão</span>
        </Button>
      </div>

      {/* Empty State Card */}
      <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <CreditCard className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Nenhum cartão vinculado
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Cadastre os cartões de cada membro ou o cartão compartilhado para controle de limites e faturas.
          </p>
        </div>

        {/* Business Rule 3 Callout */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 text-left text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider block">
            Regra Contábil dos Cartões (Regra 3):
          </span>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><b>Compra no cartão é despesa na data da compra</b> (impacta imediatamente o orçamento por competência).</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><b>Pagamento da fatura é transferência entre contas</b>, nunca despesa duplicada.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>Cada cartão possui <code>donoId</code> (ou vazio para compartilhado).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
