import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaturaCartao, FaturaStatus } from '../types/finance';
import { createTransaction } from './transactions';
import { getCard } from './cards';

/**
 * Busca ou inicializa deterministicamente a fatura do cartão para o mês de referência.
 */
export async function getOrCreateInvoice(
  planoId: string,
  cartaoId: string,
  mesReferencia: string, // "YYYY-MM"
  dataFechamento: string, // "YYYY-MM-DD"
  dataVencimento: string // "YYYY-MM-DD"
): Promise<FaturaCartao> {
  const faturaDocId = `${cartaoId}_${mesReferencia}`;
  const faturaRef = doc(db, 'planos', planoId, 'cartoes', cartaoId, 'faturas', faturaDocId);
  const snap = await getDoc(faturaRef);

  if (snap.exists()) {
    const d = snap.data();
    return {
      id: snap.id,
      cartaoId: d.cartaoId,
      mesReferencia: d.mesReferencia,
      dataFechamento: d.dataFechamento,
      dataVencimento: d.dataVencimento,
      valorTotalCentavos: d.valorTotalCentavos || 0,
      valorPagoCentavos: d.valorPagoCentavos || 0,
      status: d.status || 'aberta',
      contaPagamentoId: d.contaPagamentoId,
      pagamentoLancamentoId: d.pagamentoLancamentoId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  // Se não existir, cria a fatura inicial
  const hoje = new Date().toISOString().split('T')[0];
  let statusInicial: FaturaStatus = 'aberta';
  if (hoje > dataFechamento) {
    statusInicial = hoje > dataVencimento ? 'vencida' : 'fechada';
  }

  const novaFaturaData: Omit<FaturaCartao, 'id'> = {
    cartaoId,
    mesReferencia,
    dataFechamento,
    dataVencimento,
    valorTotalCentavos: 0,
    valorPagoCentavos: 0,
    status: statusInicial,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(faturaRef, novaFaturaData);

  return {
    id: faturaDocId,
    ...novaFaturaData,
  };
}

export async function getInvoice(
  planoId: string,
  cartaoId: string,
  faturaId: string
): Promise<FaturaCartao | null> {
  const faturaRef = doc(db, 'planos', planoId, 'cartoes', cartaoId, 'faturas', faturaId);
  const snap = await getDoc(faturaRef);
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    id: snap.id,
    cartaoId: d.cartaoId,
    mesReferencia: d.mesReferencia,
    dataFechamento: d.dataFechamento,
    dataVencimento: d.dataVencimento,
    valorTotalCentavos: d.valorTotalCentavos || 0,
    valorPagoCentavos: d.valorPagoCentavos || 0,
    status: d.status || 'aberta',
    contaPagamentoId: d.contaPagamentoId,
    pagamentoLancamentoId: d.pagamentoLancamentoId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function getInvoices(
  planoId: string,
  cartaoId: string
): Promise<FaturaCartao[]> {
  const faturasRef = collection(db, 'planos', planoId, 'cartoes', cartaoId, 'faturas');
  const snap = await getDocs(faturasRef);

  const list: FaturaCartao[] = [];
  snap.forEach((d) => {
    const data = d.data();
    list.push({
      id: d.id,
      cartaoId: data.cartaoId,
      mesReferencia: data.mesReferencia,
      dataFechamento: data.dataFechamento,
      dataVencimento: data.dataVencimento,
      valorTotalCentavos: data.valorTotalCentavos || 0,
      valorPagoCentavos: data.valorPagoCentavos || 0,
      status: data.status || 'aberta',
      contaPagamentoId: data.contaPagamentoId,
      pagamentoLancamentoId: data.pagamentoLancamentoId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });

  // Ordena por mês de referência (mais recente primeiro)
  return list.sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia));
}

export function subscribeInvoices(
  planoId: string,
  cartaoId: string,
  callback: (invoices: FaturaCartao[]) => void
): () => void {
  if (!planoId || !cartaoId) {
    callback([]);
    return () => {};
  }

  const faturasRef = collection(db, 'planos', planoId, 'cartoes', cartaoId, 'faturas');

  return onSnapshot(
    faturasRef,
    (snap) => {
      const list: FaturaCartao[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          cartaoId: data.cartaoId,
          mesReferencia: data.mesReferencia,
          dataFechamento: data.dataFechamento,
          dataVencimento: data.dataVencimento,
          valorTotalCentavos: data.valorTotalCentavos || 0,
          valorPagoCentavos: data.valorPagoCentavos || 0,
          status: data.status || 'aberta',
          contaPagamentoId: data.contaPagamentoId,
          pagamentoLancamentoId: data.pagamentoLancamentoId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      list.sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia));
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar faturas:', err);
      callback([]);
    }
  );
}

/**
 * REGRA FUNDAMENTAL (Regra 8 e 17):
 * O pagamento da fatura NUNCA gera uma nova despesa.
 * É registrado como transferência entre a conta bancária e o cartão.
 */
export async function payInvoice(params: {
  planoId: string;
  cartaoId: string;
  faturaId: string;
  contaPagamentoId: string;
  valorCentavos: number;
  dataPagamento: string; // "YYYY-MM-DD"
  donoId: string;
}): Promise<string> {
  const {
    planoId,
    cartaoId,
    faturaId,
    contaPagamentoId,
    valorCentavos,
    dataPagamento,
    donoId,
  } = params;

  if (valorCentavos <= 0) {
    throw new Error('O valor do pagamento deve ser maior que zero.');
  }
  if (!contaPagamentoId) {
    throw new Error('Selecione uma conta para realizar o pagamento.');
  }

  const fatura = await getInvoice(planoId, cartaoId, faturaId);
  if (!fatura) throw new Error('Fatura não encontrada.');

  const cartao = await getCard(planoId, cartaoId);
  if (!cartao) throw new Error('Cartão não encontrado.');

  const [ano, mes, dia] = dataPagamento.split('-').map(Number);
  const dataTimestamp = Timestamp.fromDate(new Date(ano, mes - 1, dia, 12, 0, 0));

  // 1. Criar transferência (conta bancária -> cartão)
  // Regra 8: Transferência, NÃO despesa!
  const lancamentoId = await createTransaction(planoId, {
    tipo: 'transferencia',
    descricao: `Pagamento Fatura ${cartao.nome} (${fatura.mesReferencia})`,
    valorCentavos,
    contaId: contaPagamentoId,
    contaDestinoId: cartaoId, // Identificador de destino
    donoId: donoId ?? '',
    dataCompetencia: dataTimestamp,
    dataCaixa: dataTimestamp,
    observacao: `Pagamento registrado para a fatura de ${fatura.mesReferencia}`,
  });

  // 2. Atualizar a fatura
  const novoValorPago = (fatura.valorPagoCentavos || 0) + valorCentavos;
  const novoStatus: FaturaStatus =
    novoValorPago >= fatura.valorTotalCentavos ? 'paga' : 'fechada';

  const faturaRef = doc(db, 'planos', planoId, 'cartoes', cartaoId, 'faturas', faturaId);
  await updateDoc(faturaRef, {
    valorPagoCentavos: novoValorPago,
    status: novoStatus,
    contaPagamentoId,
    pagamentoLancamentoId: lancamentoId,
    updatedAt: Timestamp.now(),
  });

  return lancamentoId;
}
