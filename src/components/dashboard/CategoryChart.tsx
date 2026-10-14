import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { PieChart as PieIcon, BarChart2, Tag, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { Transaction, Category } from '../../types/finance';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';

interface CategoryChartProps {
  transactions?: Transaction[];
  categories?: Category[];
  selectedMonth?: string;
  className?: string;
}

interface CategoryDataItem {
  id: string;
  name: string;
  value: number;
  color: string;
  percentage: number;
  count: number;
}

export function CategoryChart({
  transactions: propsTransactions,
  categories: propsCategories,
  selectedMonth: propsSelectedMonth,
  className = '',
}: CategoryChartProps) {
  const { theme } = useTheme();
  const finance = useFinance();

  const isDark = theme === 'dark';

  // Use props if provided, otherwise context
  const transactions = propsTransactions || finance.transactions;
  const categories = propsCategories || finance.categories;
  const selectedMonth = propsSelectedMonth || finance.selectedMonth;
  const coupleSettings = finance.coupleSettings;
  const coupleFilter = finance.coupleFilter;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'donut' | 'bars'>('donut');

  // Calculate expenses by category for the current month and view filter
  const categoryData: CategoryDataItem[] = useMemo(() => {
    const expenseTx = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      if (!tx.date.startsWith(selectedMonth)) return false;

      // Filter by couple filter if active
      if (coupleSettings?.enabled) {
        if (coupleFilter === 'user1' && tx.paidBy !== 'user1') return false;
        if (coupleFilter === 'user2' && tx.paidBy !== 'user2') return false;
        if (coupleFilter === 'shared' && !tx.isShared && tx.paidBy !== 'joint') return false;
      }
      return true;
    });

    const totalExpense = expenseTx.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalExpense === 0) return [];

    const map: Record<string, { amount: number; count: number }> = {};
    expenseTx.forEach((tx) => {
      if (!map[tx.categoryId]) {
        map[tx.categoryId] = { amount: 0, count: 0 };
      }
      map[tx.categoryId].amount += tx.amount;
      map[tx.categoryId].count += 1;
    });

    return Object.entries(map)
      .map(([catId, { amount, count }]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat ? cat.name : 'Outros',
          value: amount,
          color: cat?.color || '#a1a1aa',
          percentage: Number(((amount / totalExpense) * 100).toFixed(1)),
          count,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, selectedMonth, coupleSettings, coupleFilter]);

  const total = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryData]);

  // Active item for center highlight or breakdown
  const activeItem = activeIndex !== null && categoryData[activeIndex]
    ? categoryData[activeIndex]
    : null;

  return (
    <Card className={`flex flex-col border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#14171c] shadow-xs ${className}`}>
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Gastos por Categoria
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Distribuição das despesas do mês ({categoryData.length} categorias)
              </CardDescription>
            </div>
          </div>

          {/* Toggle View: Donut vs Bars */}
          {categoryData.length > 0 && (
            <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setChartMode('donut')}
                title="Visualização em Rosca (Donut)"
                aria-label="Ver gráfico de rosca"
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  chartMode === 'donut'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartMode('bars')}
                title="Visualização em Barras (Ranking)"
                aria-label="Ver gráfico de barras"
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  chartMode === 'bars'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-6 flex-1 flex flex-col justify-between">
        {categoryData.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mb-2">
              <Tag className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nenhuma despesa registrada
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Não há lançamentos de saída no mês selecionado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Chart Area */}
            {chartMode === 'donut' ? (
              <div className="h-[230px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as CategoryDataItem;
                          return (
                            <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#14171c]/95 backdrop-blur-md p-2.5 shadow-xl text-xs z-50">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.name}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-center justify-between gap-3 text-zinc-600 dark:text-zinc-400 font-mono">
                                <span>{formatCurrency(item.value)}</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.percentage}%
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                {item.count} {item.count === 1 ? 'transação' : 'transações'}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={3}
                      dataKey="value"
                      className="cursor-pointer outline-none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={isDark ? '#14171c' : '#ffffff'}
                          strokeWidth={2}
                          className="transition-opacity duration-200 cursor-pointer"
                          opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Total / Active Slice Information */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
                    {activeItem ? activeItem.name : 'Total Despesas'}
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight mt-0.5">
                    {formatCurrency(activeItem ? activeItem.value : total)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    {activeItem ? `${activeItem.percentage}% do total` : `${categoryData.length} categorias`}
                  </span>
                </div>
              </div>
            ) : (
              /* Horizontal Bar Ranking Mode */
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      hide
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#a1a1aa' : '#52525b', fontSize: 11 }}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as CategoryDataItem;
                          return (
                            <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#14171c]/95 backdrop-blur-md p-2.5 shadow-xl text-xs z-50">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.name}
                              </span>
                              <div className="mt-1 text-zinc-600 dark:text-zinc-400 font-mono">
                                {formatCurrency(item.value)} ({item.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 6, 6, 0]}
                    >
                      {categoryData.slice(0, 5).map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Breakdown List */}
            <div className="flex flex-col gap-2 max-h-[230px] overflow-y-auto pr-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 pb-1 border-b border-zinc-100 dark:border-zinc-800/80">
                Principais Categorias
              </div>

              {categoryData.slice(0, 6).map((item, index) => {
                const isHovered = activeIndex === index;
                return (
                  <div
                    key={item.id || item.name}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isHovered
                        ? 'bg-zinc-100 dark:bg-zinc-800/80 shadow-2xs'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform"
                        style={{
                          backgroundColor: item.color,
                          transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                        }}
                      />
                      <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] text-zinc-400 w-10 text-right font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
