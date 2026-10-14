import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OrcamentoFinanceiro } from '../types/goalsAndBudgets';

export interface CreateBudgetParams {
  nome: string;
  categoriaId: string;
  valorLimiteCentavos: number;
  mesReferencia: string; // "YYYY-MM"
  donoId?: string; // "" = compartilhado, ou uid
}

/**
 * Cria um novo orçamento mensal para uma categoria (Regras 16, 17, 18 e 25).
 * Bloqueia duplicidade para o mesmo mês + mesma categoria + mesmo donoId.
 */
export async function createBudget(
  planoId: string,
  params: CreateBudgetParams
): Promise<string> {
  if (!params.nome.trim()) {
    throw new Error('O nome do orçamento é obrigatório.');
  }
  if (!params.categoriaId) {
    throw new Error('A categoria do orçamento é obrigatória.');
  }
  if (!params.valorLimiteCentavos || params.valorLimiteCentavos <= 0) {
    throw new Error('O limite do orçamento deve ser maior que zero.');
  }
  if (!params.mesReferencia) {
    throw new Error('O mês de referência é obrigatório.');
  }

  const donoId = params.donoId || '';
  const orcamentosRef = collection(db, 'planos', planoId, 'orcamentos');

  // Prevenção de duplicidade: verificar se já existe orçamento ativo
  const qDuplicidade = query(
    orcamentosRef,
    where('mesReferencia', '==', params.mesReferencia),
    where('categoriaId', '==', params.categoriaId),
    where('donoId', '==', donoId)
  );
  const snapDuplicidade = await getDocs(qDuplicidade);
  const duplicado = snapDuplicidade.docs.some((d) => d.data().ativo !== false);
  if (duplicado) {
    throw new Error(
      'Já existe um orçamento ativo para esta categoria neste mês e responsável.'
    );
  }

  const docRef = await addDoc(orcamentosRef, {
    nome: params.nome.trim(),
    categoriaId: params.categoriaId,
    valorLimiteCentavos: params.valorLimiteCentavos,
    mesReferencia: params.mesReferencia,
    donoId,
    ativo: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Atualiza campos de um orçamento existente (Regra 26).
 */
export async function updateBudget(
  planoId: string,
  budgetId: string,
  params: Partial<OrcamentoFinanceiro>
): Promise<void> {
  const budgetRef = doc(db, 'planos', planoId, 'orcamentos', budgetId);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (params.nome !== undefined) updateData.nome = params.nome.trim();
  if (params.categoriaId !== undefined) updateData.categoriaId = params.categoriaId;
  if (params.valorLimiteCentavos !== undefined) {
    if (params.valorLimiteCentavos <= 0) {
      throw new Error('O valor limite deve ser maior que zero.');
    }
    updateData.valorLimiteCentavos = params.valorLimiteCentavos;
  }
  if (params.donoId !== undefined) updateData.donoId = params.donoId;
  if (params.ativo !== undefined) updateData.ativo = params.ativo;
  if (params.mesReferencia !== undefined) updateData.mesReferencia = params.mesReferencia;

  await updateDoc(budgetRef, updateData);
}

/**
 * Desativa um orçamento (Regra 26).
 */
export async function disableBudget(
  planoId: string,
  budgetId: string
): Promise<void> {
  const budgetRef = doc(db, 'planos', planoId, 'orcamentos', budgetId);
  await updateDoc(budgetRef, {
    ativo: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Exclui um orçamento.
 */
export async function deleteBudget(
  planoId: string,
  budgetId: string
): Promise<void> {
  const budgetRef = doc(db, 'planos', planoId, 'orcamentos', budgetId);
  await deleteDoc(budgetRef);
}

/**
 * Escuta os orçamentos do plano em tempo real.
 */
export function subscribeBudgets(
  planoId: string,
  callback: (budgets: OrcamentoFinanceiro[]) => void
): () => void {
  const orcamentosRef = collection(db, 'planos', planoId, 'orcamentos');

  return onSnapshot(
    orcamentosRef,
    (snapshot) => {
      const list: OrcamentoFinanceiro[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          nome: data.nome,
          categoriaId: data.categoriaId,
          valorLimiteCentavos: data.valorLimiteCentavos || data.limiteCentavos || 0,
          mesReferencia: data.mesReferencia || '',
          donoId: data.donoId ?? '',
          ativo: data.ativo !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar orçamentos:', err);
    }
  );
}
