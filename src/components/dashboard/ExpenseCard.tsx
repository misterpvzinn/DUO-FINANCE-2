import React from 'react';
import { ArrowDownRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseCardProps {
  expense: number;
  monthName: string;
}

export function ExpenseCard({ expense, monthName }: ExpenseCardProps) {
  return (
    <Card className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          Despesas do Mês
        </span>
        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <ArrowDownRight className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-sans">
          -{formatCurrency(expense)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="capitalize">{monthName}</span>
        <span className="text-rose-600 dark:text-rose-400 font-medium">Saídas</span>
      </div>
    </Card>
  );
}
