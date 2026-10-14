import React from 'react';
import { Target, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { Budget, Category, Transaction } from '../../types/finance';

interface BudgetProgressProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string;
}

export function BudgetProgress({
  budgets,
  categories,
  transactions,
  selectedMonth,
}: BudgetProgressProps) {
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
      const isOver = spent > budget.monthlyLimit;

      return {
        id: budget.id,
        categoryName: category ? category.name : 'Categoria',
        categoryColor: category?.color || '#a1a1aa',
        spent,
        limit: budget.monthlyLimit,
        percent,
        isOver,
      };
    })
    .sort((a, b) => b.percent - a.percent);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Orçamentos do Mês</CardTitle>
            <CardDescription>Acompanhamento de gastos vs limite estipulado</CardDescription>
          </div>
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-6 flex flex-col gap-4">
        {budgetItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Nenhum orçamento definido para este mês.
          </div>
        ) : (
          budgetItems.slice(0, 4).map((item) => (
            <div key={item.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {item.categoryName}
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className={item.isOver ? 'text-rose-600 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}>
                    {formatCurrency(item.spent)}
                  </span>
                  <span className="text-zinc-400">/</span>
                  <span className="text-zinc-400">{formatCurrency(item.limit)}</span>
                  {item.isOver && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.isOver
                      ? 'bg-rose-500'
                      : item.percent > 85
                      ? 'bg-amber-500'
                      : 'bg-zinc-900 dark:bg-white'
                  }`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span>{item.percent}% utilizado</span>
                <span>{item.isOver ? 'Limite excedido' : `Restam ${formatCurrency(Math.max(0, item.limit - item.spent))}`}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
