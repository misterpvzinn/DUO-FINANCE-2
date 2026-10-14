import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MonthlyFinancialSummary } from '../../types/dashboard';
import { formatBRL } from '../../utils/money';

interface FinancialEvolutionChartProps {
  data: MonthlyFinancialSummary[];
}

export function FinancialEvolutionChart({ data }: FinancialEvolutionChartProps) {
  // Converte os centavos para reais para o Recharts renderizar escalas legíveis
  const chartData = data.map((d) => ({
    name: d.label,
    receitas: d.incomeCentavos / 100,
    despesas: d.expenseCentavos / 100,
    resultado: d.resultCentavos / 100,
    rawIncome: d.incomeCentavos,
    rawExpense: d.expenseCentavos,
    rawResult: d.resultCentavos,
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
            <div className="flex items-center justify-between gap-4 text-blue-600 dark:text-blue-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-sans">Resultado:</span>
              <span className="font-semibold">{formatBRL(payload[0]?.payload?.rawResult)}</span>
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
            Evolução Financeira
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Receitas, despesas e resultado mensal consolidado
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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

            <Area
              type="monotone"
              name="Receitas"
              dataKey="receitas"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradReceitas)"
            />

            <Area
              type="monotone"
              name="Despesas"
              dataKey="despesas"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradDespesas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
