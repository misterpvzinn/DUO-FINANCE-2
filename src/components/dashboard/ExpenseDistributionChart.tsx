import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { CategoryExpenseSummary } from '../../types/dashboard';
import { formatBRL } from '../../utils/money';

interface ExpenseDistributionChartProps {
  categories: CategoryExpenseSummary[];
}

const CATEGORY_TYPE_NAMES: Record<string, string> = {
  custo_fixo: 'Custos Fixos',
  custo_variavel: 'Custos Variáveis',
  lazer: 'Lazer',
  divida: 'Dívidas',
  investimento: 'Investimentos',
  receita: 'Receitas',
};

const TYPE_COLORS: Record<string, string> = {
  custo_fixo: '#6366f1',
  custo_variavel: '#f59e0b',
  lazer: '#14b8a6',
  divida: '#f43f5e',
  investimento: '#0ea5e9',
};

export function ExpenseDistributionChart({ categories }: ExpenseDistributionChartProps) {
  const [viewMode, setViewMode] = useState<'tipo' | 'categoria'>('tipo');

  // Agrupamento por tipo de categoria (Custos Fixos, Variáveis, Lazer, etc.)
  const typeMap = new Map<string, number>();
  categories.forEach((c) => {
    const t = c.categoryType || 'custo_variavel';
    typeMap.set(t, (typeMap.get(t) || 0) + c.totalCentavos);
  });

  const totalGeral = categories.reduce((sum, c) => sum + c.totalCentavos, 0);

  const typeData = Array.from(typeMap.entries()).map(([tipo, totalCentavos]) => ({
    name: CATEGORY_TYPE_NAMES[tipo] || tipo,
    value: totalCentavos / 100,
    rawCentavos: totalCentavos,
    color: TYPE_COLORS[tipo] || '#64748b',
    percentage: totalGeral > 0 ? Math.round((totalCentavos / totalGeral) * 1000) / 10 : 0,
  }));

  // Agrupamento por categoria individual (top 6 + outros)
  const topCats = categories.slice(0, 5);
  const outrosCentavos = categories.slice(5).reduce((sum, c) => sum + c.totalCentavos, 0);

  const catData = topCats.map((c) => ({
    name: c.categoryName,
    value: c.totalCentavos / 100,
    rawCentavos: c.totalCentavos,
    color: c.color || '#64748b',
    percentage: c.percentage,
  }));

  if (outrosCentavos > 0) {
    catData.push({
      name: 'Outras',
      value: outrosCentavos / 100,
      rawCentavos: outrosCentavos,
      color: '#94a3b8',
      percentage: totalGeral > 0 ? Math.round((outrosCentavos / totalGeral) * 1000) / 10 : 0,
    });
  }

  const activeData = viewMode === 'tipo' ? typeData : catData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-zinc-700 shadow-xl text-xs space-y-1 z-50 font-sans">
          <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
            {data.name}
          </span>
          <div className="flex items-center justify-between gap-3 font-mono">
            <span className="text-zinc-500 font-sans">{data.percentage}%</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {formatBRL(data.rawCentavos)}
            </span>
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
            Distribuição de Gastos
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Por {viewMode === 'tipo' ? 'tipo de custo' : 'categoria'}
          </p>
        </div>

        {/* Toggle Por Tipo / Por Categoria (Regra 9) */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('tipo')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'tipo'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Por tipo
          </button>
          <button
            type="button"
            onClick={() => setViewMode('categoria')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'categoria'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            Por categoria
          </button>
        </div>
      </div>

      {activeData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          Nenhuma despesa registrada no período.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut Chart */}
          <div className="h-56 w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {activeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda Lateral */}
          <div className="w-full sm:w-1/2 space-y-2 text-xs">
            {activeData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-[11px] text-zinc-400 font-sans">
                    {item.percentage}%
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatBRL(item.rawCentavos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
