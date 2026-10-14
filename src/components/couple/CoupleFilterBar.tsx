import React from 'react';
import { Users, User, HeartHandshake } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CoupleViewFilter } from '../../types/finance';

interface CoupleFilterBarProps {
  className?: string;
}

export function CoupleFilterBar({ className = '' }: CoupleFilterBarProps) {
  const { coupleSettings, coupleFilter, setCoupleFilter } = useFinance();

  if (!coupleSettings.enabled) return null;

  const filters: Array<{ id: CoupleViewFilter; label: string; icon: React.ReactNode }> = [
    {
      id: 'all',
      label: `Casal (${coupleSettings.user1Name} & ${coupleSettings.user2Name})`,
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: 'user1',
      label: `Apenas ${coupleSettings.user1Name}`,
      icon: <User className="w-3.5 h-3.5 text-blue-500" />,
    },
    {
      id: 'user2',
      label: `Apenas ${coupleSettings.user2Name}`,
      icon: <User className="w-3.5 h-3.5 text-pink-500" />,
    },
    {
      id: 'shared',
      label: 'Compartilhado',
      icon: <HeartHandshake className="w-3.5 h-3.5 text-purple-500" />,
    },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs overflow-x-auto max-w-full ${className}`}
    >
      {filters.map((f) => {
        const isActive = coupleFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setCoupleFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {f.icon}
            <span>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
}
