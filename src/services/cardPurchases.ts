import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  CompraCartao,
  ParcelaCartao,
  CartaoCredito,
  FaturaCartao,
} from '../types/finance';
import { generateInstallments } from '../utils/creditCard';
import { getOrCreateInvoice } from './invoices';
import { getCard } from './cards';
import { createTransaction } from './transactions';

export interface CreateCardPurchaseParams {
  cartaoId: string;
  descricao: string;
  valorTotalCentavos: number;
  numeroParcelas: number;
  categoriaId: string;
  donoId: string; // "" para compartilhado ou UID
  dataCompra: string; // "YYYY-MM-DD"
  observacao?: string;
}

export async function createCardPurchase(
  planoId: string,
  params: CreateCardPurchaseParams
): Promise<string> {
  const {
    cartaoId,
    descricao,
    valorTotalCentavos,
    numeroParcelas,
    categoriaId,
    donoId,
    dataCompra,
    observacao,
  } = params;

  // 1. Validação de dados
  if (!planoId || !cartaoId) throw new Error('Identificadores obrigatórios ausentes.');
  if (!descricao || !descricao.trim()) throw new Error('A descrição da compra é obrigatória.');
  if (!valorTotalCentavos || valorTotalCentavos <= 0) {
    throw new Error('O valor da compra deve ser maior que zero.');
  }
  if (!numeroParcelas || numeroParcelas < 1 || numeroParcelas > 24) {
    throw new Error('O número de parcelas deve ser entre 1 e 24.');
  }
  if (!categoriaId) throw new Error('A categoria da compra é obrigatória.');
  if (!dataCompra) throw new Error('A data da compra é obrigatória.');

  const cartao = await getCard(planoId, cartaoId);
  if (!cartao) throw new Error('Cartão de crédito não encontrado.');
  if (!cartao.ativo) throw new Error('Este cartão está inativo para novas compras.');

  // 2. Geração determinística de parcelas
  const generatedInstallments = generateInstallments({
    valorTotalCentavos,
    numeroParcelas,
    dataCompra,
    cartao: {
      diaFechamento: cartao.diaFechamento,
      diaVencimento: cartao.diaVencimento,
    },
  });

  // 3. Criar documento da Compra no Firestore
  const comprasRef = collection(db, 'planos', planoId, 'cartoes', cartaoId, 'compras');
  const novaCompraData: Omit<CompraCartao, 'id'> = {
    cartaoId,
    descricao: descricao.trim(),
    valorTotalCentavos,
    numeroParcelas,
    categoriaId,
    donoId: donoId ?? '',
    dataCompra,
    observacao: observacao?.trim() || undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const compraDocRef = await addDoc(comprasRef, novaCompraData);
  const compraId = compraDocRef.id;

  // 4. Para cada parcela:
  // a) Obter ou criar a respectiva fatura mensal
  // b) Criar o lançamento financeiro tipo "despesa" com vínculo com o cartão
  // c) Salvar a parcela na subcoleção compras/{compraId}/parcelas
  // d) Incrementar o valorTotalCentavos da fatura
  for (const inst of generatedInstallments) {
    // a) Fatura correspondente
    const fatura = await getOrCreateInvoice(
      planoId,
      cartaoId,
      inst.mesReferencia,
      inst.dataFechamento,
      inst.dataVencimento
    );

    // b) Criar Lançamento Financeiro
    const [compAno, compMes, compDia] = inst.dataCompetencia.split('-').map(Number);
    const [caixaAno, caixaMes, caixaDia] = inst.dataCaixa.split('-').map(Number);

    const descFormatada =
      numeroParcelas > 1
        ? `${descricao.trim()} (${inst.numeroParcela}/${inst.totalParcelas})`
        : descricao.trim();

    const lancamentosRef = collection(db, 'planos', planoId, 'lancamentos');
    const lancamentoDocRef = await addDoc(lancamentosRef, {
      tipo: 'despesa',
      descricao: descFormatada,
      valorCentavos: inst.valorCentavos,
      contaId: '', // Não utiliza conta bancária como origem
      cartaoId,
      compraCartaoId: compraId,
      faturaId: fatura.id,
      categoriaId,
      donoId: donoId ?? '',
      dataCompetencia: Timestamp.fromDate(new Date(compAno, compMes - 1, compDia, 12, 0, 0)),
      dataCaixa: Timestamp.fromDate(new Date(caixaAno, caixaMes - 1, caixaDia, 12, 0, 0)),
      observacao: observacao?.trim() || undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const lancamentoId = lancamentoDocRef.id;

    // c) Salvar a Parcela
    const parcelaRef = doc(
      db,
      'planos',
      planoId,
      'cartoes',
      cartaoId,
      'compras',
      compraId,
      'parcelas',
      `parcela_${inst.numeroParcela}_de_${inst.totalParcelas}`
    );

    const parcelaData: Omit<ParcelaCartao, 'id'> = {
      compraId,
      cartaoId,
      numeroParcela: inst.numeroParcela,
      totalParcelas: inst.totalParcelas,
      valorCentavos: inst.valorCentavos,
      faturaId: fatura.id,
      dataCompetencia: inst.dataCompetencia,
      dataCaixa: inst.dataCaixa,
      status: 'aberta',
      lancamentoId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(parcelaRef, parcelaData);

    // Atualizar lancamentoId com parcelaCartaoId
    await updateDoc(lancamentoDocRef, {
      parcelaCartaoId: parcelaRef.id,
    });

    // d) Atualizar total da Fatura
    const faturaDocRef = doc(db, 'planos', planoId, 'cartoes', cartaoId, 'faturas', fatura.id);
    await updateDoc(faturaDocRef, {
      valorTotalCentavos: (fatura.valorTotalCentavos || 0) + inst.valorCentavos,
      updatedAt: Timestamp.now(),
    });
  }

  return compraId;
}

/**
 * Busca todas as parcelas associadas a uma fatura específica.
 */
export async function getInvoiceInstallments(
  planoId: string,
  cartaoId: string,
  faturaId: string
): Promise<{ parcela: ParcelaCartao; compra: CompraCartao }[]> {
  const comprasRef = collection(db, 'planos', planoId, 'cartoes', cartaoId, 'compras');
  const comprasSnap = await getDocs(comprasRef);

  const results: { parcela: ParcelaCartao; compra: CompraCartao }[] = [];

  for (const cDoc of comprasSnap.docs) {
    const compraData = cDoc.data() as Omit<CompraCartao, 'id'>;
    const compra: CompraCartao = {
      id: cDoc.id,
      ...compraData,
    };

    const parcelasRef = collection(
      db,
      'planos',
      planoId,
      'cartoes',
      cartaoId,
      'compras',
      cDoc.id,
      'parcelas'
    );
    const q = query(parcelasRef, where('faturaId', '==', faturaId));
    const pSnap = await getDocs(q);

    pSnap.forEach((pDoc) => {
      const pData = pDoc.data() as Omit<ParcelaCartao, 'id'>;
      results.push({
        parcela: {
          id: pDoc.id,
          ...pData,
        },
        compra,
      });
    });
  }

  // Ordena por data de compra
  return results.sort((a, b) => a.compra.dataCompra.localeCompare(b.compra.dataCompra));
}

/**
 * Escuta as compras do cartão em tempo real.
 */
export function subscribeCardPurchases(
  planoId: string,
  cartaoId: string,
  callback: (compras: CompraCartao[]) => void
): () => void {
  if (!planoId || !cartaoId) {
    callback([]);
    return () => {};
  }

  const comprasRef = collection(db, 'planos', planoId, 'cartoes', cartaoId, 'compras');

  return onSnapshot(
    comprasRef,
    (snap) => {
      const list: CompraCartao[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          cartaoId: data.cartaoId,
          descricao: data.descricao,
          valorTotalCentavos: data.valorTotalCentavos,
          numeroParcelas: data.numeroParcelas,
          categoriaId: data.categoriaId,
          donoId: data.donoId ?? '',
          dataCompra: data.dataCompra,
          observacao: data.observacao,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      list.sort((a, b) => b.dataCompra.localeCompare(a.dataCompra));
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar compras do cartão:', err);
      callback([]);
    }
  );
}

/**
 * Calcula o limite total, limite utilizado e limite disponível do cartão (Regra 9).
 * limiteDisponivel = limiteTotal - limiteUtilizado.
 * O limite utilizado considera todas as faturas não totalmente pagas.
 */
export function calculateCardLimits(
  cartao: CartaoCredito,
  faturas: FaturaCartao[]
): {
  limiteTotalCentavos: number;
  limiteUtilizadoCentavos: number;
  limiteDisponivelCentavos: number;
  percentualUtilizado: number;
} {
  const limiteTotalCentavos = cartao.limiteCentavos || 0;

  // Soma de valores pendentes de faturas que não estão 'paga'
  const limiteUtilizadoCentavos = faturas.reduce((sum, fatura) => {
    if (fatura.status === 'paga') return sum;
    const saldoFatura = Math.max(0, fatura.valorTotalCentavos - (fatura.valorPagoCentavos || 0));
    return sum + saldoFatura;
  }, 0);

  const limiteDisponivelCentavos = Math.max(0, limiteTotalCentavos - limiteUtilizadoCentavos);
  const percentualUtilizado =
    limiteTotalCentavos > 0
      ? Math.min(100, Math.round((limiteUtilizadoCentavos / limiteTotalCentavos) * 100))
      : 0;

  return {
    limiteTotalCentavos,
    limiteUtilizadoCentavos,
    limiteDisponivelCentavos,
    percentualUtilizado,
  };
}
