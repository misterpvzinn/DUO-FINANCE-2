import { useState, useEffect, useMemo } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import {
  LancamentoFinanceiro,
  ContaPlano,
  CategoriaPlano,
  CartaoCredito,
  FaturaCartao,
  RegimeFinanceiro,
} from '../types/finance';
import {
  DashboardPeriodType,
  DashboardMetrics,
  MonthlyFinancialSummary,
  CategoryExpenseSummary,
  MemberFinancialSummary,
  CardDashboardSummary,
  UpcomingInvoiceSummary,
} from '../types/dashboard';
import {
  getPeriodRange,
  calculatePercentageChange,
  filterTransactionsByPeriod,
  calculateIncome,
  calculateExpenses,
  calculateInvestments,
  calculateResult,
  calculateBalance,
  calculateExpensesByCategory,
  calculateMonthlyEvolution,
  calculateExpensesByMember,
  calculateCardSummary,
  calculateUpcomingInvoices,
} from '../services/dashboard';
import { subscribeAccounts, subscribeCategories } from '../services/planData';
import { subscribeCards } from '../services/cards';
import { subscribeInvoices } from '../services/invoices';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useDashboardData() {
  const {
    plano,
    mesSelecionado,
    regime,
    filtroPessoa,
    membro1Nome,
    membro2Nome,
    segundoMembroUid,
  } = useAuthAndPlan();

  const [periodType, setPeriodType] = useState<DashboardPeriodType>('mes_atual');

  // Dados brutos do Firestore
  const [allTransactions, setAllTransactions] = useState<LancamentoFinanceiro[]>([]);
  const [accounts, setAccounts] = useState<ContaPlano[]>([]);
  const [categories, setCategories] = useState<CategoriaPlano[]>([]);
  const [cards, setCards] = useState<CartaoCredito[]>([]);
  const [faturasMap, setFaturasMap] = useState<Map<string, FaturaCartao[]>>(new Map());

  const [loadingTxs, setLoadingTxs] = useState(true);
  const [loadingAux, setLoadingAux] = useState(true);

  // 1. Escutar todas as transações do plano para agregações
  useEffect(() => {
    if (!plano?.id) {
      setAllTransactions([]);
      setLoadingTxs(false);
      return;
    }

    setLoadingTxs(true);
    const lancamentosRef = collection(db, 'planos', plano.id, 'lancamentos');

    const unsub = onSnapshot(
      lancamentosRef,
      (snap) => {
        const list: LancamentoFinanceiro[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            tipo: data.tipo,
            descricao: data.descricao,
            valorCentavos: data.valorCentavos,
            contaId: data.contaId,
            contaDestinoId: data.contaDestinoId,
            categoriaId: data.categoriaId,
            donoId: data.donoId ?? '',
            dataCompetencia: data.dataCompetencia,
            dataCaixa: data.dataCaixa,
            observacao: data.observacao,
            cartaoId: data.cartaoId,
            compraCartaoId: data.compraCartaoId,
            parcelaCartaoId: data.parcelaCartaoId,
            faturaId: data.faturaId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        setAllTransactions(list);
        setLoadingTxs(false);
      },
      (err) => {
        console.error('Erro ao escutar transações para o dashboard:', err);
        setLoadingTxs(false);
      }
    );

    return () => unsub();
  }, [plano?.id]);

  // 2. Escutar contas e categorias
  useEffect(() => {
    if (!plano?.id) {
      setAccounts([]);
      setCategories([]);
      return;
    }

    const unsubAccounts = subscribeAccounts(plano.id, setAccounts);
    const unsubCategories = subscribeCategories(plano.id, (cats) => {
      setCategories(cats);
      setLoadingAux(false);
    });

    return () => {
      unsubAccounts();
      unsubCategories();
    };
  }, [plano?.id]);

  // 3. Escutar cartões
  useEffect(() => {
    if (!plano?.id) {
      setCards([]);
      return;
    }

    const unsub = subscribeCards(plano.id, (cardsList) => {
      setCards(cardsList);
    });

    return () => unsub();
  }, [plano?.id]);

  // 4. Escutar faturas de cada cartão
  useEffect(() => {
    if (!plano?.id || cards.length === 0) {
      setFaturasMap(new Map());
      return;
    }

    const unsubs: (() => void)[] = [];
    cards.forEach((card) => {
      const unsub = subscribeInvoices(plano.id, card.id, (invoicesList) => {
        setFaturasMap((prev) => {
          const next = new Map(prev);
          next.set(card.id, invoicesList);
          return next;
        });
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [plano?.id, cards]);

  // Mapas rápidos
  const categoriesMap = useMemo(() => {
    const map = new Map<string, CategoriaPlano>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const accountsMap = useMemo(() => {
    const map = new Map<string, ContaPlano>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  // Determinar range de período ativo
  const periodRange = useMemo(() => {
    return getPeriodRange(periodType, mesSelecionado);
  }, [periodType, mesSelecionado]);

  // Transações do período atual
  const periodTransactions = useMemo(() => {
    return filterTransactionsByPeriod(
      allTransactions,
      periodRange.startDate,
      periodRange.endDate,
      regime as RegimeFinanceiro,
      filtroPessoa
    );
  }, [allTransactions, periodRange, regime, filtroPessoa]);

  // Transações do período anterior (para comparação percentual)
  const previousTransactions = useMemo(() => {
    return filterTransactionsByPeriod(
      allTransactions,
      periodRange.previousStartDate,
      periodRange.previousEndDate,
      regime as RegimeFinanceiro,
      filtroPessoa
    );
  }, [allTransactions, periodRange, regime, filtroPessoa]);

  // 1. Indicadores Principais (Métricas)
  const metrics: DashboardMetrics = useMemo(() => {
    // Período Atual
    const curIncome = calculateIncome(periodTransactions);
    const curExpense = calculateExpenses(periodTransactions, categoriesMap);
    const curInvestment = calculateInvestments(periodTransactions, categoriesMap);
    const curResult = calculateResult(curIncome, curExpense, curInvestment);

    // Período Anterior
    const prevIncome = calculateIncome(previousTransactions);
    const prevExpense = calculateExpenses(previousTransactions, categoriesMap);
    const prevInvestment = calculateInvestments(previousTransactions, categoriesMap);
    const prevResult = calculateResult(prevIncome, prevExpense, prevInvestment);

    // Saldo disponível total acumulado
    const availableBalance = calculateBalance(
      accounts,
      allTransactions,
      regime as RegimeFinanceiro,
      filtroPessoa
    );

    // Gastos no cartão no período (despesas com cartaoId)
    const cardSpending = periodTransactions
      .filter((tx) => tx.tipo === 'despesa' && !!tx.cartaoId)
      .reduce((sum, tx) => sum + tx.valorCentavos, 0);

    return {
      income: {
        currentCentavos: curIncome,
        previousCentavos: prevIncome,
        percentageChange: calculatePercentageChange(curIncome, prevIncome),
      },
      expense: {
        currentCentavos: curExpense,
        previousCentavos: prevExpense,
        percentageChange: calculatePercentageChange(curExpense, prevExpense),
      },
      investment: {
        currentCentavos: curInvestment,
        previousCentavos: prevInvestment,
        percentageChange: calculatePercentageChange(curInvestment, prevInvestment),
      },
      result: {
        currentCentavos: curResult,
        previousCentavos: prevResult,
        percentageChange: calculatePercentageChange(curResult, prevResult),
      },
      availableBalanceCentavos: availableBalance,
      cardSpendingCentavos: cardSpending,
    };
  }, [
    periodTransactions,
    previousTransactions,
    categoriesMap,
    accounts,
    allTransactions,
    regime,
    filtroPessoa,
  ]);

  // 2. Gráfico de Evolução Mensal (Recharts)
  const monthlyEvolution = useMemo(() => {
    // Determina a lista de meses para o gráfico
    // Se for 'mes_atual' ou 'mes_anterior', exibe pelo menos os últimos 6 meses para visualização gráfica
    let chartMonths = periodRange.months;
    if (chartMonths.length < 6) {
      const range6 = getPeriodRange('ultimos_6_meses', mesSelecionado);
      chartMonths = range6.months;
    }

    return calculateMonthlyEvolution(
      allTransactions,
      chartMonths,
      categoriesMap,
      regime as RegimeFinanceiro,
      filtroPessoa
    );
  }, [allTransactions, periodRange, mesSelecionado, categoriesMap, regime, filtroPessoa]);

  // 3. Distribuição de Despesas e Top Categorias
  const categoryExpenses = useMemo(() => {
    return calculateExpensesByCategory(periodTransactions, categoriesMap);
  }, [periodTransactions, categoriesMap]);

  const topCategories = useMemo(() => {
    return categoryExpenses.slice(0, 5);
  }, [categoryExpenses]);

  // 4. Movimentação por Pessoa
  const memberSummary = useMemo(() => {
    const uids = plano?.memberIds || [];
    return calculateExpensesByMember(
      periodTransactions,
      categoriesMap,
      uids[0] || 'membro-1',
      membro1Nome,
      segundoMembroUid || uids[1] || undefined,
      membro2Nome || undefined
    );
  }, [
    periodTransactions,
    categoriesMap,
    plano?.memberIds,
    membro1Nome,
    segundoMembroUid,
    membro2Nome,
  ]);

  // 5. Cartões e Próximas Faturas
  const cardSummary = useMemo(() => {
    return calculateCardSummary(cards, faturasMap);
  }, [cards, faturasMap]);

  const upcomingInvoices = useMemo(() => {
    return calculateUpcomingInvoices(cards, faturasMap);
  }, [cards, faturasMap]);

  // 6. Últimos Lançamentos (Top 6 mais recentes)
  const recentTransactions = useMemo(() => {
    return [...allTransactions]
      .sort((a, b) => {
        const dateA =
          regime === 'competencia' ? a.dataCompetencia.toMillis() : a.dataCaixa.toMillis();
        const dateB =
          regime === 'competencia' ? b.dataCompetencia.toMillis() : b.dataCaixa.toMillis();
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [allTransactions, regime]);

  const loading = loadingTxs || loadingAux;
  const isEmpty = !loading && allTransactions.length === 0;

  return {
    metrics,
    monthlyEvolution,
    categoryExpenses,
    topCategories,
    memberSummary,
    cardSummary,
    upcomingInvoices,
    recentTransactions,
    accounts,
    categories,
    categoriesMap,
    accountsMap,
    cards,
    loading,
    isEmpty,
    periodType,
    setPeriodType,
    periodLabel: periodRange.label,
  };
}
