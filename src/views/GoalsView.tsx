import React, { useState } from 'react';
import { Target, Plus, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFinance } from '../context/FinanceContext';
import { GoalModal } from '../components/goals/GoalModal';
import { FinancialGoal } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

export function GoalsView() {
  const { goals, deleteGoal } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  const handleOpenEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Metas Financeiras
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Planejamento e acompanhamento de conquistas e reservas
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
          return (
            <Card key={goal.id} className="p-6 flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                >
                  {goal.category || 'Meta'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir meta "${goal.title}"?`)) deleteGoal(goal.id);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{goal.title}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    de {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    {progress}% concluído
                  </span>
                  {goal.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(goal.deadline)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <GoalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} goalToEdit={editingGoal} />
    </div>
  );
}
