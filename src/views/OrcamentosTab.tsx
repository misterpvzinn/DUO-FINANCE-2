import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { OrcamentoFinanceiro, BudgetUsage } from '../types/goalsAndBudgets';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useBudgets } from '../hooks/useBudgets';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetSummaryHeader } from '../components/budgets/BudgetSummaryHeader';
import { BudgetChart } from '../components/budgets/BudgetChart';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { Button } from '../components/ui/Button';
import { formatMesAno } from '../utils/money';

export function OrcamentosTab() {
  const { plano, mesSelecionado, membro1Nome, membro2Nome, segundoMembroUid } =
    useAuthAndPlan();

  const [customMonth, setCustomMonth] = useState<string>(mesSelecionado);

  const {
    currentMonthBudgets,
    budgetUsages,
    summary,
    categories,
    activeMonth,
    createBudget,
    updateBudget,
    disableBudget,
    deleteBudget,
  } = useBudgets(customMonth);

  const [modalOpen, setModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<OrcamentoFinanceiro | null>(null);

  // Navegador de mês
  const handlePrevMonth = () => {
    const [ano, mes] = activeMonth.split('-').map(Number);
    const d = new Date(ano, mes - 2, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCustomMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [ano, mes] = activeMonth.split('-').map(Number);
    const d = new Date(ano, mes, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCustomMonth(newMonth);
  };

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  return (
    <div className="space-y-6">
      {/* Barra de Navegação Mensal e Botão Novo Orçamento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Seletor de Mês do Orçamento (Regra 18 e 29) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 min-w-[120px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatMesAno(activeMonth)}</span>
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {activeMonth !== mesSelecionado && (
            <button
              type="button"
              onClick={() => setCustomMonth(mesSelecionado)}
              className="px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Voltar ao mês atual
            </button>
          )}
        </div>

        <Button
          onClick={() => {
            setBudgetToEdit(null);
            setModalOpen(true);
          }}
          className="gap-1.5 text-xs shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo orçamento</span>
        </Button>
      </div>

      {/* Resumo Consolidado (Regra 27) */}
      <BudgetSummaryHeader summary={summary} />

      {/* Gráfico Comparativo Recharts (Regra 28) */}
      {budgetUsages.length > 0 && <BudgetChart usages={budgetUsages} />}

      {/* Grid de Cards de Orçamento ou Estado Vazio */}
      {budgetUsages.length === 0 ? (
        <div className="py-16 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-[#14171c]/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <PieIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Você ainda não possui orçamentos para este mês.
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Defina limites de gastos por categoria para manter as finanças sob controle.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setBudgetToEdit(null);
              setModalOpen(true);
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar orçamento</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetUsages.map((usage: BudgetUsage) => {
            const budget = currentMonthBudgets.find((b: OrcamentoFinanceiro) => b.id === usage.orcamentoId);
            if (!budget) return null;

            return (
              <BudgetCard
                key={usage.orcamentoId}
                usage={usage}
                budget={budget}
                membro1Nome={membro1Nome}
                membro2Nome={membro2Nome || 'Pessoa 2'}
                membro1Uid={membro1Uid}
                membro2Uid={membro2Uid}
                onEdit={(b: OrcamentoFinanceiro) => {
                  setBudgetToEdit(b);
                  setModalOpen(true);
                }}
                onDisable={disableBudget}
                onDelete={deleteBudget}
              />
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSave={async (params: any) => {
          if (budgetToEdit) {
            await updateBudget(budgetToEdit.id, params);
          } else {
            await createBudget(params);
          }
        }}
        budgetToEdit={budgetToEdit}
        categories={categories}
        defaultMonth={activeMonth}
      />
    </div>
  );
}
