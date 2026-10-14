import React, { useState } from 'react';
import {
  Target,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  Edit2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFinance } from '../context/FinanceContext';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { GoalModal } from '../components/goals/GoalModal';
import { FinancialGoal } from '../types/finance';
import { formatCurrency, formatDate, formatMonthName } from '../utils/formatters';

export function BudgetsView() {
  const {
    budgets,
    categories,
    transactions,
    selectedMonth,
    deleteBudget,
    goals,
    deleteGoal,
  } = useFinance();

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Filter current month expenses
  const currentMonthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth)
  );

  const budgetItems = budgets
    .filter((b) => b.month === selectedMonth)
    .map((budget) => {
      const category = categories.find((c) => c.id === budget.categoryId);
      const spent = currentMonthExpenses
        .filter((tx) => tx.categoryId === budget.categoryId)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const percent = Math.min(Math.round((spent / budget.monthlyLimit) * 100), 100);
      const rawPercent = Math.round((spent / budget.monthlyLimit) * 100);
      const isOver = spent > budget.monthlyLimit;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: category ? category.name : 'Categoria',
        categoryColor: category?.color || '#a1a1aa',
        spent,
        limit: budget.monthlyLimit,
        percent,
        rawPercent,
        isOver,
      };
    })
    .sort((a, b) => b.rawPercent - a.rawPercent);

  const totalBudgetLimit = budgetItems.reduce((acc, curr) => acc + curr.limit, 0);
  const totalBudgetSpent = budgetItems.reduce((acc, curr) => acc + curr.spent, 0);
  const overallPercent = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  const handleOpenEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  };

  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Metas e Orçamentos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
            Planejamento de tetos de gastos e objetivos para {formatMonthName(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => setBudgetModalOpen(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Definir Orçamento</span>
          </Button>
          <Button onClick={handleOpenNewGoal} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Nova Meta</span>
          </Button>
        </div>
      </div>

      {/* Orçamentos por Categoria */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Orçamentos por Categoria
            </h2>
            <span className="text-xs text-zinc-400">({budgetItems.length} ativos)</span>
          </div>

          {totalBudgetLimit > 0 && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Total orçado: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(totalBudgetSpent)}</span> / {formatCurrency(totalBudgetLimit)} ({overallPercent}%)
            </div>
          )}
        </div>

        {budgetItems.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed">
            <Target className="w-10 h-10 text-zinc-400 mb-2" />
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Nenhum teto de gastos definido ainda
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Defina limites mensais para alimentação, lazer, transporte e mantenha suas contas sob controle.
            </p>
            <Button onClick={() => setBudgetModalOpen(true)} variant="outline" size="sm" className="mt-4">
              Criar Primeiro Orçamento
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetItems.map((item) => (
              <Card key={item.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.categoryColor }}
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isOver ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Estourado
                      </span>
                    ) : item.rawPercent >= 85 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                        Alerta ({item.rawPercent}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        Em dia
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir o orçamento de "${item.categoryName}"?`)) {
                          deleteBudget(item.id);
                        }
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir orçamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isOver
                          ? 'bg-rose-500'
                          : item.rawPercent >= 85
                          ? 'bg-amber-500'
                          : 'bg-zinc-900 dark:bg-white'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-600 dark:text-zinc-300 font-medium">
                      {formatCurrency(item.spent)}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px]">
                      Teto: {formatCurrency(item.limit)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>{item.rawPercent}% do orçamento utilizado</span>
                  <span>
                    {item.isOver
                      ? `Excedido em ${formatCurrency(item.spent - item.limit)}`
                      : `Restam ${formatCurrency(item.limit - item.spent)}`}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Metas Financeiras (Goals) */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Metas Financeiras & Sonhos
            </h2>
            <span className="text-xs text-zinc-400">({goals.length} metas)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const progress = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: goal.color }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {goal.category || 'Objetivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditGoal(goal)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Editar meta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir a meta "${goal.title}"?`)) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {goal.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      de {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex flex-col gap-1.5">
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">
                      {progress}% alcançado
                    </span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(goal.deadline)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <BudgetModal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} />
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        goalToEdit={editingGoal}
      />
    </div>
  );
}
