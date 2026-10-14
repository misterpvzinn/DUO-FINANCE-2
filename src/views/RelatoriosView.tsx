import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Percent,
  Layers,
  Heart,
  User,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useTransactions } from '../hooks/useTransactions';
import { LancamentoFinanceiro, CategoriaPlano } from '../types/finance';
import { formatBRL, formatMesAno } from '../utils/money';
import { Button } from '../components/ui/Button';

type PeriodoRelatorio = 'mes_atual' | '3_meses' | '6_meses' | 'ano_atual' | 'tudo';

const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#64748b', // Slate
];

const TIPO_NATUREZA_LABELS: Record<string, string> = {
  custo_fixo: 'Custos Fixos',
  custo_variavel: 'Custos Variáveis',
  lazer: 'Lazer & Experiências',
  investimento: 'Investimentos',
  divida: 'Dívidas & Financiamentos',
  receita: 'Receitas',
};

const TIPO_NATUREZA_COLORS: Record<string, string> = {
  custo_fixo: '#6366f1',
  custo_variavel: '#f59e0b',
  lazer: '#ec4899',
  investimento: '#06b6d4',
  divida: '#f43f5e',
  receita: '#10b981',
};

export function RelatoriosView() {
  const {
    plano,
    mesSelecionado,
    regime,
    filtroPessoa,
    membro1Nome,
    membro2Nome,
    segundoMembroUid,
  } = useAuthAndPlan();

  const { accounts, categories, accountsMap, categoriesMap } = useTransactions();

  // Filtros locais da página de relatórios
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>('6_meses');
  const [selectedPerson, setSelectedPerson] = useState<string>('todos');
  const [activeRegime, setActiveRegime] = useState<'caixa' | 'competencia'>(
    regime === 'competencia' ? 'competencia' : 'caixa'
  );

  // Todos os lançamentos do plano (para permitir análises temporais completas)
  const [allTransactions, setAllTransactions] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!plano?.id) return;
    setLoading(true);

    const ref = collection(db, 'planos', plano.id, 'lancamentos');
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const list: LancamentoFinanceiro[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            tipo: d.tipo,
            descricao: d.descricao,
            valorCentavos: d.valorCentavos,
            contaId: d.contaId,
            contaDestinoId: d.contaDestinoId,
            categoriaId: d.categoriaId,
            donoId: d.donoId ?? '',
            dataCompetencia: d.dataCompetencia,
            dataCaixa: d.dataCaixa,
            observacao: d.observacao,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          });
        });
        setAllTransactions(list);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao carregar lançamentos para relatórios:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [plano?.id]);

  // Helper de extração de data no regime selecionado (YYYY-MM-DD e YYYY-MM)
  const getTxDateInfo = (tx: LancamentoFinanceiro) => {
    const ts = activeRegime === 'competencia' ? tx.dataCompetencia : tx.dataCaixa;
    if (!ts || typeof ts.toDate !== 'function') {
      return { dateStr: '', monthStr: '' };
    }
    const d = ts.toDate();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dateStr: `${d.getFullYear()}-${month}-${day}`,
      monthStr: `${d.getFullYear()}-${month}`,
    };
  };

  // Determinar limite de data com base no período selecionado
  const { filteredTransactions, monthsList } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth(); // 0-indexed

    // Calcular meses a incluir
    let allowedMonths: string[] = [];

    if (periodo === 'mes_atual') {
      allowedMonths = [mesSelecionado];
    } else if (periodo === '3_meses') {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(currentYear, currentMonthNum - i, 1);
        allowedMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    } else if (periodo === '6_meses') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonthNum - i, 1);
        allowedMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    } else if (periodo === 'ano_atual') {
      for (let m = 1; m <= 12; m++) {
        allowedMonths.push(`${currentYear}-${String(m).padStart(2, '0')}`);
      }
    }

    const filtered = allTransactions.filter((tx) => {
      // Ignorar transferências internas nos relatórios de receita/despesa para não inflar
      if (tx.tipo === 'transferencia') return false;

      // Filtro de pessoa
      if (selectedPerson === 'compartilhado') {
        if (tx.donoId && tx.donoId !== '') return false;
      } else if (selectedPerson !== 'todos') {
        if (tx.donoId !== selectedPerson) return false;
      }

      // Filtro de período
      if (periodo !== 'tudo') {
        const { monthStr } = getTxDateInfo(tx);
        if (!allowedMonths.includes(monthStr)) return false;
      }

      return true;
    });

    return { filteredTransactions: filtered, monthsList: allowedMonths };
  }, [allTransactions, periodo, mesSelecionado, selectedPerson, activeRegime]);

  // Totais e KPIs Consolidados
  const kpis = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let countReceitas = 0;
    let countDespesas = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.tipo === 'receita') {
        totalReceitas += tx.valorCentavos;
        countReceitas++;
      } else if (tx.tipo === 'despesa') {
        totalDespesas += tx.valorCentavos;
        countDespesas++;
      }
    });

    const saldoLiquido = totalReceitas - totalDespesas;
    const taxaPoupanca =
      totalReceitas > 0 ? Math.max(0, Math.round((saldoLiquido / totalReceitas) * 100)) : 0;

    const numMeses = Math.max(1, periodo === 'mes_atual' ? 1 : monthsList.length || 1);
    const mediaReceitaMensal = Math.round(totalReceitas / numMeses);
    const mediaDespesaMensal = Math.round(totalDespesas / numMeses);

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      taxaPoupanca,
      countReceitas,
      countDespesas,
      mediaReceitaMensal,
      mediaDespesaMensal,
    };
  }, [filteredTransactions, monthsList, periodo]);

  // 1. Dados para Gráfico de Evolução Mensal (Receita vs Despesa vs Saldo)
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { month: string; label: string; receita: number; despesa: number; saldo: number }>();

    // Inicializar com os meses da lista se houver
    monthsList.forEach((m) => {
      map.set(m, {
        month: m,
        label: formatMesAno(m),
        receita: 0,
        despesa: 0,
        saldo: 0,
      });
    });

    filteredTransactions.forEach((tx) => {
      const { monthStr } = getTxDateInfo(tx);
      if (!monthStr) return;

      if (!map.has(monthStr)) {
        map.set(monthStr, {
          month: monthStr,
          label: formatMesAno(monthStr),
          receita: 0,
          despesa: 0,
          saldo: 0,
        });
      }

      const item = map.get(monthStr)!;
      if (tx.tipo === 'receita') {
        item.receita += tx.valorCentavos / 100;
      } else if (tx.tipo === 'despesa') {
        item.despesa += tx.valorCentavos / 100;
      }
      item.saldo = item.receita - item.despesa;
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions, monthsList, activeRegime]);

  // 2. Dados para Gráfico de Despesas por Categoria (Donut & Ranking)
  const categoryChartData = useMemo(() => {
    const map = new Map<string, { id: string; name: string; totalCentavos: number; count: number }>();

    filteredTransactions
      .filter((tx) => tx.tipo === 'despesa')
      .forEach((tx) => {
        const catId = tx.categoriaId || 'outros';
        const cat = categoriesMap.get(catId);
        const name = cat?.nome || 'Outras Despesas';

        if (!map.has(catId)) {
          map.set(catId, { id: catId, name, totalCentavos: 0, count: 0 });
        }
        const item = map.get(catId)!;
        item.totalCentavos += tx.valorCentavos;
        item.count++;
      });

    const totalDespesas = kpis.totalDespesas || 1;
    const sorted = Array.from(map.values()).sort((a, b) => b.totalCentavos - a.totalCentavos);

    return sorted.map((c, index) => ({
      name: c.name,
      value: c.totalCentavos / 100,
      totalCentavos: c.totalCentavos,
      percent: Math.round((c.totalCentavos / totalDespesas) * 100),
      count: c.count,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [filteredTransactions, categoriesMap, kpis.totalDespesas]);

  // 3. Dados por Natureza / Tipo de Categoria (Custos Fixos, Variáveis, Lazer, etc.)
  const natureChartData = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransactions
      .filter((tx) => tx.tipo === 'despesa')
      .forEach((tx) => {
        const cat = tx.categoriaId ? categoriesMap.get(tx.categoriaId) : null;
        const tipo = cat?.tipo || 'custo_variavel';
        map.set(tipo, (map.get(tipo) || 0) + tx.valorCentavos);
      });

    const totalDespesas = kpis.totalDespesas || 1;

    return Array.from(map.entries())
      .map(([tipo, centavos]) => ({
        tipo,
        label: TIPO_NATUREZA_LABELS[tipo] || tipo,
        centavos,
        value: centavos / 100,
        percent: Math.round((centavos / totalDespesas) * 100),
        color: TIPO_NATUREZA_COLORS[tipo] || '#64748b',
      }))
      .sort((a, b) => b.centavos - a.centavos);
  }, [filteredTransactions, categoriesMap, kpis.totalDespesas]);

  // 4. Divisão de Gastos entre Membros (Quem gastou quanto)
  const coupleDivisionData = useMemo(() => {
    let p1Centavos = 0;
    let p2Centavos = 0;
    let compCentavos = 0;

    const uids = plano?.memberIds || [];
    const uid1 = uids[0];
    const uid2 = uids[1] || segundoMembroUid;

    filteredTransactions
      .filter((tx) => tx.tipo === 'despesa')
      .forEach((tx) => {
        if (!tx.donoId || tx.donoId === '') {
          compCentavos += tx.valorCentavos;
        } else if (tx.donoId === uid1) {
          p1Centavos += tx.valorCentavos;
        } else if (tx.donoId === uid2) {
          p2Centavos += tx.valorCentavos;
        } else {
          compCentavos += tx.valorCentavos;
        }
      });

    const total = p1Centavos + p2Centavos + compCentavos || 1;

    return [
      {
        name: `Compartilhado (Casal)`,
        centavos: compCentavos,
        value: compCentavos / 100,
        percent: Math.round((compCentavos / total) * 100),
        color: '#8b5cf6', // Roxo
      },
      {
        name: membro1Nome,
        centavos: p1Centavos,
        value: p1Centavos / 100,
        percent: Math.round((p1Centavos / total) * 100),
        color: '#3b82f6', // Azul
      },
      ...(segundoMembroUid
        ? [
            {
              name: membro2Nome || 'Pessoa 2',
              centavos: p2Centavos,
              value: p2Centavos / 100,
              percent: Math.round((p2Centavos / total) * 100),
              color: '#ec4899', // Rosa
            },
          ]
        : []),
    ];
  }, [filteredTransactions, plano, membro1Nome, membro2Nome, segundoMembroUid]);

  // Exportar relatório em CSV com codificação UTF-8 BOM para Excel
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // BOM para acentos corretos no Excel
    csv += 'Relatório Consolidado Finance\n';
    csv += `Período:;${periodo};Regime:;${activeRegime === 'competencia' ? 'Competência' : 'Caixa'}\n\n`;

    csv += 'RESUMO GERAL\n';
    csv += `Total de Receitas:;R$ ${(kpis.totalReceitas / 100).toFixed(2).replace('.', ',')}\n`;
    csv += `Total de Despesas:;R$ ${(kpis.totalDespesas / 100).toFixed(2).replace('.', ',')}\n`;
    csv += `Saldo Líquido:;R$ ${(kpis.saldoLiquido / 100).toFixed(2).replace('.', ',')}\n`;
    csv += `Taxa de Poupança:;${kpis.taxaPoupanca}%\n\n`;

    csv += 'EVOLUÇÃO MENSAL\n';
    csv += 'Mês;Receitas (R$);Despesas (R$);Saldo (R$)\n';
    monthlyChartData.forEach((m) => {
      csv += `${m.label};${m.receita.toFixed(2).replace('.', ',')};${m.despesa.toFixed(2).replace('.', ',')};${m.saldo.toFixed(2).replace('.', ',')}\n`;
    });
    csv += '\n';

    csv += 'DESPESAS POR CATEGORIA\n';
    csv += 'Categoria;Total (R$);Percentual (%);Qtd Lançamentos\n';
    categoryChartData.forEach((c) => {
      csv += `${c.name};${c.value.toFixed(2).replace('.', ',')};${c.percent}%;${c.count}\n`;
    });
    csv += '\n';

    csv += 'LANÇAMENTOS DO PERÍODO\n';
    csv += 'Data;Tipo;Descrição;Categoria;Conta;Responsável;Valor (R$)\n';
    filteredTransactions.forEach((tx) => {
      const { dateStr } = getTxDateInfo(tx);
      const cat = tx.categoriaId ? categoriesMap.get(tx.categoriaId)?.nome : 'Geral';
      const acc = tx.contaId ? accountsMap.get(tx.contaId)?.nome : 'Geral';
      let dono = 'Compartilhado';
      if (tx.donoId === plano?.memberIds?.[0]) dono = membro1Nome;
      else if (tx.donoId === segundoMembroUid) dono = membro2Nome || 'Pessoa 2';

      csv += `${dateStr};${tx.tipo};"${tx.descricao.replace(/"/g, '""')}";${cat};${acc};${dono};${(tx.valorCentavos / 100).toFixed(2).replace('.', ',')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_finance_${periodo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Relatórios & Análise Financeira
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
              Consolidado
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Visão estratégica de evolução patrimonial, distribuição por categoria e divisão entre o casal
          </p>
        </div>

        {/* Top Controls: Export button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs shadow-xs"
            title="Exportar todos os dados deste relatório para planilha CSV / Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Período Buttons */}
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Período:</span>
          </span>

          <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 text-xs">
            {(
              [
                { id: 'mes_atual', label: 'Mês Atual' },
                { id: '3_meses', label: '3 Meses' },
                { id: '6_meses', label: '6 Meses' },
                { id: 'ano_atual', label: 'Ano Atual' },
                { id: 'tudo', label: 'Tudo' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriodo(item.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  periodo === item.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pessoa Selector */}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="todos">Todos (Visão Geral)</option>
              <option value="compartilhado">Apenas Compartilhados</option>
              {plano?.memberIds?.[0] && (
                <option value={plano.memberIds[0]}>{membro1Nome}</option>
              )}
              {segundoMembroUid && (
                <option value={segundoMembroUid}>{membro2Nome || 'Pessoa 2'}</option>
              )}
            </select>
          </div>

          {/* Regime Selector */}
          <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveRegime('caixa')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeRegime === 'caixa'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Caixa
            </button>
            <button
              type="button"
              onClick={() => setActiveRegime('competencia')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeRegime === 'competencia'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Competência
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Total de Receitas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{formatBRL(kpis.totalReceitas)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Média mensal: {formatBRL(kpis.mediaReceitaMensal)} ({kpis.countReceitas} lançamentos)
            </p>
          </div>
        </div>

        {/* Despesas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Total de Despesas
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              -{formatBRL(kpis.totalDespesas)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Média mensal: {formatBRL(kpis.mediaDespesaMensal)} ({kpis.countDespesas} lançamentos)
            </p>
          </div>
        </div>

        {/* Saldo Líquido Consolidado */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Saldo Líquido
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                kpis.saldoLiquido >= 0
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-xl font-bold font-mono ${
                kpis.saldoLiquido >= 0
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {kpis.saldoLiquido >= 0 ? '+' : ''}
              {formatBRL(kpis.saldoLiquido)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {kpis.saldoLiquido >= 0 ? 'Superávit acumulado no período' : 'Déficit no período'}
            </p>
          </div>
        </div>

        {/* Taxa de Poupança */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Taxa de Poupança
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-xl font-bold font-mono ${
                kpis.taxaPoupanca >= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : kpis.taxaPoupanca > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-500'
              }`}
            >
              {kpis.taxaPoupanca}%
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {kpis.taxaPoupanca >= 20
                ? 'Excelente taxa de reserva (meta ideal > 20%)'
                : 'Percentual retido das receitas'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico 1: Evolução Mensal (Barras de Receita/Despesa + Linha de Saldo) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Evolução Mensal: Receitas vs. Despesas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Comparativo mês a mês do fluxo financeiro do casal
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">Despesas</span>
            </div>
          </div>
        </div>

        {monthlyChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
            Nenhum dado financeiro encontrado para o período selecionado.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [
                    formatBRL(Math.round(Number(value) * 100)),
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="receita" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid: Despesas por Categoria (Donut + Ranking) & Divisão do Casal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Despesas por Categoria */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Distribuição de Despesas por Categoria
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Onde o dinheiro está sendo gasto
              </p>
            </div>
            <PieIcon className="w-4 h-4 text-zinc-400" />
          </div>

          {categoryChartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-zinc-400">
              Nenhuma despesa registrada neste período.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        formatBRL(Math.round(Number(value) * 100)),
                        '',
                      ]}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Ranking List */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {categoryChartData.slice(0, 6).map((cat, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {cat.percent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divisão de Gastos do Casal (Membro 1 vs Membro 2 vs Compartilhado) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Divisão de Gastos do Casal
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gastos conjuntos vs despesas individuais de cada parceiro
              </p>
            </div>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>

          <div className="flex flex-col gap-4 justify-center my-auto">
            {coupleDivisionData.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatBRL(item.centavos)}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                      {item.percent}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico 3: Despesas por Natureza (Custos Fixos, Variáveis, Lazer, Investimentos, Dívidas) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Estrutura de Gastos por Natureza Financeira
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Equilíbrio entre despesas essenciais (fixas/variáveis), lazer, investimentos e amortização de dívidas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {natureChartData.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {item.label}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div>
                <p className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formatBRL(item.centavos)}
                </p>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Participação nos gastos</span>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.percent}%</span>
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
