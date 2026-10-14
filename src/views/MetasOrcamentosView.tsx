import React, { useState } from 'react';
import { Target, PieChart } from 'lucide-react';
import { ContaPlano } from '../types/finance';
import { MetasTab } from './MetasTab';
import { OrcamentosTab } from './OrcamentosTab';

interface MetasOrcamentosViewProps {
  initialTab?: 'metas' | 'orcamentos';
  accounts?: ContaPlano[];
}

export function MetasOrcamentosView({
  initialTab = 'metas',
  accounts = [],
}: MetasOrcamentosViewProps) {
  const [activeTab, setActiveTab] = useState<'metas' | 'orcamentos'>(initialTab);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 animate-in fade-in duration-300">
      {/* Cabeçalho da Página com Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Metas & Orçamentos
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Planejamento financeiro compartilhado para sonhos e limites de gastos
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('metas')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'metas'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span>Metas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orcamentos')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'orcamentos'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-rose-500" />
            <span>Orçamentos</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === 'metas' ? (
        <MetasTab accounts={accounts} />
      ) : (
        <OrcamentosTab />
      )}
    </div>
  );
}
