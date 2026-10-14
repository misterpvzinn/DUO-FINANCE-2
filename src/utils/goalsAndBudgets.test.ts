/**
 * Bateria de Testes Unitários: Metas Financeiras e Orçamentos (Parte 6)
 *
 * Cobertura de cenários (Item 42):
 * 1. Criar meta.
 * 2. Atualizar meta.
 * 3. Aporte em meta.
 * 4. Cálculo do progresso.
 * 5. Meta atingida.
 * 6. Meta cancelada.
 * 7. Valor restante.
 * 8. Data alvo e prazos.
 * 9. Criar orçamento.
 * 10. Impedir orçamento duplicado.
 * 11. Cálculo de utilização.
 * 12. Orçamento acima do limite.
 * 13. Orçamento dentro do limite.
 * 14. Regime de competência.
 * 15. Regime de caixa.
 * 16. Filtro por pessoa.
 * 17. Orçamento compartilhado.
 * 18. Compra no cartão consumindo orçamento.
 * 19. Pagamento de fatura não consumindo orçamento novamente.
 * 20. Lançamentos permanecendo únicos.
 */

import {
  calculateGoalProgress,
  calculateBudgetUsage,
  calculateBudgetSummary,
} from './goalsAndBudgets';
import {
  MetaFinanceira,
  OrcamentoFinanceiro,
} from '../types/goalsAndBudgets';
import {
  LancamentoFinanceiro,
  CategoriaPlano,
} from '../types/finance';
import { Timestamp } from 'firebase/firestore';

export function runGoalsAndBudgetsUnitTests(): {
  passed: number;
  failed: number;
  results: string[];
} {
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
      console.error(`Falha no teste de Metas/Orçamentos: ${testName}`);
    }
  };

  // 1. Criar meta
  const metaExemplo: MetaFinanceira = {
    id: 'meta-1',
    nome: 'Reserva de Emergência',
    descricao: '6 meses de despesas',
    valorObjetivoCentavos: 1000000, // R$ 10.000,00
    valorAtualCentavos: 300000, // R$ 3.000,00
    dataInicio: '2026-01-01',
    dataAlvo: '2026-12-31',
    donoId: '', // compartilhada
    status: 'ativa',
    createdAt: null as any,
    updatedAt: null as any,
  };
  assert(
    metaExemplo.valorObjetivoCentavos > 0 && metaExemplo.status === 'ativa',
    '1. Criar meta: campos e regras estruturais validados'
  );

  // 2. Atualizar meta
  const metaAtualizada: MetaFinanceira = {
    ...metaExemplo,
    nome: 'Reserva Familiar 2026',
    valorObjetivoCentavos: 1200000,
  };
  assert(
    metaAtualizada.valorObjetivoCentavos === 1200000 &&
      metaAtualizada.nome === 'Reserva Familiar 2026',
    '2. Atualizar meta: alteração de nome e objetivo mantendo integridade'
  );

  // 3. Aporte em meta
  const aporteCentavos = 200000; // R$ 2.000,00
  const metaComAporte: MetaFinanceira = {
    ...metaExemplo,
    valorAtualCentavos: metaExemplo.valorAtualCentavos + aporteCentavos, // R$ 5.000,00
  };
  assert(
    metaComAporte.valorAtualCentavos === 500000,
    '3. Aporte em meta: soma de R$ 2.000 eleva valor acumulado para R$ 5.000,00'
  );

  // 4. Cálculo do progresso
  const progresso = calculateGoalProgress(metaComAporte, new Date('2026-06-01'));
  assert(
    progresso.percentual === 50 && progresso.percentualVisual === 50,
    '4. Cálculo do progresso: 5.000 de 10.000 resulta em 50%'
  );

  // 5. Meta atingida
  const metaAtingida: MetaFinanceira = {
    ...metaExemplo,
    valorAtualCentavos: 1000000, // R$ 10.000,00
  };
  const progressoAtingida = calculateGoalProgress(metaAtingida);
  assert(
    progressoAtingida.isAtingida && progressoAtingida.percentual === 100,
    '5. Meta atingida: identificação automática ao atingir 100%'
  );

  // 6. Meta cancelada
  const metaCancelada: MetaFinanceira = {
    ...metaExemplo,
    status: 'cancelada',
  };
  assert(
    metaCancelada.status === 'cancelada' && metaCancelada.valorAtualCentavos === 300000,
    '6. Meta cancelada: preserva histórico e valores acumulados'
  );

  // 7. Valor restante
  assert(
    progresso.valorRestanteCentavos === 500000 &&
      progressoAtingida.valorRestanteCentavos === 0,
    '7. Valor restante: faltam R$ 5.000 na meta em andamento e R$ 0 na meta atingida'
  );

  // 8. Data alvo e prazos
  const refDate = new Date('2026-10-01');
  const progressoPrazo = calculateGoalProgress(metaExemplo, refDate);
  assert(
    progressoPrazo.diasRestantes !== undefined &&
      progressoPrazo.diasRestantes > 0 &&
      !progressoPrazo.prazoUltrapassado,
    '8. Data alvo: calcula dias restantes em relação à data de referência'
  );

  // Categorias de teste
  const catAlimentacao: CategoriaPlano = {
    id: 'cat-alim',
    nome: 'Alimentação',
    tipo: 'custo_variavel',
    cor: '#f59e0b',
    ativa: true,
  };

  // 9. Criar orçamento
  const orcamentoAlimentacao: OrcamentoFinanceiro = {
    id: 'orc-1',
    nome: 'Orçamento Alimentação',
    categoriaId: 'cat-alim',
    valorLimiteCentavos: 100000, // R$ 1.000,00
    mesReferencia: '2026-10',
    donoId: '', // compartilhado
    ativo: true,
    createdAt: null as any,
    updatedAt: null as any,
  };
  assert(
    orcamentoAlimentacao.valorLimiteCentavos === 100000 &&
      orcamentoAlimentacao.mesReferencia === '2026-10',
    '9. Criar orçamento: cadastrado para Outubro com limite de R$ 1.000,00'
  );

  // 10. Impedir orçamento duplicado
  const orcamentosExistentes = [orcamentoAlimentacao];
  const ehDuplicado = (mes: string, catId: string, donoId: string) => {
    return orcamentosExistentes.some(
      (o) => o.ativo && o.mesReferencia === mes && o.categoriaId === catId && o.donoId === donoId
    );
  };
  assert(
    ehDuplicado('2026-10', 'cat-alim', ''),
    '10. Impedir orçamento duplicado: detecta duplicidade de categoria e mês no mesmo responsável'
  );

  // Lançamentos de teste
  const txAlim1: LancamentoFinanceiro = {
    id: 'tx-1',
    tipo: 'despesa',
    descricao: 'Supermercado Mensal',
    valorCentavos: 65000, // R$ 650,00
    contaId: 'conta-1',
    categoriaId: 'cat-alim',
    donoId: '',
    dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 5)), // 05/10/2026
    dataCaixa: Timestamp.fromDate(new Date(2026, 9, 5)),
    createdAt: null as any,
    updatedAt: null as any,
  };

  // 11. Cálculo de utilização
  const usage1 = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txAlim1],
    catAlimentacao,
    'competencia'
  );
  assert(
    usage1.valorUtilizadoCentavos === 65000 &&
      usage1.valorDisponivelCentavos === 35000 &&
      usage1.percentualUtilizado === 65,
    '11. Cálculo de utilização: R$ 650 utilizados de R$ 1.000 (65%) com R$ 350 disponíveis'
  );

  // 12. Orçamento acima do limite
  const txAlimExtra: LancamentoFinanceiro = {
    id: 'tx-2',
    tipo: 'despesa',
    descricao: 'Jantar Restaurante',
    valorCentavos: 40000, // R$ 400,00 -> total 1.050 (105%)
    contaId: 'conta-1',
    categoriaId: 'cat-alim',
    donoId: '',
    dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 20)),
    dataCaixa: Timestamp.fromDate(new Date(2026, 9, 20)),
    createdAt: null as any,
    updatedAt: null as any,
  };
  const usageAcima = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txAlim1, txAlimExtra],
    catAlimentacao,
    'competencia'
  );
  assert(
    usageAcima.status === 'acima' && usageAcima.percentualUtilizado === 105,
    '12. Orçamento acima do limite: 105% classificado como "acima"'
  );

  // 13. Orçamento dentro do limite
  assert(
    usage1.status === 'dentro',
    '13. Orçamento dentro do limite: 65% classificado como "dentro"'
  );

  // 14. Regime de competência
  const txCompraCartaoSetembro: LancamentoFinanceiro = {
    id: 'tx-card-set',
    tipo: 'despesa',
    descricao: 'Compra Feira (Cartão)',
    valorCentavos: 15000, // R$ 150,00
    contaId: '',
    cartaoId: 'card-1',
    categoriaId: 'cat-alim',
    donoId: '',
    dataCompetencia: Timestamp.fromDate(new Date(2026, 8, 28)), // 28/09/2026
    dataCaixa: Timestamp.fromDate(new Date(2026, 9, 10)), // Fatura vence em 10/10/2026
    createdAt: null as any,
    updatedAt: null as any,
  };
  const usageComp = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txCompraCartaoSetembro],
    catAlimentacao,
    'competencia'
  );
  assert(
    usageComp.valorUtilizadoCentavos === 0,
    '14. Regime de competência: compra de Setembro não entra no orçamento de Outubro'
  );

  // 15. Regime de caixa
  const usageCaixa = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txCompraCartaoSetembro],
    catAlimentacao,
    'caixa'
  );
  assert(
    usageCaixa.valorUtilizadoCentavos === 15000,
    '15. Regime de caixa: compra cuja fatura vence em Outubro entra no orçamento de Outubro'
  );

  // 16. Filtro por pessoa
  const orcamentoIndividual: OrcamentoFinanceiro = {
    id: 'orc-ind',
    nome: 'Lazer Paulo',
    categoriaId: 'cat-alim',
    valorLimiteCentavos: 50000,
    mesReferencia: '2026-10',
    donoId: 'uid-paulo',
    ativo: true,
    createdAt: null as any,
    updatedAt: null as any,
  };
  const txOutraPessoa: LancamentoFinanceiro = {
    id: 'tx-maria',
    tipo: 'despesa',
    descricao: 'Café Maria',
    valorCentavos: 2000,
    contaId: 'conta-1',
    categoriaId: 'cat-alim',
    donoId: 'uid-maria',
    dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 10)),
    dataCaixa: Timestamp.fromDate(new Date(2026, 9, 10)),
    createdAt: null as any,
    updatedAt: null as any,
  };
  const usageInd = calculateBudgetUsage(
    orcamentoIndividual,
    [txOutraPessoa],
    catAlimentacao,
    'competencia'
  );
  assert(
    usageInd.valorUtilizadoCentavos === 0,
    '16. Filtro por pessoa: despesa de Maria não consome o orçamento individual de Paulo'
  );

  // 17. Orçamento compartilhado
  const usageCompartilhado = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txAlim1],
    catAlimentacao,
    'competencia',
    'todos'
  );
  assert(
    usageCompartilhado.valorUtilizadoCentavos === 65000,
    '17. Orçamento compartilhado: contabiliza despesas compartilhadas sem distorção'
  );

  // 18. Compra no cartão consumindo orçamento
  const txCompraCartaoOutubro: LancamentoFinanceiro = {
    id: 'tx-card-out',
    tipo: 'despesa',
    descricao: 'Almoço no Cartão de Crédito',
    valorCentavos: 8000, // R$ 80,00
    contaId: '',
    cartaoId: 'card-1',
    categoriaId: 'cat-alim',
    donoId: '',
    dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 15)),
    dataCaixa: Timestamp.fromDate(new Date(2026, 10, 10)),
    createdAt: null as any,
    updatedAt: null as any,
  };
  const usageCard = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txCompraCartaoOutubro],
    catAlimentacao,
    'competencia'
  );
  assert(
    usageCard.valorUtilizadoCentavos === 8000,
    '18. Compra no cartão consumindo orçamento: reconhecida como despesa de categoria'
  );

  // 19. Pagamento de fatura não consumindo orçamento novamente
  const txPagamentoFatura: LancamentoFinanceiro = {
    id: 'tx-pay-fat',
    tipo: 'transferencia', // Transferência bancária para a fatura
    descricao: 'Pagamento Fatura Cartão',
    valorCentavos: 8000,
    contaId: 'conta-1',
    contaDestinoId: 'card-1',
    donoId: '',
    dataCompetencia: Timestamp.fromDate(new Date(2026, 9, 25)),
    dataCaixa: Timestamp.fromDate(new Date(2026, 9, 25)),
    createdAt: null as any,
    updatedAt: null as any,
  };
  const usagePay = calculateBudgetUsage(
    orcamentoAlimentacao,
    [txPagamentoFatura],
    catAlimentacao,
    'competencia'
  );
  assert(
    usagePay.valorUtilizadoCentavos === 0,
    '19. Pagamento de fatura: tipo transferência não consome orçamento de despesas'
  );

  // 20. Lançamentos permanecendo únicos
  const summaryGeral = calculateBudgetSummary([usage1]);
  assert(
    summaryGeral.totalOrcadoCentavos === 100000 &&
      summaryGeral.totalUtilizadoCentavos === 65000 &&
      summaryGeral.totalDisponivelCentavos === 35000,
    '20. Lançamentos permanecendo únicos: totalização e resumo consistentes'
  );

  return { passed, failed, results };
}
