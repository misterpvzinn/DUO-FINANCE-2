import React from 'react';
import { Layers, FolderTree, Plus, CheckCircle2, Tag } from 'lucide-react';
import { TipoCategoria } from '../../types/couplePlan';
import { Button } from '../../components/ui/Button';

export function PlanoDeContasEmptyView() {
  const TIPOS_PLANO: { id: TipoCategoria; label: string; desc: string; cor: string }[] = [
    { id: 'receita', label: 'Receitas', desc: 'Salários, rendimentos e entradas financeiras', cor: 'bg-emerald-500' },
    { id: 'custo_fixo', label: 'Custos Fixos', desc: 'Aluguel, condomínio, luz, internet e seguros', cor: 'bg-indigo-500' },
    { id: 'custo_variavel', label: 'Custos Variáveis', desc: 'Supermercado, farmácia, transporte e vestuário', cor: 'bg-amber-500' },
    { id: 'investimento', label: 'Investimentos', desc: 'Aportes de longo prazo, reserva e previdência', cor: 'bg-sky-500' },
    { id: 'lazer', label: 'Lazer & Experiências', desc: 'Viagens, restaurantes, cinema e hobbies do casal', cor: 'bg-teal-500' },
    { id: 'divida', label: 'Dívidas & Financiamentos', desc: 'Financiamento imobiliário/auto e amortizações', cor: 'bg-rose-500' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Plano de Contas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Estrutura hierárquica padronizada de classificação de despesas e receitas
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => alert('A criação de categorias personalizadas será ativada na etapa correspondente.')}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Categoria</span>
        </Button>
      </div>

      {/* Grid of the 6 Hierarchical Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIPOS_PLANO.map((tipo) => (
          <div
            key={tipo.id}
            className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${tipo.cor} shadow-2xs`} />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {tipo.label}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {tipo.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-mono uppercase text-[10px]">tipo: {tipo.id}</span>
              <span>0 subcategorias</span>
            </div>
          </div>
        ))}
      </div>

      {/* Regra de Negócio 5 info */}
      <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-xs text-center max-w-xl mx-auto space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Regra de Negócio 5 (Plano de Contas Hierárquico)
        </h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Cada lançamento e orçamento está associado a uma categoria folha subordinada a um desses 6 eixos canônicos, permitindo análises consolidadas tanto individuais quanto do casal.
        </p>
      </div>
    </div>
  );
}
