import { CartaoCredito } from '../types/finance';

export interface InvoiceDates {
  mesReferencia: string; // "YYYY-MM"
  dataFechamento: string; // "YYYY-MM-DD"
  dataVencimento: string; // "YYYY-MM-DD"
}

export interface GeneratedInstallment {
  numeroParcela: number; // 1, 2, 3...
  totalParcelas: number;
  valorCentavos: number;
  dataCompetencia: string; // "YYYY-MM-DD" (data da compra)
  dataCaixa: string; // "YYYY-MM-DD" (data de vencimento da fatura)
  mesReferencia: string; // "YYYY-MM"
  dataFechamento: string; // "YYYY-MM-DD"
  dataVencimento: string; // "YYYY-MM-DD"
}

/**
 * Função centralizada para cálculo de datas de fatura conforme Regra 15.
 * A compra entra na fatura do mês se feita até o dia de fechamento.
 * Se feita após o dia de fechamento, entra na fatura subsequente.
 */
export function getInvoiceReferenceDate(
  dataCompraStr: string, // "YYYY-MM-DD"
  diaFechamento: number, // 1-31
  diaVencimento: number, // 1-31
  monthOffset = 0
): InvoiceDates {
  const [anoStr, mesStr, diaStr] = dataCompraStr.split('-');
  const ano = parseInt(anoStr, 10);
  const mes = parseInt(mesStr, 10); // 1-12
  const dia = parseInt(diaStr, 10);

  // Se a compra foi feita após o dia de fechamento, cai na próxima fatura (+1 mês)
  let baseMonthIncrement = dia > diaFechamento ? 1 : 0;
  baseMonthIncrement += monthOffset;

  // Data base calculando ano e mês alvo da fatura
  const targetDate = new Date(ano, mes - 1 + baseMonthIncrement, 1);
  const targetAno = targetDate.getFullYear();
  const targetMes = targetDate.getMonth() + 1; // 1-12

  const mesReferencia = `${targetAno}-${String(targetMes).padStart(2, '0')}`;

  // Ajuste do dia de fechamento caso o mês tenha menos dias (ex: fevereiro dia 30 -> 28)
  const maxDiasMesFechamento = new Date(targetAno, targetMes, 0).getDate();
  const diaFechamentoAjustado = Math.min(diaFechamento, maxDiasMesFechamento);
  const dataFechamento = `${targetAno}-${String(targetMes).padStart(2, '0')}-${String(diaFechamentoAjustado).padStart(2, '0')}`;

  // Cálculo do vencimento:
  // Se o dia do vencimento for maior que o fechamento, vence no mesmo mês.
  // Se o dia do vencimento for menor ou igual ao fechamento, vence no mês seguinte.
  const vencimentoMonthOffset = diaVencimento > diaFechamento ? 0 : 1;
  const vencimentoDate = new Date(targetAno, targetMes - 1 + vencimentoMonthOffset, 1);
  const vencAno = vencimentoDate.getFullYear();
  const vencMes = vencimentoDate.getMonth() + 1;
  const maxDiasMesVencimento = new Date(vencAno, vencMes, 0).getDate();
  const diaVencimentoAjustado = Math.min(diaVencimento, maxDiasMesVencimento);
  const dataVencimento = `${vencAno}-${String(vencMes).padStart(2, '0')}-${String(diaVencimentoAjustado).padStart(2, '0')}`;

  return {
    mesReferencia,
    dataFechamento,
    dataVencimento,
  };
}

/**
 * Função centralizada para geração de parcelas conforme Regra 16.
 * Garante divisão exata de centavos sem arredondamento floating-point.
 * Exemplo: R$ 100,00 em 3x -> 33,33, 33,33, 33,34 (soma = 100,00).
 */
export function generateInstallments(params: {
  valorTotalCentavos: number;
  numeroParcelas: number;
  dataCompra: string; // "YYYY-MM-DD"
  cartao: Pick<CartaoCredito, 'diaFechamento' | 'diaVencimento'>;
}): GeneratedInstallment[] {
  const { valorTotalCentavos, numeroParcelas, dataCompra, cartao } = params;

  if (numeroParcelas < 1) {
    throw new Error('O número de parcelas deve ser pelo menos 1.');
  }
  if (valorTotalCentavos <= 0) {
    throw new Error('O valor total deve ser maior que zero.');
  }

  const baseCentavos = Math.floor(valorTotalCentavos / numeroParcelas);
  const restoCentavos = valorTotalCentavos % numeroParcelas;

  const installments: GeneratedInstallment[] = [];

  for (let i = 0; i < numeroParcelas; i++) {
    const numeroParcela = i + 1;
    // O resto de centavos é adicionado nas últimas parcelas de forma determinística
    const extraCentavo = i >= numeroParcelas - restoCentavos ? 1 : 0;
    const valorParcelaCentavos = baseCentavos + extraCentavo;

    const invoiceDates = getInvoiceReferenceDate(
      dataCompra,
      cartao.diaFechamento,
      cartao.diaVencimento,
      i // Cada parcela avança 1 mês
    );

    installments.push({
      numeroParcela,
      totalParcelas: numeroParcelas,
      valorCentavos: valorParcelaCentavos,
      dataCompetencia: dataCompra, // Regra 7: Data de competência é sempre a data da compra
      dataCaixa: invoiceDates.dataVencimento, // Data de caixa é o vencimento da respectiva fatura
      mesReferencia: invoiceDates.mesReferencia,
      dataFechamento: invoiceDates.dataFechamento,
      dataVencimento: invoiceDates.dataVencimento,
    });
  }

  // Verificação de segurança: a soma das parcelas DEVE ser idêntica ao total
  const soma = installments.reduce((acc, curr) => acc + curr.valorCentavos, 0);
  if (soma !== valorTotalCentavos) {
    throw new Error(`Inconsistência no cálculo de parcelas: soma ${soma} != total ${valorTotalCentavos}`);
  }

  return installments;
}
