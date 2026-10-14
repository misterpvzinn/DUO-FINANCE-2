import React from 'react';
import { Target, Plus, Sparkles, Heart } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function MetasEmptyView() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Metas do Casal
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Sonhos, objetivos de curto, médio e longo prazo do plano
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => alert('A criação de metas será ativada na etapa correspondente.')}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Nova Meta</span>
        </Button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <Target className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Nenhuma meta cadastrada
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Defina objetivos como Reserva de Emergência, Viagem de Férias ou Entrada da Casa Própria com acompanhamento de progresso em centavos.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 text-left text-xs text-zinc-500">
          As metas serão armazenadas na subcoleção <code>planos/&#123;planoId&#125;/metas</code> com validação de <code>valorAlvoCentavos &gt; 0</code> e <code>valorAtualCentavos &gt;= 0</code> pelas Security Rules.
        </div>
      </div>
    </div>
  );
}
