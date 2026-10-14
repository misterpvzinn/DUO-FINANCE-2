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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { formatCompactCurrency, formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types/finance';
import { useTheme } from '../../context/ThemeContext';

interface CashFlowChartProps {
  transactions: Transaction[];
}

export function CashFlowChart({ transactions }: CashFlowChartProps) {
  const { theme } = useTheme();

  // Aggregate by last 6 months
  const monthlyData = React.useMemo(() => {
    const monthsMap: Record<string, { month: string; income: number; expense: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      monthsMap[key] = { month: label.charAt(0).toUpperCase() + label.slice(1), income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      const ym = tx.date.substring(0, 7);
      if (monthsMap[ym]) {
        if (tx.type === 'income') {
          monthsMap[ym].income += tx.amount;
        } else {
          monthsMap[ym].expense += tx.amount;
        }
      }
    });

    return Object.values(monthsMap);
  }, [transactions]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#27272a' : '#f4f4f5';
  const axisColor = isDark ? '#71717a' : '#a1a1aa';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>Entradas e saídas nos últimos 6 meses</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: axisColor, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#14171c]/95 p-3 shadow-lg backdrop-blur-xs text-xs">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{label}</p>
                        <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                          <span>Receitas:</span>
                          <span className="font-medium font-mono">
                            {formatCurrency(Number(payload[0]?.value || 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400 mt-1">
                          <span>Despesas:</span>
                          <span className="font-medium font-mono">
                            {formatCurrency(Number(payload[1]?.value || 0))}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                formatter={(val) => (
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {val === 'income' ? 'Receitas' : 'Despesas'}
                  </span>
                )}
              />
              <Bar
                name="income"
                dataKey="income"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="expense"
                dataKey="expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
