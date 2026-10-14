import React from 'react';
import { Plus, CreditCard, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '../ui/Button';

interface QuickActionsProps {
  onNewTransaction: () => void;
  onNewPurchase: () => void;
  onNewCard: () => void;
}

export function QuickActions({
  onNewTransaction,
  onNewPurchase,
  onNewCard,
}: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
      <Button
        size="sm"
        onClick={onNewTransaction}
        className="gap-1.5 text-xs shadow-2xs whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Novo Lançamento</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onNewPurchase}
        className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 whitespace-nowrap"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Nova Compra no Cartão</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onNewCard}
        className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap"
      >
        <CreditCard className="w-3.5 h-3.5" />
        <span>Novo Cartão</span>
      </Button>
    </div>
  );
}
