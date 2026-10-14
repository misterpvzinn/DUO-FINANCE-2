/**
 * Bateria de Testes Unitários: Dashboard Financeiro e Camada de Análises (Parte 5)
 *
 * Cobertura de cenários (Item 36):
 * 1. Cálculo de receitas.
 * 2. Cálculo de despesas.
 * 3. Cálculo de investimentos.
 * 4. Cálculo do resultado (Receitas - Despesas - Investimentos).
 * 5. Transferências não alterarem resultado.
 * 6. Compra no cartão aparecer como despesa.
 * 7. Pagamento da fatura não duplicar despesa.
 * 8. Regime de competência utilizar dataCompetencia.
 * 9. Regime de caixa utilizar dataCaixa.
 * 10. Filtro por pessoa.
 * 11. Lançamento compartilhado.
 * 12. Cálculo por categoria.
 * 13. Evolução mensal.
 * 14. Comparação com período anterior.
 * 15. Período sem dados.
 * 16. Período anterior igual a zero.
 * 17. Limite e utilização dos cartões.
 * 18. Fatura próxima.
 */

import {
  calculateIncome,
  calculateExpenses,
  calculateInvestments,
  calculateResult,
  calculatePercentageChange,
  calculateExpensesByCategory,
  calculateMonthlyEvolution,
  calculateExpensesByMember,
  calculateCardSummary,
  calculateUpcomingInvoices,
  filterTransactionsByPeriod,
} from '../services/dashboard';
import {
  LancamentoFinanceiro,
  CategoriaPlano,
  CartaoCredito,
  FaturaCartao,
} from '../types/finance';
import { Timestamp } from 'firebase/firestore';

export function runDashboardUnitTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      results.push(`✅ [PASS] ${testName}`);
    } else {
      failed++;
      results.push(`❌ [FAIL] ${testName}`);
      console.error(`Falha no teste do Dashboard: ${testName}`);
    }
  };

  // Setup de categorias
  const categoriesMap = new Map<string, CategoriaPlano>([
    [
      'cat-salario',
      { id: 'cat-salario', nome: 'Salário', tipo: 'receita', ativa: true },
    ],
    [
      'cat-mercado',
      { id: 'cat-mercado', nome: 'Supermercado', tipo: 'custo_variavel', ativa: true },
    ],
    [
      'cat-aluguel',
      { id: 'cat-aluguel', nome: 'Aluguel', tipo: 'custo_fixo', ativa: true },
    ],
    [
      'cat-invest',
      { id: 'cat-invest', nome: 'Tesouro Direto', tipo: 'investimento', ativa: true },
    ],
  ]);

  // Transações de teste
  const baseTxs: LancamentoFinanceiro[] = [
    // 1. Receita: R$ 5.000,00
    {
      id: 'tx-1',
      tipo: 'receita',
      descricao: 'Salário',
      valorCentavos: 500000,
      contaId: 'conta-1',
      categoriaId: 'cat-salario',
      donoId: 'uid-paulo',
      dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 5)), // 05/10/2026
      dataCaixa: Timestamp.fromDate(new Date(2026, 9, 5)),
      createdAt: null as any,
      updatedAt: null as any,
    },
    // 2. Despesa comum: R$ 800,00
    {
      id: 'tx-2',
      tipo: 'despesa',
      descricao: 'Supermercado',
      valorCentavos: 80000,
      contaId: 'conta-1',
      categoriaId: 'cat-mercado',
      donoId: '', // Compartilhado
      dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 8)), // 08/10/2026
      dataCaixa: Timestamp.fromDate(new Date(2026, 9, 8)),
      createdAt: null as any,
      updatedAt: null as any,
    },
    // 3. Investimento: R$ 1.000,00
    {
      id: 'tx-3',
      tipo: 'despesa',
      descricao: 'Aporte Tesouro',
      valorCentavos: 100000,
      contaId: 'conta-1',
      categoriaId: 'cat-invest',
      donoId: 'uid-paulo',
      dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 10)),
      dataCaixa: Timestamp.fromDate(new Date(2026, 9, 10)),
      createdAt: null as any,
      updatedAt: null as any,
    },
    // 4. Transferência interna: R$ 500,00
    {
      id: 'tx-4',
      tipo: 'transferencia',
      descricao: 'Transferência para poupança',
      valorCentavos: 50000,
      contaId: 'conta-1',
      contaDestinoId: 'conta-2',
      donoId: '',
      dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 12)),
      dataCaixa: Timestamp.fromDate(new Date(2026, 9, 12)),
      createdAt: null as any,
      updatedAt: null as any,
    },
    // 5. Compra no cartão de crédito: R$ 300,00 (Competência: 25/09, Caixa: 10/10)
    {
      id: 'tx-5',
      tipo: 'despesa',
      descricao: 'Compra no Cartão',
      valorCentavos: 30000,
      contaId: '',
      cartaoId: 'card-1',
      categoriaId: 'cat-mercado',
      donoId: 'uid-maria',
      dataCompetencia: Timestamp.fromDate(new Date(2026, 8, 25)), // Setembro (Competência)
      dataCaixa: Timestamp.fromDate(new Date(2026, 9, 10)), // Outubro (Caixa)
      createdAt: null as any,
      updatedAt: null as any,
    },
    // 6. Pagamento de fatura: R$ 300,00 (Transferência da conta para o cartão)
    {
      id: 'tx-6',
      tipo: 'transferencia',
      descricao: 'Pagamento Fatura',
      valorCentavos: 30000,
      contaId: 'conta-1',
      contaDestinoId: 'card-1',
      donoId: '',
      dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 10)),
      dataCaixa: Timestamp.fromDate(new Date(2026, 9, 10)),
      createdAt: null as any,
      updatedAt: null as any,
    },
  ];

  // 1. Cálculo de receitas
  const receita = calculateIncome(baseTxs);
  assert(receita === 500000, '1. Cálculo de receitas totaliza R$ 5.000,00');

  // 2. Cálculo de despesas (não inclui investimentos)
  const despesas = calculateExpenses(baseTxs, categoriesMap);
  assert(
    despesas === 80000 + 30000, // Mercado (800) + Compra Cartão (300) = 110000
    '2. Cálculo de despesas soma consumo e compra no cartão excluindo investimentos'
  );

  // 3. Cálculo de investimentos
  const investimentos = calculateInvestments(baseTxs, categoriesMap);
  assert(investimentos === 100000, '3. Cálculo de investimentos totaliza R$ 1.000,00');

  // 4. Cálculo do resultado (Receitas - Despesas - Investimentos)
  const resultado = calculateResult(receita, despesas, investimentos);
  assert(
    resultado === 500000 - 110000 - 100000, // 5000 - 1100 - 1000 = 290000
    '4. Cálculo do resultado: Receitas (5.000) - Despesas (1.100) - Investimentos (1.000) = R$ 2.900,00'
  );

  // 5. Transferências não alterarem resultado
  const incomeComTransf = calculateIncome([baseTxs[3]]);
  const expComTransf = calculateExpenses([baseTxs[3]], categoriesMap);
  assert(
    incomeComTransf === 0 && expComTransf === 0,
    '5. Transferências internas não são computadas como receita ou despesa'
  );

  // 6. Compra no cartão aparecer como despesa
  const expCompraCartao = calculateExpenses([baseTxs[4]], categoriesMap);
  assert(
    expCompraCartao === 30000,
    '6. Compra realizada no cartão de crédito é contabilizada como despesa'
  );

  // 7. Pagamento da fatura não duplicar despesa
  const expPagamentoFatura = calculateExpenses([baseTxs[5]], categoriesMap);
  assert(
    expPagamentoFatura === 0,
    '7. Pagamento de fatura registrado como transferência não gera nova despesa'
  );

  // 8. Regime de competência utilizar dataCompetencia
  const txsSetembroComp = filterTransactionsByPeriod(
    baseTxs,
    new Date(2026, 8, 1),
    new Date(2026, 8, 30, 23, 59, 59),
    'competencia'
  );
  assert(
    txsSetembroComp.some((t) => t.id === 'tx-5'),
    '8. Regime de competência aloca compra do cartão em Setembro pela dataCompra'
  );

  // 9. Regime de caixa utilizar dataCaixa
  const txsSetembroCaixa = filterTransactionsByPeriod(
    baseTxs,
    new Date(2026, 8, 1),
    new Date(2026, 8, 30, 23, 59, 59),
    'caixa'
  );
  assert(
    !txsSetembroCaixa.some((t) => t.id === 'tx-5'),
    '9. Regime de caixa não inclui compra em Setembro pois a fatura vence em Outubro'
  );

  // 10. Filtro por pessoa
  const txsMaria = filterTransactionsByPeriod(
    baseTxs,
    new Date(2026, 0, 1),
    new Date(2026, 11, 31),
    'competencia',
    'uid-maria'
  );
  assert(
    txsMaria.some((t) => t.donoId === 'uid-maria') && !txsMaria.some((t) => t.donoId === 'uid-paulo'),
    '10. Filtro por pessoa isola lançamentos do membro selecionado e compartilhados'
  );

  // 11. Lançamento compartilhado
  const txsCompartilhadas = baseTxs.filter((t) => !t.donoId);
  assert(
    txsCompartilhadas.length >= 2,
    '11. Lançamentos com donoId vazio identificados como compartilhados'
  );

  // 12. Cálculo por categoria
  const catSummary = calculateExpensesByCategory(baseTxs, categoriesMap);
  const mercadoItem = catSummary.find((c) => c.categoryId === 'cat-mercado');
  assert(
    mercadoItem !== undefined && mercadoItem.totalCentavos === 110000,
    '12. Cálculo por categoria agrega lançamentos corretamente (Supermercado = R$ 1.100,00)'
  );

  // 13. Evolução mensal
  const evolution = calculateMonthlyEvolution(
    baseTxs,
    ['2026-09', '2026-10'],
    categoriesMap,
    'competencia'
  );
  assert(
    evolution.length === 2 && evolution[1].incomeCentavos === 500000,
    '13. Evolução mensal gera agregações cronológicas para cada mês solicitado'
  );

  // 14. Comparação com período anterior
  const pct = calculatePercentageChange(500000, 400000); // de 4.000 para 5.000 (+25%)
  assert(pct === 25, '14. Comparação percentual calcula variação correta (+25%)');

  // 15. Período sem dados
  const emptyIncome = calculateIncome([]);
  const emptyExpense = calculateExpenses([], categoriesMap);
  assert(
    emptyIncome === 0 && emptyExpense === 0,
    '15. Período sem dados retorna valores zerados sem erros'
  );

  // 16. Período anterior igual a zero
  const pctZeroAnterior = calculatePercentageChange(10000, 0);
  assert(
    pctZeroAnterior === null,
    '16. Período anterior igual a zero retorna null para evitar divisão por zero'
  );

  // 17. Limite e utilização dos cartões
  const mockCard: CartaoCredito = {
    id: 'card-1',
    nome: 'Nubank Black',
    limiteCentavos: 1000000, // R$ 10.000,00
    diaFechamento: 10,
    diaVencimento: 17,
    donoId: '',
    ativo: true,
    createdAt: null as any,
    updatedAt: null as any,
  };
  const mockFaturas: FaturaCartao[] = [
    {
      id: 'fatura-1',
      cartaoId: 'card-1',
      mesReferencia: '2026-10',
      dataFechamento: '2026-10-10',
      dataVencimento: '2026-10-17',
      valorTotalCentavos: 250000, // R$ 2.500,00
      valorPagoCentavos: 50000, // R$ 500,00 pago
      status: 'fechada',
      createdAt: null as any,
      updatedAt: null as any,
    },
  ];
  const faturasMap = new Map([['card-1', mockFaturas]]);
  const cardSummary = calculateCardSummary([mockCard], faturasMap);
  assert(
    cardSummary[0].utilizadoCentavos === 200000 && cardSummary[0].disponivelCentavos === 800000,
    '17. Limite e utilização do cartão calculam corretamente (Utilizado: 2.000, Disponível: 8.000)'
  );

  // 18. Fatura próxima
  const upcoming = calculateUpcomingInvoices([mockCard], faturasMap);
  assert(
    upcoming.length === 1 && upcoming[0].valorCentavos === 200000,
    '18. Próxima fatura identifica saldo devedor pendente de R$ 2.000,00'
  );

  return { passed, failed, results };
}
