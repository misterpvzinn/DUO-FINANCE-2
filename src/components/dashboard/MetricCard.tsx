import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import { formatBRL } from '../../utils/money';

interface MetricCardProps {
  title: string;
  valueCentavos: number;
  previousValueCentavos?: number;
  percentageChange?: number | null;
  icon: LucideIcon;
  colorScheme: 'emerald' | 'rose' | 'blue' | 'purple' | 'amber' | 'zinc';
  reverseColors?: boolean; // Para despesas: aumento é vermelho, queda é verde
  tooltip?: string;
  subtitle?: string;
}

export function MetricCard({
  title,
  valueCentavos,
  previousValueCentavos,
  percentageChange,
  icon: Icon,
  colorScheme,
  reverseColors = false,
  tooltip,
  subtitle,
}: MetricCardProps) {
  // Configuração de cores
  const schemeStyles = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/40 dark:border-emerald-900/30',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200/40 dark:border-rose-900/30',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/40 dark:border-blue-900/30',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200/40 dark:border-purple-900/30',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/40 dark:border-amber-900/30',
    },
    zinc: {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      border: 'border-zinc-200/40 dark:border-zinc-800',
    },
  }[colorScheme];

  // Determinar cor da variação
  let isPositive = percentageChange !== null && percentageChange !== undefined && percentageChange > 0;
  let isNegative = percentageChange !== null && percentageChange !== undefined && percentageChange < 0;

  // Se reverseColors (como em despesas): aumento é ruim (vermelho), queda é boa (verde)
  let badgeColor = 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800';
  if (percentageChange !== null && percentageChange !== undefined) {
    if (reverseColors) {
      if (isPositive) badgeColor = 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40';
      if (isNegative) badgeColor = 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40';
    } else {
      if (isPositive) badgeColor = 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40';
      if (isNegative) badgeColor = 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40';
    }
  }

  return (
    <div
      className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-3 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl ${schemeStyles.bg} ${schemeStyles.text} flex items-center justify-center shadow-2xs`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 block">
          {formatBRL(valueCentavos)}
        </span>

        {/* Comparativo ou subtítulo */}
        <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
          {percentageChange !== undefined && percentageChange !== null ? (
            <>
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold font-mono ${badgeColor}`}>
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                ) : isNegative ? (
                  <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span>{Math.abs(percentageChange)}%</span>
              </span>
              <span className="text-zinc-400">vs. período anterior</span>
            </>
          ) : (
            <span className="text-zinc-400">{subtitle || 'Sem base anterior'}</span>
          )}
        </div>
      </div>
    </div>
  );
}
