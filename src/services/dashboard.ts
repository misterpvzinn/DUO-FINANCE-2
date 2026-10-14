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
  PeriodRange,
  MetricComparison,
  DashboardMetrics,
  MonthlyFinancialSummary,
  CategoryExpenseSummary,
  MemberFinancialSummary,
  CardDashboardSummary,
  UpcomingInvoiceSummary,
} from '../types/dashboard';

/**
 * Determina o intervalo de datas (início e fim) para o período selecionado,
 * além do período anterior equivalente para comparação percentual.
 */
export function getPeriodRange(
  periodType: DashboardPeriodType,
  referenceMonthStr: string // "YYYY-MM"
): PeriodRange {
  const [refAnoStr, refMesStr] = referenceMonthStr.split('-');
  const refAno = parseInt(refAnoStr, 10);
  const refMes = parseInt(refMesStr, 10); // 1-12

  let startDate: Date;
  let endDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;
  let label = '';
  const months: string[] = [];

  switch (periodType) {
    case 'mes_anterior': {
      // Mês anterior ao de referência
      const prevDate = new Date(refAno, refMes - 2, 1);
      const prevAno = prevDate.getFullYear();
      const prevMes = prevDate.getMonth() + 1;
      const lastDay = new Date(prevAno, prevMes, 0).getDate();

      startDate = new Date(prevAno, prevMes - 1, 1, 0, 0, 0);
      endDate = new Date(prevAno, prevMes - 1, lastDay, 23, 59, 59);

      // Comparação com o mês anterior a ele
      const pprevDate = new Date(prevAno, prevMes - 2, 1);
      const ppAno = pprevDate.getFullYear();
      const ppMes = pprevDate.getMonth() + 1;
      const ppLastDay = new Date(ppAno, ppMes, 0).getDate();
      prevStartDate = new Date(ppAno, ppMes - 1, 1, 0, 0, 0);
      prevEndDate = new Date(ppAno, ppMes - 1, ppLastDay, 23, 59, 59);

      label = 'Mês anterior';
      months.push(`${prevAno}-${String(prevMes).padStart(2, '0')}`);
      break;
    }
    case 'ultimos_3_meses': {
      // 3 meses retroativos a partir do referenceMonth
      const startD = new Date(refAno, refMes - 3, 1);
      const lastDay = new Date(refAno, refMes, 0).getDate();

      startDate = new Date(startD.getFullYear(), startD.getMonth(), 1, 0, 0, 0);
      endDate = new Date(refAno, refMes - 1, lastDay, 23, 59, 59);

      // 3 meses antes
      const prevStartD = new Date(startD.getFullYear(), startD.getMonth() - 3, 1);
      const prevEndLastDay = new Date(startD.getFullYear(), startD.getMonth(), 0).getDate();
      prevStartDate = new Date(prevStartD.getFullYear(), prevStartD.getMonth(), 1, 0, 0, 0);
      prevEndDate = new Date(startD.getFullYear(), startD.getMonth() - 1, prevEndLastDay, 23, 59, 59);

      label = 'Últimos 3 meses';
      for (let i = 2; i >= 0; i--) {
        const d = new Date(refAno, refMes - 1 - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      break;
    }
    case 'ultimos_6_meses': {
      const startD = new Date(refAno, refMes - 6, 1);
      const lastDay = new Date(refAno, refMes, 0).getDate();

      startDate = new Date(startD.getFullYear(), startD.getMonth(), 1, 0, 0, 0);
      endDate = new Date(refAno, refMes - 1, lastDay, 23, 59, 59);

      const prevStartD = new Date(startD.getFullYear(), startD.getMonth() - 6, 1);
      const prevEndLastDay = new Date(startD.getFullYear(), startD.getMonth(), 0).getDate();
      prevStartDate = new Date(prevStartD.getFullYear(), prevStartD.getMonth(), 1, 0, 0, 0);
      prevEndDate = new Date(startD.getFullYear(), startD.getMonth() - 1, prevEndLastDay, 23, 59, 59);

      label = 'Últimos 6 meses';
      for (let i = 5; i >= 0; i--) {
        const d = new Date(refAno, refMes - 1 - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      break;
    }
    case 'ultimos_12_meses': {
      const startD = new Date(refAno, refMes - 12, 1);
      const lastDay = new Date(refAno, refMes, 0).getDate();

      startDate = new Date(startD.getFullYear(), startD.getMonth(), 1, 0, 0, 0);
      endDate = new Date(refAno, refMes - 1, lastDay, 23, 59, 59);

      const prevStartD = new Date(startD.getFullYear(), startD.getMonth() - 12, 1);
      const prevEndLastDay = new Date(startD.getFullYear(), startD.getMonth(), 0).getDate();
      prevStartDate = new Date(prevStartD.getFullYear(), prevStartD.getMonth(), 1, 0, 0, 0);
      prevEndDate = new Date(startD.getFullYear(), startD.getMonth() - 1, prevEndLastDay, 23, 59, 59);

      label = 'Últimos 12 meses';
      for (let i = 11; i >= 0; i--) {
        const d = new Date(refAno, refMes - 1 - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      break;
    }
    case 'mes_atual':
    default: {
      const lastDay = new Date(refAno, refMes, 0).getDate();
      startDate = new Date(refAno, refMes - 1, 1, 0, 0, 0);
      endDate = new Date(refAno, refMes - 1, lastDay, 23, 59, 59);

      // Comparação com mês imediatamente anterior
      const prevDate = new Date(refAno, refMes - 2, 1);
      const prevAno = prevDate.getFullYear();
      const prevMes = prevDate.getMonth() + 1;
      const prevLastDay = new Date(prevAno, prevMes, 0).getDate();
      prevStartDate = new Date(prevAno, prevMes - 1, 1, 0, 0, 0);
      prevEndDate = new Date(prevAno, prevMes - 1, prevLastDay, 23, 59, 59);

      label = 'Mês selecionado';
      months.push(`${refAno}-${String(refMes).padStart(2, '0')}`);
      break;
    }
  }

  return {
    startDate,
    endDate,
    label,
    previousStartDate: prevStartDate,
    previousEndDate: prevEndDate,
    months,
  };
}

/**
 * Calcula a variação percentual segura entre dois valores em centavos (Regra 22).
 */
export function calculatePercentageChange(
  currentCentavos: number,
  previousCentavos: number
): number | null {
  if (previousCentavos === 0) {
    if (currentCentavos === 0) return 0;
    return null; // Sem base de comparação anterior
  }
  const diff = currentCentavos - previousCentavos;
  const pct = (diff / Math.abs(previousCentavos)) * 100;
  return Math.round(pct * 10) / 10; // 1 casa decimal
}

/**
 * Filtra lançamentos por período, regime e pessoa.
 */
export function filterTransactionsByPeriod(
  transactions: LancamentoFinanceiro[],
  startDate: Date,
  endDate: Date,
  regime: RegimeFinanceiro,
  filtroPessoa = 'todos'
): LancamentoFinanceiro[] {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  return transactions.filter((tx) => {
    // 1. Data conforme regime
    const dateTimestamp = regime === 'competencia' ? tx.dataCompetencia : tx.dataCaixa;
    if (!dateTimestamp) return false;
    const txMs = dateTimestamp.toDate().getTime();
    if (txMs < startMs || txMs > endMs) return false;

    // 2. Filtro de Pessoa
    if (filtroPessoa !== 'todos') {
      const isCompartilhado = !tx.donoId || tx.donoId === '';
      const isDono = tx.donoId === filtroPessoa;
      if (!isCompartilhado && !isDono) return false;
    }

    return true;
  });
}

/**
 * 1. calculateIncome: Soma das receitas válidas no período.
 * Transferências não entram.
 */
export function calculateIncome(transactions: LancamentoFinanceiro[]): number {
  return transactions
    .filter((tx) => tx.tipo === 'receita')
    .reduce((sum, tx) => sum + tx.valorCentavos, 0);
}

/**
 * 2. calculateExpenses: Soma das despesas que NÃO sejam investimentos.
 * Compras no cartão entram como despesa.
 * Transferências e pagamentos de fatura NÃO entram.
 */
export function calculateExpenses(
  transactions: LancamentoFinanceiro[],
  categoriesMap: Map<string, CategoriaPlano>
): number {
  return transactions
    .filter((tx) => {
      if (tx.tipo !== 'despesa') return false;
      const cat = tx.categoriaId ? categoriesMap.get(tx.categoriaId) : null;
      // Investimentos são contabilizados separadamente para não inflar consumo
      if (cat && cat.tipo === 'investimento') return false;
      return true;
    })
    .reduce((sum, tx) => sum + tx.valorCentavos, 0);
}

/**
 * 3. calculateInvestments: Soma das despesas classificadas como investimentos.
 */
export function calculateInvestments(
  transactions: LancamentoFinanceiro[],
  categoriesMap: Map<string, CategoriaPlano>
): number {
  return transactions
    .filter((tx) => {
      if (tx.tipo !== 'despesa') return false;
      const cat = tx.categoriaId ? categoriesMap.get(tx.categoriaId) : null;
      return cat?.tipo === 'investimento';
    })
    .reduce((sum, tx) => sum + tx.valorCentavos, 0);
}

/**
 * 4. calculateResult: Resultado financeiro = Receitas - Despesas - Investimentos (Regra 5).
 */
export function calculateResult(
  incomeCentavos: number,
  expensesCentavos: number,
  investmentsCentavos: number
): number {
  return incomeCentavos - expensesCentavos - investmentsCentavos;
}

/**
 * 5. calculateBalance: Saldo acumulado disponível das contas ativas do plano (Regra 6).
 */
export function calculateBalance(
  accounts: ContaPlano[],
  allTransactions: LancamentoFinanceiro[],
  regime: RegimeFinanceiro,
  filtroPessoa = 'todos'
): number {
  // Saldo inicial das contas ativas (respeitando filtro de pessoa se conta for individual)
  const activeAccounts = accounts.filter((acc) => {
    if (!acc.ativa) return false;
    if (filtroPessoa !== 'todos' && acc.donoId && acc.donoId !== filtroPessoa) {
      return false;
    }
    return true;
  });

  const totalInicial = activeAccounts.reduce((sum, a) => sum + (a.saldoInicialCentavos || 0), 0);
  const activeAccountIds = new Set(activeAccounts.map((a) => a.id));

  // Acumulado de todas as transações até hoje
  let saldo = totalInicial;

  allTransactions.forEach((tx) => {
    if (filtroPessoa !== 'todos') {
      const isCompartilhado = !tx.donoId || tx.donoId === '';
      const isDono = tx.donoId === filtroPessoa;
      if (!isCompartilhado && !isDono) return;
    }

    if (tx.tipo === 'receita') {
      if (activeAccountIds.has(tx.contaId)) {
        saldo += tx.valorCentavos;
      }
    } else if (tx.tipo === 'despesa') {
      // Se for despesa de conta bancária, reduz saldo da conta
      if (tx.contaId && activeAccountIds.has(tx.contaId)) {
        saldo -= tx.valorCentavos;
      }
    } else if (tx.tipo === 'transferencia') {
      // Se a conta de origem pertence ao conjunto, sai
      if (tx.contaId && activeAccountIds.has(tx.contaId)) {
        saldo -= tx.valorCentavos;
      }
      // Se a conta de destino pertence ao conjunto, entra
      if (tx.contaDestinoId && activeAccountIds.has(tx.contaDestinoId)) {
        saldo += tx.valorCentavos;
      }
    }
  });

  return saldo;
}

/**
 * 6. calculateExpensesByCategory: Agregação por categoria e por tipo de categoria.
 */
export function calculateExpensesByCategory(
  transactions: LancamentoFinanceiro[],
  categoriesMap: Map<string, CategoriaPlano>
): CategoryExpenseSummary[] {
  const expenseMap = new Map<string, number>();

  transactions.forEach((tx) => {
    if (tx.tipo !== 'despesa') return;
    const catId = tx.categoriaId || 'outros';
    const current = expenseMap.get(catId) || 0;
    expenseMap.set(catId, current + tx.valorCentavos);
  });

  const totalDespesas = Array.from(expenseMap.values()).reduce((sum, v) => sum + v, 0);

  const results: CategoryExpenseSummary[] = [];

  expenseMap.forEach((valorCentavos, catId) => {
    const cat = categoriesMap.get(catId);
    const categoryName = cat?.nome || 'Outras Despesas';
    const categoryType = cat?.tipo || 'custo_variavel';
    const color = cat?.cor || '#64748b';
    const icon = cat?.icone;
    const percentage = totalDespesas > 0 ? Math.round((valorCentavos / totalDespesas) * 1000) / 10 : 0;

    results.push({
      categoryId: catId,
      categoryName,
      categoryType,
      color,
      icon,
      totalCentavos: valorCentavos,
      percentage,
    });
  });

  // Ordena pelas maiores despesas
  return results.sort((a, b) => b.totalCentavos - a.totalCentavos);
}

/**
 * 7. calculateMonthlyEvolution: Evolução mensal para o Recharts (Receitas, Despesas, Resultado).
 */
export function calculateMonthlyEvolution(
  transactions: LancamentoFinanceiro[],
  months: string[], // ['2026-05', '2026-06', '2026-07'...]
  categoriesMap: Map<string, CategoriaPlano>,
  regime: RegimeFinanceiro,
  filtroPessoa = 'todos'
): MonthlyFinancialSummary[] {
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return months.map((monthStr) => {
    const [anoStr, mesStr] = monthStr.split('-');
    const ano = parseInt(anoStr, 10);
    const mesNum = parseInt(mesStr, 10);
    const label = `${nomesMeses[mesNum - 1]} ${String(ano).slice(2)}`;

    const lastDay = new Date(ano, mesNum, 0).getDate();
    const startDate = new Date(ano, mesNum - 1, 1, 0, 0, 0);
    const endDate = new Date(ano, mesNum - 1, lastDay, 23, 59, 59);

    const monthTxs = filterTransactionsByPeriod(
      transactions,
      startDate,
      endDate,
      regime,
      filtroPessoa
    );

    const income = calculateIncome(monthTxs);
    const expense = calculateExpenses(monthTxs, categoriesMap);
    const investment = calculateInvestments(monthTxs, categoriesMap);
    const result = calculateResult(income, expense, investment);

    return {
      month: monthStr,
      label,
      incomeCentavos: income,
      expenseCentavos: expense,
      investmentCentavos: investment,
      resultCentavos: result,
    };
  });
}

/**
 * 8. calculateExpensesByMember: Movimentação consolidada por pessoa (Regra 11).
 */
export function calculateExpensesByMember(
  transactions: LancamentoFinanceiro[],
  categoriesMap: Map<string, CategoriaPlano>,
  membro1Uid: string,
  membro1Nome: string,
  membro2Uid?: string,
  membro2Nome?: string
): MemberFinancialSummary[] {
  const members = [
    { uid: '', name: 'Compartilhado' },
    { uid: membro1Uid, name: membro1Nome },
  ];

  if (membro2Uid) {
    members.push({ uid: membro2Uid, name: membro2Nome || 'Pessoa 2' });
  }

  return members.map((m) => {
    const mTransactions = transactions.filter((tx) => (tx.donoId || '') === m.uid);
    const income = calculateIncome(mTransactions);
    const expense = calculateExpenses(mTransactions, categoriesMap);
    const investment = calculateInvestments(mTransactions, categoriesMap);

    return {
      uid: m.uid,
      name: m.name,
      incomeCentavos: income,
      expenseCentavos: expense,
      investmentCentavos: investment,
      netCentavos: income - expense - investment,
    };
  });
}

/**
 * 9. calculateCardSummary: Resumo e utilização de cada cartão para o Dashboard (Regra 12).
 */
export function calculateCardSummary(
  cards: CartaoCredito[],
  faturasMap: Map<string, FaturaCartao[]>
): CardDashboardSummary[] {
  return cards.map((card) => {
    const cardFaturas = faturasMap.get(card.id) || [];
    const limiteCentavos = card.limiteCentavos || 0;

    // Limite utilizado soma todas as faturas não pagas
    const utilizadoCentavos = cardFaturas.reduce((sum, f) => {
      if (f.status === 'paga') return sum;
      const pendente = Math.max(0, f.valorTotalCentavos - (f.valorPagoCentavos || 0));
      return sum + pendente;
    }, 0);

    const disponivelCentavos = Math.max(0, limiteCentavos - utilizadoCentavos);
    const percentualUtilizado =
      limiteCentavos > 0 ? Math.min(100, Math.round((utilizadoCentavos / limiteCentavos) * 100)) : 0;

    // Próxima fatura aberta ou fechada
    const faturasNaoPagas = cardFaturas
      .filter((f) => f.status !== 'paga')
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

    const proxima = faturasNaoPagas[0];

    return {
      cardId: card.id,
      name: card.nome,
      bandeira: card.bandeira,
      ultimos4: card.ultimos4,
      limiteCentavos,
      utilizadoCentavos,
      disponivelCentavos,
      percentualUtilizado,
      proximaFaturaMes: proxima?.mesReferencia,
      proximaFaturaValorCentavos: proxima
        ? Math.max(0, proxima.valorTotalCentavos - (proxima.valorPagoCentavos || 0))
        : 0,
      proximaFaturaVencimento: proxima?.dataVencimento,
    };
  });
}

/**
 * 10. calculateUpcomingInvoices: Próximas faturas ordenadas por vencimento (Regra 13).
 */
export function calculateUpcomingInvoices(
  cards: CartaoCredito[],
  faturasMap: Map<string, FaturaCartao[]>
): UpcomingInvoiceSummary[] {
  const cardsMap = new Map<string, CartaoCredito>();
  cards.forEach((c) => cardsMap.set(c.id, c));

  const list: UpcomingInvoiceSummary[] = [];
  const hojeStr = new Date().toISOString().split('T')[0];

  faturasMap.forEach((faturas, cardId) => {
    const card = cardsMap.get(cardId);
    if (!card) return;

    faturas.forEach((f) => {
      // Ignora faturas já 100% quitadas
      if (f.status === 'paga') return;

      const valorPendente = Math.max(0, f.valorTotalCentavos - (f.valorPagoCentavos || 0));
      if (valorPendente <= 0) return;

      const isVencida = f.status === 'vencida' || hojeStr > f.dataVencimento;

      list.push({
        faturaId: f.id,
        cartaoId: card.id,
        cartaoNome: card.nome,
        mesReferencia: f.mesReferencia,
        valorCentavos: valorPendente,
        vencimento: f.dataVencimento,
        status: isVencida ? 'vencida' : f.status,
        isVencida,
      });
    });
  });

  // Ordena por vencimento mais próximo
  return list.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}
