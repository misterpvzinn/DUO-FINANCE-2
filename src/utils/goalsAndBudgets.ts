import {
  MetaFinanceira,
  OrcamentoFinanceiro,
  GoalProgress,
  BudgetUsage,
  BudgetSummary,
} from '../types/goalsAndBudgets';
import {
  LancamentoFinanceiro,
  CategoriaPlano,
  RegimeFinanceiro,
} from '../types/finance';

/**
 * Calcula o progresso, valor restante e prazos de uma Meta Financeira (Regras 7, 8 e 9).
 */
export function calculateGoalProgress(
  meta: MetaFinanceira,
  referenceDate: Date = new Date()
): GoalProgress {
  const objetivo = meta.valorObjetivoCentavos || 0;
  const atual = meta.valorAtualCentavos || 0;

  const percentual =
    objetivo > 0 ? Math.round((atual / objetivo) * 1000) / 10 : 0;
  const percentualVisual = Math.min(100, Math.max(0, percentual));
  const valorRestanteCentavos = Math.max(0, objetivo - atual);
  const isAtingida = atual >= objetivo;

  let diasRestantes: number | undefined;
  let prazoUltrapassado: boolean | undefined;

  if (meta.dataAlvo) {
    const alvoDate = new Date(`${meta.dataAlvo}T23:59:59`);
    const diffMs = alvoDate.getTime() - referenceDate.getTime();
    diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    prazoUltrapassado = diasRestantes < 0 && !isAtingida;
  }

  return {
    percentual,
    percentualVisual,
    valorRestanteCentavos,
    isAtingida,
    diasRestantes,
    prazoUltrapassado,
  };
}

/**
 * Calcula a utilização de um Orçamento Financeiro em relação aos lançamentos reais (Regras 19 a 23).
 * - Considera apenas despesas da categoria associada
 * - Respeita regime de competência (dataCompetencia) vs caixa (dataCaixa)
 * - Compras no cartão entram (já são despesas com categoria)
 * - Pagamentos de fatura não entram (são transferências)
 * - Não permite duplicidade
 */
export function calculateBudgetUsage(
  orcamento: OrcamentoFinanceiro,
  transactions: LancamentoFinanceiro[],
  categoria?: CategoriaPlano,
  regime: RegimeFinanceiro = 'competencia',
  filtroPessoa = 'todos'
): BudgetUsage {
  const mesAlvo = orcamento.mesReferencia; // "YYYY-MM"

  const matchingTransactions = transactions.filter((tx) => {
    // 1. Apenas tipo 'despesa'
    if (tx.tipo !== 'despesa') return false;

    // 2. Mesma categoria
    if (tx.categoriaId !== orcamento.categoriaId) return false;

    // 3. Data conforme o regime selecionado
    const timestamp =
      regime === 'competencia' ? tx.dataCompetencia : tx.dataCaixa;
    if (!timestamp) return false;

    const txDate = timestamp.toDate();
    const ano = txDate.getFullYear();
    const mes = String(txDate.getMonth() + 1).padStart(2, '0');
    const txMesRef = `${ano}-${mes}`;
    if (txMesRef !== mesAlvo) return false;

    // 4. Filtro de Responsável pelo orçamento
    if (orcamento.donoId) {
      // Orçamento individual: soma somente despesas daquele membro
      if (tx.donoId !== orcamento.donoId) return false;
    } else {
      // Orçamento compartilhado: se filtro global estiver ativo para um membro,
      // respeita despesas compartilhadas ou daquele membro
      if (filtroPessoa !== 'todos') {
        const isCompartilhado = !tx.donoId || tx.donoId === '';
        const isDono = tx.donoId === filtroPessoa;
        if (!isCompartilhado && !isDono) return false;
      }
    }

    return true;
  });

  const valorUtilizadoCentavos = matchingTransactions.reduce(
    (sum, tx) => sum + tx.valorCentavos,
    0
  );

  const limite = orcamento.valorLimiteCentavos || 0;
  const valorDisponivelCentavos = Math.max(0, limite - valorUtilizadoCentavos);
  const percentualUtilizado =
    limite > 0 ? Math.round((valorUtilizadoCentavos / limite) * 1000) / 10 : 0;

  // Status objetivo (Regra 23)
  let status: 'dentro' | 'proximo' | 'acima' = 'dentro';
  if (percentualUtilizado >= 100) {
    status = 'acima';
  } else if (percentualUtilizado >= 80) {
    status = 'proximo';
  }

  return {
    orcamentoId: orcamento.id,
    nome: orcamento.nome,
    categoriaId: orcamento.categoriaId,
    categoriaNome: categoria?.nome || orcamento.nome,
    categoriaCor: categoria?.cor || '#64748b',
    valorLimiteCentavos: limite,
    valorUtilizadoCentavos,
    valorDisponivelCentavos,
    percentualUtilizado,
    status,
    donoId: orcamento.donoId,
  };
}

/**
 * Consolida o resumo geral de todos os orçamentos do mês (Regra 27).
 */
export function calculateBudgetSummary(
  usages: BudgetUsage[]
): BudgetSummary {
  let totalOrcadoCentavos = 0;
  let totalUtilizadoCentavos = 0;
  let quantidadeAcimaLimite = 0;

  usages.forEach((u) => {
    totalOrcadoCentavos += u.valorLimiteCentavos;
    totalUtilizadoCentavos += u.valorUtilizadoCentavos;
    if (u.status === 'acima') {
      quantidadeAcimaLimite++;
    }
  });

  const totalDisponivelCentavos = Math.max(
    0,
    totalOrcadoCentavos - totalUtilizadoCentavos
  );

  return {
    totalOrcadoCentavos,
    totalUtilizadoCentavos,
    totalDisponivelCentavos,
    quantidadeAcimaLimite,
  };
}
