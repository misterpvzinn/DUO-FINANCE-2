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
import { MonthlyFinancialSummary } from '../../types/dashboard';
import { formatBRL } from '../../utils/money';

interface IncomeExpenseChartProps {
  data: MonthlyFinancialSummary[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const chartData = data.map((d) => ({
    name: d.label,
    receitas: d.incomeCentavos / 100,
    despesas: d.expenseCentavos / 100,
    rawIncome: d.incomeCentavos,
    rawExpense: d.expenseCentavos,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-zinc-700 shadow-xl text-xs space-y-1.5 z-50">
          <span className="font-bold text-zinc-800 dark:text-zinc-200 block border-b border-zinc-100 dark:border-zinc-800 pb-1">
            {label}
          </span>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] font-sans">Receitas:</span>
              <span className="font-semibold">{formatBRL(payload[0]?.payload?.rawIncome)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
              <span className="text-[11px] font-sans">Despesas:</span>
              <span className="font-semibold">{formatBRL(payload[0]?.payload?.rawExpense)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Comparativo Mensal
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Entradas versus saídas por mês
          </p>
        </div>
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
              name="Receitas"
              dataKey="receitas"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />

            <Bar
              name="Despesas"
              dataKey="despesas"
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
