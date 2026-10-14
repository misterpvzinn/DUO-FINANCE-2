import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface IncomeCardProps {
  income: number;
  monthName: string;
}

export function IncomeCard({ income, monthName }: IncomeCardProps) {
  return (
    <Card className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Receitas do Mês
        </span>
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans">
          +{formatCurrency(income)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="capitalize">{monthName}</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Entradas</span>
      </div>
    </Card>
  );
}
