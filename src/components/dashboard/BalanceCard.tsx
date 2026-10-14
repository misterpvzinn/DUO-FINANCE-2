import React from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface BalanceCardProps {
  balance: number;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const isPositive = balance >= 0;

  return (
    <Card className="p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Saldo Atual
        </span>
        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
          <Wallet className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          {formatCurrency(balance)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        <span>Disponível em contas correntes e carteira</span>
      </div>
    </Card>
  );
}
