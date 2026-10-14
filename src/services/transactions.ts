import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LancamentoFinanceiro, TipoLancamento, RegimeFinanceiro } from '../types/finance';

export interface CreateTransactionParams {
  tipo: TipoLancamento;
  descricao: string;
  valorCentavos: number;
  contaId: string;
  contaDestinoId?: string;
  categoriaId?: string;
  donoId: string; // "" para compartilhado ou uid para individual
  dataCompetencia: Timestamp;
  dataCaixa: Timestamp;
  observacao?: string;
}

export interface UpdateTransactionParams {
  tipo?: TipoLancamento;
  descricao?: string;
  valorCentavos?: number;
  contaId?: string;
  contaDestinoId?: string;
  categoriaId?: string;
  donoId?: string;
  dataCompetencia?: Timestamp;
  dataCaixa?: Timestamp;
  observacao?: string;
}

export interface TransactionFilterOptions {
  mes?: string; // YYYY-MM
  regime?: RegimeFinanceiro; // 'competencia' | 'caixa'
  filtroPessoa?: 'todos' | string; // 'todos' ou uid
  tipo?: TipoLancamento | 'todos';
  contaId?: string | 'todas';
  categoriaId?: string | 'todas';
}

/**
 * Validação rigorosa dos dados de lançamento antes da persistência.
 */
function validateTransactionData(data: CreateTransactionParams | UpdateTransactionParams, isUpdate = false) {
  if (!isUpdate || data.descricao !== undefined) {
    if (!data.descricao || !data.descricao.trim()) {
      throw new Error('A descrição do lançamento é obrigatória.');
    }
  }

  if (!isUpdate || data.valorCentavos !== undefined) {
    if (!data.valorCentavos || typeof data.valorCentavos !== 'number' || data.valorCentavos <= 0) {
      throw new Error('O valor deve ser um número inteiro em centavos maior que zero.');
    }
    if (!Number.isInteger(data.valorCentavos)) {
      throw new Error('O valor em centavos não pode conter casas decimais.');
    }
  }

  if (!isUpdate || data.tipo !== undefined) {
    if (!data.tipo || !['receita', 'despesa', 'transferencia'].includes(data.tipo)) {
      throw new Error('Tipo de lançamento inválido.');
    }
  }

  if (!isUpdate || data.contaId !== undefined) {
    if (!data.contaId || !data.contaId.trim()) {
      throw new Error('A conta é obrigatória.');
    }
  }

  const tipo = data.tipo;
  if (tipo === 'transferencia') {
    if (!data.contaDestinoId || !data.contaDestinoId.trim()) {
      throw new Error('A conta de destino é obrigatória para transferências.');
    }
    if (data.contaDestinoId === data.contaId) {
      throw new Error('A conta de origem e destino não podem ser iguais.');
    }
  } else if (tipo === 'receita' || tipo === 'despesa') {
    if (!data.categoriaId || !data.categoriaId.trim()) {
      throw new Error('A categoria é obrigatória para receitas e despesas.');
    }
  }

  if (!isUpdate || (data.dataCompetencia !== undefined && data.dataCaixa !== undefined)) {
    if (!data.dataCompetencia || !(data.dataCompetencia instanceof Timestamp)) {
      throw new Error('Data de competência inválida.');
    }
    if (!data.dataCaixa || !(data.dataCaixa instanceof Timestamp)) {
      throw new Error('Data de caixa inválida.');
    }
  }
}

/**
 * 1. createTransaction: Cria um novo lançamento no Firestore.
 */
export async function createTransaction(
  planoId: string,
  params: CreateTransactionParams
): Promise<string> {
  if (!planoId) throw new Error('ID do plano não fornecido.');

  validateTransactionData(params);

  const cleanData: any = {
    tipo: params.tipo,
    descricao: params.descricao.trim(),
    valorCentavos: Math.round(params.valorCentavos),
    contaId: params.contaId.trim(),
    donoId: params.donoId ?? '',
    dataCompetencia: params.dataCompetencia,
    dataCaixa: params.dataCaixa,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  if (params.tipo === 'transferencia') {
    cleanData.contaDestinoId = params.contaDestinoId!.trim();
  } else {
    cleanData.categoriaId = params.categoriaId!.trim();
  }

  if (params.observacao && params.observacao.trim()) {
    cleanData.observacao = params.observacao.trim();
  }

  const lancamentosRef = collection(db, 'planos', planoId, 'lancamentos');
  const docRef = await addDoc(lancamentosRef, cleanData);

  return docRef.id;
}

/**
 * 2. getTransaction: Busca um único lançamento por ID.
 */
export async function getTransaction(
  planoId: string,
  lancamentoId: string
): Promise<LancamentoFinanceiro | null> {
  if (!planoId || !lancamentoId) return null;

  const docRef = doc(db, 'planos', planoId, 'lancamentos', lancamentoId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    id: snap.id,
    tipo: d.tipo,
    descricao: d.descricao,
    valorCentavos: d.valorCentavos,
    contaId: d.contaId,
    contaDestinoId: d.contaDestinoId,
    categoriaId: d.categoriaId,
    donoId: d.donoId ?? '',
    dataCompetencia: d.dataCompetencia,
    dataCaixa: d.dataCaixa,
    observacao: d.observacao,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

/**
 * 3. getTransactions: Busca todos os lançamentos do plano com filtros.
 */
export async function getTransactions(
  planoId: string,
  options?: TransactionFilterOptions
): Promise<LancamentoFinanceiro[]> {
  if (!planoId) return [];

  const lancamentosRef = collection(db, 'planos', planoId, 'lancamentos');
  const snap = await getDocs(lancamentosRef);

  let items: LancamentoFinanceiro[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    items.push({
      id: docSnap.id,
      tipo: d.tipo,
      descricao: d.descricao,
      valorCentavos: d.valorCentavos,
      contaId: d.contaId,
      contaDestinoId: d.contaDestinoId,
      categoriaId: d.categoriaId,
      donoId: d.donoId ?? '',
      dataCompetencia: d.dataCompetencia,
      dataCaixa: d.dataCaixa,
      observacao: d.observacao,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  });

  return applyFiltersAndSort(items, options);
}

/**
 * 4. updateTransaction: Atualiza um lançamento existente.
 */
export async function updateTransaction(
  planoId: string,
  lancamentoId: string,
  params: UpdateTransactionParams
): Promise<void> {
  if (!planoId || !lancamentoId) throw new Error('Identificadores ausentes.');

  validateTransactionData(params, true);

  const cleanData: any = {
    updatedAt: Timestamp.now(),
  };

  if (params.tipo !== undefined) cleanData.tipo = params.tipo;
  if (params.descricao !== undefined) cleanData.descricao = params.descricao.trim();
  if (params.valorCentavos !== undefined) cleanData.valorCentavos = Math.round(params.valorCentavos);
  if (params.contaId !== undefined) cleanData.contaId = params.contaId.trim();
  if (params.donoId !== undefined) cleanData.donoId = params.donoId ?? '';
  if (params.dataCompetencia !== undefined) cleanData.dataCompetencia = params.dataCompetencia;
  if (params.dataCaixa !== undefined) cleanData.dataCaixa = params.dataCaixa;

  if (params.tipo === 'transferencia') {
    cleanData.contaDestinoId = params.contaDestinoId?.trim() || '';
    cleanData.categoriaId = null;
  } else if (params.tipo === 'receita' || params.tipo === 'despesa') {
    cleanData.categoriaId = params.categoriaId?.trim() || '';
    cleanData.contaDestinoId = null;
  }

  if (params.observacao !== undefined) {
    cleanData.observacao = params.observacao.trim();
  }

  const docRef = doc(db, 'planos', planoId, 'lancamentos', lancamentoId);
  await updateDoc(docRef, cleanData);
}

/**
 * 5. deleteTransaction: Remove um lançamento com segurança.
 */
export async function deleteTransaction(
  planoId: string,
  lancamentoId: string
): Promise<void> {
  if (!planoId || !lancamentoId) throw new Error('Identificadores ausentes.');

  const docRef = doc(db, 'planos', planoId, 'lancamentos', lancamentoId);
  await deleteDoc(docRef);
}

/**
 * Subscription em tempo real para os lançamentos do plano.
 */
export function subscribeTransactions(
  planoId: string,
  options: TransactionFilterOptions,
  callback: (transactions: LancamentoFinanceiro[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!planoId) {
    callback([]);
    return () => {};
  }

  const lancamentosRef = collection(db, 'planos', planoId, 'lancamentos');

  return onSnapshot(
    lancamentosRef,
    (snap) => {
      const items: LancamentoFinanceiro[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          tipo: d.tipo,
          descricao: d.descricao,
          valorCentavos: d.valorCentavos,
          contaId: d.contaId,
          contaDestinoId: d.contaDestinoId,
          categoriaId: d.categoriaId,
          donoId: d.donoId ?? '',
          dataCompetencia: d.dataCompetencia,
          dataCaixa: d.dataCaixa,
          observacao: d.observacao,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        });
      });

      const filtered = applyFiltersAndSort(items, options);
      callback(filtered);
    },
    (err) => {
      console.error('Erro na subscrição de lançamentos:', err);
      if (onError) onError(err);
      callback([]);
    }
  );
}

/**
 * Aplica as regras de filtragem por Mês (Competência/Caixa), Pessoa, Tipo, Conta e Categoria.
 * Ordena por data do regime ativo (mais recente primeiro).
 */
export function applyFiltersAndSort(
  items: LancamentoFinanceiro[],
  options?: TransactionFilterOptions
): LancamentoFinanceiro[] {
  if (!options) return items;

  const regime = options.regime || 'competencia';
  const mes = options.mes; // YYYY-MM
  const filtroPessoa = options.filtroPessoa || 'todos';
  const filtroTipo = options.tipo || 'todos';
  const filtroConta = options.contaId || 'todas';
  const filtroCategoria = options.categoriaId || 'todas';

  return items
    .filter((tx) => {
      // 1. Filtro de Mês e Regime:
      // Se Competência -> verifica dataCompetencia.
      // Se Caixa -> verifica dataCaixa.
      if (mes) {
        const dateTimestamp = regime === 'competencia' ? tx.dataCompetencia : tx.dataCaixa;
        if (!dateTimestamp) return false;
        const d = dateTimestamp.toDate();
        const itemMesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (itemMesAno !== mes) return false;
      }

      // 2. Filtro de Pessoa:
      // Se "todos" -> mostra compartilhados (donoId == "") e individuais de ambos.
      // Se uid -> mostra compartilhados (donoId == "") E os individuais daquela pessoa.
      if (filtroPessoa !== 'todos') {
        const isCompartilhado = !tx.donoId || tx.donoId === '';
        const isDono = tx.donoId === filtroPessoa;
        if (!isCompartilhado && !isDono) return false;
      }

      // 3. Filtro de Tipo:
      if (filtroTipo !== 'todos' && tx.tipo !== filtroTipo) {
        return false;
      }

      // 4. Filtro de Conta:
      if (filtroConta !== 'todas') {
        const matchConta = tx.contaId === filtroConta || tx.contaDestinoId === filtroConta;
        if (!matchConta) return false;
      }

      // 5. Filtro de Categoria:
      if (filtroCategoria !== 'todas') {
        if (tx.categoriaId !== filtroCategoria) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Ordenação: data do regime selecionado, mais recente primeiro
      const dateA = regime === 'competencia' ? a.dataCompetencia.toMillis() : a.dataCaixa.toMillis();
      const dateB = regime === 'competencia' ? b.dataCompetencia.toMillis() : b.dataCaixa.toMillis();
      return dateB - dateA;
    });
}
