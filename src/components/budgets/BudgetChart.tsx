import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BudgetUsage } from '../../types/goalsAndBudgets';
import { formatBRL } from '../../utils/money';

interface BudgetChartProps {
  usages: BudgetUsage[];
}

export function BudgetChart({ usages }: BudgetChartProps) {
  if (usages.length === 0) return null;

  const chartData = usages.map((u) => ({
    name: u.categoriaNome.length > 12 ? `${u.categoriaNome.slice(0, 10)}...` : u.categoriaNome,
    fullName: u.categoriaNome,
    orcado: u.valorLimiteCentavos / 100,
    utilizado: u.valorUtilizadoCentavos / 100,
    rawOrcado: u.valorLimiteCentavos,
    rawUtilizado: u.valorUtilizadoCentavos,
    percentual: u.percentualUtilizado,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-zinc-700 shadow-xl text-xs space-y-1.5 z-50">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 block border-b border-zinc-100 dark:border-zinc-800 pb-1">
            {data.fullName}
          </span>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between gap-4 text-indigo-600 dark:text-indigo-400">
              <span className="text-[11px] font-sans">Orçado:</span>
              <span className="font-semibold">{formatBRL(data.rawOrcado)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
              <span className="text-[11px] font-sans">Utilizado:</span>
              <span className="font-semibold">{formatBRL(data.rawUtilizado)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-sans">Consumo:</span>
              <span className="font-semibold">{data.percentual}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Orçado vs. Realizado
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Comparação gráfica do limite orçamentário por categoria
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#888888' }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#888888' }}
              tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />

            <Bar
              name="Limite Orçado"
              dataKey="orcado"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />

            <Bar
              name="Gasto Realizado"
              dataKey="utilizado"
              fill="#f43f5e"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
