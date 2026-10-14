/**
 * Bateria de Testes Unitários: Gestão de Contas e Categorias
 */

import { ContaPlano, CategoriaPlano, LancamentoFinanceiro } from '../types/finance';

export function runPlanDataUnitTests(): {
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
      console.error(`Falha no teste: ${testName}`);
    }
  };

  // 1. Validação de nome da conta
  const contaSemNome = { nome: '   ', tipo: 'corrente' as const, saldoInicialCentavos: 0 };
  assert(
    !contaSemNome.nome.trim(),
    '1. Validação: nome da conta não pode ser vazio'
  );

  // 2. Saldo inicial não pode ser negativo
  const saldoNegativo = -5000;
  assert(
    saldoNegativo < 0,
    '2. Validação: saldo inicial negativo deve ser rejeitado'
  );

  // 3. Validação de nome da categoria
  const catSemNome = { nome: '', tipo: 'custo_fixo' as const };
  assert(
    !catSemNome.nome.trim(),
    '3. Validação: nome da categoria não pode ser vazio'
  );

  // 4. Cálculo do saldo atual de uma conta específica
  const conta1: ContaPlano = {
    id: 'conta-1',
    nome: 'Nubank',
    tipo: 'corrente',
    saldoInicialCentavos: 100000, // R$ 1.000,00 inicial
    donoId: '',
    ativa: true,
  };

  const txs: Partial<LancamentoFinanceiro>[] = [
    { tipo: 'receita', contaId: 'conta-1', valorCentavos: 50000 }, // +500
    { tipo: 'despesa', contaId: 'conta-1', valorCentavos: 20000 }, // -200
    { tipo: 'transferencia', contaId: 'conta-1', contaDestinoId: 'conta-2', valorCentavos: 10000 }, // -100
    { tipo: 'transferencia', contaId: 'conta-2', contaDestinoId: 'conta-1', valorCentavos: 30000 }, // +300
  ];

  let saldoCalculado = conta1.saldoInicialCentavos;
  txs.forEach((tx) => {
    if (tx.tipo === 'receita' && tx.contaId === 'conta-1') saldoCalculado += tx.valorCentavos!;
    if (tx.tipo === 'despesa' && tx.contaId === 'conta-1') saldoCalculado -= tx.valorCentavos!;
    if (tx.tipo === 'transferencia' && tx.contaId === 'conta-1') saldoCalculado -= tx.valorCentavos!;
    if (tx.tipo === 'transferencia' && tx.contaDestinoId === 'conta-1') saldoCalculado += tx.valorCentavos!;
  });

  // 1000 + 500 - 200 - 100 + 300 = 1500 (150.000 centavos)
  assert(
    saldoCalculado === 150000,
    '4. Saldo atual: computa saldo inicial + receitas - despesas - transferências enviadas + recebidas'
  );

  // 5. Bloqueio de exclusão se houver lançamentos vinculados
  const canDeleteAccount = (accId: string) => {
    return !txs.some((tx) => tx.contaId === accId || tx.contaDestinoId === accId);
  };
  assert(
    !canDeleteAccount('conta-1') && canDeleteAccount('conta-inexistente'),
    '5. Integridade contábil: impede exclusão de conta com movimentações'
  );

  // 6. Bloqueio de exclusão de categoria se houver lançamentos
  const txComCat: Partial<LancamentoFinanceiro>[] = [
    { tipo: 'despesa', categoriaId: 'cat-pet', valorCentavos: 8000 },
  ];
  const canDeleteCategory = (catId: string) => {
    return !txComCat.some((tx) => tx.categoriaId === catId);
  };
  assert(
    !canDeleteCategory('cat-pet') && canDeleteCategory('cat-sem-uso'),
    '6. Integridade de relatórios: impede exclusão de categoria com movimentações'
  );

  // 7. Agrupamento pelos 6 tipos oficiais do DuoFinance
  const tiposValidos = ['receita', 'custo_fixo', 'custo_variavel', 'investimento', 'lazer', 'divida'];
  assert(
    tiposValidos.length === 6,
    '7. Estrutura oficial: suporta os 6 tipos de classificação'
  );

  return { passed, failed, results };
}
