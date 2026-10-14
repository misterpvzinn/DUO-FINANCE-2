import React from 'react';
import { PiggyBank, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface NetWorthCardProps {
  netWorth: number;
}

export function NetWorthCard({ netWorth }: NetWorthCardProps) {
  return (
    <Card className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Patrimônio Total
        </span>
        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <PiggyBank className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          {formatCurrency(netWorth)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
        <span>Soma de saldos e investimentos</span>
      </div>
    </Card>
  );
}
