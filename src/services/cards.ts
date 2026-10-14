import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartaoCredito } from '../types/finance';

export interface CreateCardParams {
  nome: string;
  bandeira?: string;
  ultimos4?: string;
  limiteCentavos: number;
  diaFechamento: number;
  diaVencimento: number;
  donoId: string; // "" para compartilhado ou uid
  ativo?: boolean;
}

export interface UpdateCardParams {
  nome?: string;
  bandeira?: string;
  ultimos4?: string;
  limiteCentavos?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  donoId?: string;
  ativo?: boolean;
}

function validateCardData(params: CreateCardParams | UpdateCardParams, isUpdate = false) {
  if (!isUpdate || params.nome !== undefined) {
    if (!params.nome || !params.nome.trim()) {
      throw new Error('O nome do cartão é obrigatório.');
    }
  }

  if (!isUpdate || params.limiteCentavos !== undefined) {
    if (!params.limiteCentavos || params.limiteCentavos <= 0) {
      throw new Error('O limite do cartão deve ser maior que zero.');
    }
    if (!Number.isInteger(params.limiteCentavos)) {
      throw new Error('O limite em centavos deve ser um número inteiro.');
    }
  }

  if (!isUpdate || params.diaFechamento !== undefined) {
    if (!params.diaFechamento || params.diaFechamento < 1 || params.diaFechamento > 31) {
      throw new Error('O dia de fechamento deve ser entre 1 e 31.');
    }
  }

  if (!isUpdate || params.diaVencimento !== undefined) {
    if (!params.diaVencimento || params.diaVencimento < 1 || params.diaVencimento > 31) {
      throw new Error('O dia de vencimento deve ser entre 1 e 31.');
    }
  }

  if (params.ultimos4 !== undefined && params.ultimos4 !== '') {
    if (!/^\d{4}$/.test(params.ultimos4)) {
      throw new Error('Os últimos 4 dígitos devem conter exatamente 4 caracteres numéricos.');
    }
  }
}

export async function createCard(
  planoId: string,
  params: CreateCardParams
): Promise<string> {
  if (!planoId) throw new Error('ID do plano é obrigatório.');

  validateCardData(params);

  const cleanData = {
    nome: params.nome.trim(),
    bandeira: params.bandeira?.trim() || undefined,
    ultimos4: params.ultimos4?.trim() || undefined,
    limiteCentavos: Math.round(params.limiteCentavos),
    diaFechamento: params.diaFechamento,
    diaVencimento: params.diaVencimento,
    donoId: params.donoId ?? '',
    ativo: params.ativo !== false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const cartoesRef = collection(db, 'planos', planoId, 'cartoes');
  const docRef = await addDoc(cartoesRef, cleanData);
  return docRef.id;
}

export async function getCard(
  planoId: string,
  cartaoId: string
): Promise<CartaoCredito | null> {
  if (!planoId || !cartaoId) return null;

  const docRef = doc(db, 'planos', planoId, 'cartoes', cartaoId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    id: snap.id,
    nome: d.nome,
    bandeira: d.bandeira,
    ultimos4: d.ultimos4,
    limiteCentavos: d.limiteCentavos,
    diaFechamento: d.diaFechamento,
    diaVencimento: d.diaVencimento,
    donoId: d.donoId ?? '',
    ativo: d.ativo !== false,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export async function getCards(
  planoId: string,
  options?: { apenasAtivos?: boolean }
): Promise<CartaoCredito[]> {
  if (!planoId) return [];

  const cartoesRef = collection(db, 'planos', planoId, 'cartoes');
  const snap = await getDocs(cartoesRef);

  const list: CartaoCredito[] = [];
  snap.forEach((d) => {
    const data = d.data();
    const item: CartaoCredito = {
      id: d.id,
      nome: data.nome,
      bandeira: data.bandeira,
      ultimos4: data.ultimos4,
      limiteCentavos: data.limiteCentavos,
      diaFechamento: data.diaFechamento,
      diaVencimento: data.diaVencimento,
      donoId: data.donoId ?? '',
      ativo: data.ativo !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    if (!options?.apenasAtivos || item.ativo) {
      list.push(item);
    }
  });

  return list;
}

export async function updateCard(
  planoId: string,
  cartaoId: string,
  params: UpdateCardParams
): Promise<void> {
  if (!planoId || !cartaoId) throw new Error('Identificadores ausentes.');

  validateCardData(params, true);

  const cleanData: any = {
    updatedAt: Timestamp.now(),
  };

  if (params.nome !== undefined) cleanData.nome = params.nome.trim();
  if (params.bandeira !== undefined) cleanData.bandeira = params.bandeira.trim() || null;
  if (params.ultimos4 !== undefined) cleanData.ultimos4 = params.ultimos4.trim() || null;
  if (params.limiteCentavos !== undefined) cleanData.limiteCentavos = Math.round(params.limiteCentavos);
  if (params.diaFechamento !== undefined) cleanData.diaFechamento = params.diaFechamento;
  if (params.diaVencimento !== undefined) cleanData.diaVencimento = params.diaVencimento;
  if (params.donoId !== undefined) cleanData.donoId = params.donoId;
  if (params.ativo !== undefined) cleanData.ativo = params.ativo;

  const docRef = doc(db, 'planos', planoId, 'cartoes', cartaoId);
  await updateDoc(docRef, cleanData);
}

export async function toggleCardActive(
  planoId: string,
  cartaoId: string,
  ativo: boolean
): Promise<void> {
  return updateCard(planoId, cartaoId, { ativo });
}

export function subscribeCards(
  planoId: string,
  callback: (cards: CartaoCredito[]) => void,
  options?: { apenasAtivos?: boolean }
): () => void {
  if (!planoId) {
    callback([]);
    return () => {};
  }

  const cartoesRef = collection(db, 'planos', planoId, 'cartoes');

  return onSnapshot(
    cartoesRef,
    (snap) => {
      const list: CartaoCredito[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const item: CartaoCredito = {
          id: d.id,
          nome: data.nome,
          bandeira: data.bandeira,
          ultimos4: data.ultimos4,
          limiteCentavos: data.limiteCentavos,
          diaFechamento: data.diaFechamento,
          diaVencimento: data.diaVencimento,
          donoId: data.donoId ?? '',
          ativo: data.ativo !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        if (!options?.apenasAtivos || item.ativo) {
          list.push(item);
        }
      });
      callback(list);
    },
    (err) => {
      console.error('Erro na subscrição de cartões:', err);
      callback([]);
    }
  );
}
