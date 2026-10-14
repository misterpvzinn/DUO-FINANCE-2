import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MetaFinanceira, MovimentacaoMeta } from '../types/goalsAndBudgets';

export interface CreateGoalParams {
  nome: string;
  descricao?: string;
  valorObjetivoCentavos: number;
  valorInicialCentavos?: number;
  dataInicio: string; // "YYYY-MM-DD"
  dataAlvo?: string; // "YYYY-MM-DD"
  donoId?: string; // "" = compartilhada, ou uid
  contaDestinoId?: string;
  categoriaId?: string;
}

export interface AddGoalContributionParams {
  valorCentavos: number;
  data: string; // "YYYY-MM-DD"
  contaOrigemId?: string;
  observacao?: string;
}

/**
 * Cadastra uma nova meta financeira (Regra 4 e 6).
 */
export async function createGoal(
  planoId: string,
  params: CreateGoalParams
): Promise<string> {
  const metasRef = collection(db, 'planos', planoId, 'metas');
  const valorInicial = params.valorInicialCentavos || 0;

  const docRef = await addDoc(metasRef, {
    nome: params.nome.trim(),
    descricao: params.descricao?.trim() || '',
    valorObjetivoCentavos: params.valorObjetivoCentavos,
    valorAtualCentavos: valorInicial,
    dataInicio: params.dataInicio,
    dataAlvo: params.dataAlvo || '',
    donoId: params.donoId || '',
    contaDestinoId: params.contaDestinoId || '',
    categoriaId: params.categoriaId || '',
    status: valorInicial >= params.valorObjetivoCentavos ? 'concluida' : 'ativa',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Se houver valor inicial > 0, cria o primeiro registro de movimentação
  if (valorInicial > 0) {
    const movsRef = collection(db, 'planos', planoId, 'metas', docRef.id, 'movimentacoes');
    await addDoc(movsRef, {
      metaId: docRef.id,
      valorCentavos: valorInicial,
      data: params.dataInicio,
      observacao: 'Aporte inicial / saldo existente',
      createdAt: serverTimestamp(),
    });
  }

  return docRef.id;
}

/**
 * Atualiza campos de uma meta financeira.
 */
export async function updateGoal(
  planoId: string,
  goalId: string,
  params: Partial<MetaFinanceira>
): Promise<void> {
  const goalRef = doc(db, 'planos', planoId, 'metas', goalId);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (params.nome !== undefined) updateData.nome = params.nome.trim();
  if (params.descricao !== undefined) updateData.descricao = params.descricao.trim();
  if (params.valorObjetivoCentavos !== undefined)
    updateData.valorObjetivoCentavos = params.valorObjetivoCentavos;
  if (params.dataInicio !== undefined) updateData.dataInicio = params.dataInicio;
  if (params.dataAlvo !== undefined) updateData.dataAlvo = params.dataAlvo;
  if (params.donoId !== undefined) updateData.donoId = params.donoId;
  if (params.contaDestinoId !== undefined)
    updateData.contaDestinoId = params.contaDestinoId;
  if (params.categoriaId !== undefined)
    updateData.categoriaId = params.categoriaId;
  if (params.status !== undefined) updateData.status = params.status;

  await updateDoc(goalRef, updateData);
}

/**
 * Registra um novo aporte para a meta com rastreabilidade completa (Regras 10 e 11).
 * Não duplica saldo nem cria despesas fictícias.
 */
export async function addGoalContribution(
  planoId: string,
  goalId: string,
  params: AddGoalContributionParams
): Promise<void> {
  if (params.valorCentavos <= 0) {
    throw new Error('O valor do aporte deve ser maior que zero.');
  }

  await runTransaction(db, async (transaction) => {
    const goalRef = doc(db, 'planos', planoId, 'metas', goalId);
    const goalSnap = await transaction.get(goalRef);

    if (!goalSnap.exists()) {
      throw new Error('Meta financeira não encontrada.');
    }

    const goalData = goalSnap.data();
    if (goalData.status !== 'ativa') {
      throw new Error('Aportes só podem ser feitos em metas ativas.');
    }

    const novoValorAtual = (goalData.valorAtualCentavos || 0) + params.valorCentavos;
    const isConcluida = novoValorAtual >= goalData.valorObjetivoCentavos;

    // 1. Atualiza a meta
    transaction.update(goalRef, {
      valorAtualCentavos: novoValorAtual,
      status: isConcluida ? 'concluida' : 'ativa',
      updatedAt: serverTimestamp(),
    });

    // 2. Se houver contaOrigemId e contaDestinoId na meta, registra transferência entre contas
    let lancamentoId: string | undefined;
    if (params.contaOrigemId && goalData.contaDestinoId && params.contaOrigemId !== goalData.contaDestinoId) {
      const lancamentosRef = doc(collection(db, 'planos', planoId, 'lancamentos'));
      lancamentoId = lancamentosRef.id;

      const dateParts = params.data.split('-');
      const dataObj = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10),
        12,
        0,
        0
      );
      const timestamp = Timestamp.fromDate(dataObj);

      transaction.set(lancamentosRef, {
        tipo: 'transferencia',
        descricao: `Aporte: ${goalData.nome}`,
        valorCentavos: params.valorCentavos,
        contaId: params.contaOrigemId,
        contaDestinoId: goalData.contaDestinoId,
        donoId: goalData.donoId || '',
        dataCompetencia: timestamp,
        dataCaixa: timestamp,
        observacao: params.observacao || `Aporte para a meta ${goalData.nome}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Registra movimentação da meta
    const movRef = doc(collection(db, 'planos', planoId, 'metas', goalId, 'movimentacoes'));
    transaction.set(movRef, {
      metaId: goalId,
      valorCentavos: params.valorCentavos,
      data: params.data,
      contaOrigemId: params.contaOrigemId || '',
      lancamentoId: lancamentoId || '',
      observacao: params.observacao?.trim() || '',
      createdAt: serverTimestamp(),
    });
  });
}

/**
 * Conclui manualmente uma meta (Regra 12).
 */
export async function completeGoal(planoId: string, goalId: string): Promise<void> {
  const goalRef = doc(db, 'planos', planoId, 'metas', goalId);
  await updateDoc(goalRef, {
    status: 'concluida',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cancela uma meta preservando histórico e valores (Regra 13).
 */
export async function cancelGoal(planoId: string, goalId: string): Promise<void> {
  const goalRef = doc(db, 'planos', planoId, 'metas', goalId);
  await updateDoc(goalRef, {
    status: 'cancelada',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reativa uma meta cancelada ou concluída.
 */
export async function reactivateGoal(planoId: string, goalId: string): Promise<void> {
  const goalRef = doc(db, 'planos', planoId, 'metas', goalId);
  await updateDoc(goalRef, {
    status: 'ativa',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Escuta metas do plano em tempo real (Regra 14).
 */
export function subscribeGoals(
  planoId: string,
  callback: (goals: MetaFinanceira[]) => void
): () => void {
  const metasRef = collection(db, 'planos', planoId, 'metas');
  const q = query(metasRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: MetaFinanceira[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          nome: data.nome,
          descricao: data.descricao,
          valorObjetivoCentavos: data.valorObjetivoCentavos || 0,
          valorAtualCentavos: data.valorAtualCentavos || 0,
          dataInicio: data.dataInicio || '',
          dataAlvo: data.dataAlvo || '',
          donoId: data.donoId ?? '',
          contaDestinoId: data.contaDestinoId,
          categoriaId: data.categoriaId,
          status: data.status || 'ativa',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar metas financeiras:', err);
    }
  );
}

/**
 * Escuta as movimentações de uma meta específica.
 */
export function subscribeGoalMovements(
  planoId: string,
  goalId: string,
  callback: (movements: MovimentacaoMeta[]) => void
): () => void {
  const movsRef = collection(db, 'planos', planoId, 'metas', goalId, 'movimentacoes');
  const q = query(movsRef, orderBy('data', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: MovimentacaoMeta[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          metaId: data.metaId || goalId,
          valorCentavos: data.valorCentavos || 0,
          data: data.data,
          contaOrigemId: data.contaOrigemId,
          lancamentoId: data.lancamentoId,
          observacao: data.observacao,
          createdAt: data.createdAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar movimentações da meta:', err);
    }
  );
}
