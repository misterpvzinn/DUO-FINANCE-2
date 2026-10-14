import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  RecorrenciaFinanceira,
  ExecucaoRecorrencia,
  RecurrenceFrequency,
  RecurrenceType,
} from '../types/recurrence';
import {
  calculateInitialOccurrence,
  getNextOccurrence,
  formatDateToString,
  parseStringToDate,
} from './recurrenceScheduler';

export interface CreateRecurrenceParams {
  nome: string;
  tipo: RecurrenceType;
  valorCentavos: number;
  contaId: string;
  contaDestinoId?: string;
  categoriaId?: string;
  donoId?: string; // "" = compartilhada, ou uid
  frequencia: RecurrenceFrequency;
  diaExecucao?: number;
  diaSemana?: number;
  mesExecucao?: number;
  dataInicio: string; // "YYYY-MM-DD"
  dataFim?: string; // "YYYY-MM-DD"
  observacao?: string;
}

/**
 * Valida os parâmetros de uma recorrência (Regras 4 e 27).
 */
export function validateRecurrenceParams(params: CreateRecurrenceParams) {
  if (!params.nome || !params.nome.trim()) {
    throw new Error('O nome da recorrência é obrigatório.');
  }
  if (!params.valorCentavos || params.valorCentavos <= 0) {
    throw new Error('O valor deve ser maior que zero.');
  }
  if (!params.contaId) {
    throw new Error('A conta de origem é obrigatória.');
  }
  if (!params.dataInicio) {
    throw new Error('A data de início é obrigatória.');
  }
  if (params.dataFim && params.dataFim < params.dataInicio) {
    throw new Error('A data final não pode ser anterior à data de início.');
  }

  if (params.tipo === 'receita') {
    if (!params.categoriaId) {
      throw new Error('A categoria é obrigatória para receitas.');
    }
    if (params.contaDestinoId) {
      throw new Error('Conta destino não é permitida para receitas.');
    }
  } else if (params.tipo === 'despesa') {
    if (!params.categoriaId) {
      throw new Error('A categoria é obrigatória para despesas.');
    }
    if (params.contaDestinoId) {
      throw new Error('Conta destino não é permitida para despesas.');
    }
  } else if (params.tipo === 'transferencia') {
    if (!params.contaDestinoId) {
      throw new Error('A conta de destino é obrigatória para transferências.');
    }
    if (params.contaId === params.contaDestinoId) {
      throw new Error('A conta de origem e destino devem ser diferentes.');
    }
    if (params.categoriaId) {
      throw new Error('Transferências não possuem categoria.');
    }
  }
}

/**
 * Cria uma nova recorrência financeira (Regras 3, 4, 10, 12).
 */
export async function createRecurrence(
  planoId: string,
  params: CreateRecurrenceParams
): Promise<string> {
  validateRecurrenceParams(params);

  const proximaExecucao = calculateInitialOccurrence({
    frequencia: params.frequencia,
    diaExecucao: params.diaExecucao,
    diaSemana: params.diaSemana,
    mesExecucao: params.mesExecucao,
    dataInicio: params.dataInicio,
  });

  const recorrenciasRef = collection(db, 'planos', planoId, 'recorrencias');
  const docRef = await addDoc(recorrenciasRef, {
    nome: params.nome.trim(),
    tipo: params.tipo,
    valorCentavos: params.valorCentavos,
    contaId: params.contaId,
    contaDestinoId: params.contaDestinoId || '',
    categoriaId: params.categoriaId || '',
    donoId: params.donoId || '',
    frequencia: params.frequencia,
    diaExecucao: params.diaExecucao !== undefined ? params.diaExecucao : null,
    diaSemana: params.diaSemana !== undefined ? params.diaSemana : null,
    mesExecucao: params.mesExecucao !== undefined ? params.mesExecucao : null,
    dataInicio: params.dataInicio,
    dataFim: params.dataFim || '',
    proximaExecucao,
    ativa: true,
    observacao: params.observacao?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Atualiza uma recorrência existente (Regra 28).
 */
export async function updateRecurrence(
  planoId: string,
  recurrenceId: string,
  params: Partial<RecorrenciaFinanceira>
): Promise<void> {
  const recRef = doc(db, 'planos', planoId, 'recorrencias', recurrenceId);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (params.nome !== undefined) updateData.nome = params.nome.trim();
  if (params.valorCentavos !== undefined) {
    if (params.valorCentavos <= 0) {
      throw new Error('O valor deve ser maior que zero.');
    }
    updateData.valorCentavos = params.valorCentavos;
  }
  if (params.contaId !== undefined) updateData.contaId = params.contaId;
  if (params.contaDestinoId !== undefined) updateData.contaDestinoId = params.contaDestinoId;
  if (params.categoriaId !== undefined) updateData.categoriaId = params.categoriaId;
  if (params.donoId !== undefined) updateData.donoId = params.donoId;
  if (params.dataFim !== undefined) updateData.dataFim = params.dataFim;
  if (params.observacao !== undefined) updateData.observacao = params.observacao.trim();
  if (params.ativa !== undefined) updateData.ativa = params.ativa;

  await updateDoc(recRef, updateData);
}

/**
 * Pausa uma recorrência ativa (Regra 30).
 */
export async function pauseRecurrence(
  planoId: string,
  recurrenceId: string
): Promise<void> {
  const recRef = doc(db, 'planos', planoId, 'recorrencias', recurrenceId);
  await updateDoc(recRef, {
    ativa: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reativa uma recorrência pausada (Regra 30).
 */
export async function resumeRecurrence(
  planoId: string,
  recurrenceId: string
): Promise<void> {
  const recRef = doc(db, 'planos', planoId, 'recorrencias', recurrenceId);
  const snap = await getDoc(recRef);
  if (!snap.exists()) throw new Error('Recorrência não encontrada.');

  const data = snap.data() as RecorrenciaFinanceira;
  const hoje = formatDateToString(new Date());

  // Se a próxima execução estiver no passado, recalcula a partir de hoje
  let proxima = data.proximaExecucao;
  if (proxima < hoje) {
    proxima = calculateInitialOccurrence({
      frequencia: data.frequencia,
      diaExecucao: data.diaExecucao,
      diaSemana: data.diaSemana,
      mesExecucao: data.mesExecucao,
      dataInicio: hoje,
    });
  }

  await updateDoc(recRef, {
    ativa: true,
    proximaExecucao: proxima,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Exclui uma recorrência sem apagar os lançamentos já gerados (Regra 28).
 */
export async function deleteRecurrence(
  planoId: string,
  recurrenceId: string
): Promise<void> {
  const recRef = doc(db, 'planos', planoId, 'recorrencias', recurrenceId);
  await deleteDoc(recRef);
}

/**
 * Executa manualmente uma recorrência agora (Regra 29).
 * Idempotente: impede duplicação mesmo em múltiplos cliques.
 */
export async function executeRecurrenceNow(
  planoId: string,
  recurrenceId: string
): Promise<string> {
  const hoje = formatDateToString(new Date());

  return await runTransaction(db, async (transaction) => {
    const recRef = doc(db, 'planos', planoId, 'recorrencias', recurrenceId);
    const recSnap = await transaction.get(recRef);
    if (!recSnap.exists()) {
      throw new Error('Recorrência não encontrada.');
    }

    const rec = recSnap.data() as RecorrenciaFinanceira;
    const dataPrevista = rec.proximaExecucao || hoje;

    // Idempotência estrita: chave lógica única (Regra 14)
    const execucaoDocId = `${recurrenceId}_${dataPrevista}`;
    const execRef = doc(
      db,
      'planos',
      planoId,
      'recorrencias',
      recurrenceId,
      'execucoes',
      execucaoDocId
    );
    const execSnap = await transaction.get(execRef);

    if (execSnap.exists()) {
      throw new Error(`A ocorrência de ${dataPrevista} já foi processada anteriormente.`);
    }

    // 1. Criar lançamento financeiro correspondente (Regras 17, 18, 19, 20)
    const lancamentoRef = doc(collection(db, 'planos', planoId, 'lancamentos'));
    const dataPrevistaDate = parseStringToDate(dataPrevista);
    const hojeDate = new Date();

    const timestampCompetencia = Timestamp.fromDate(dataPrevistaDate);
    const timestampCaixa = Timestamp.fromDate(hojeDate);

    transaction.set(lancamentoRef, {
      tipo: rec.tipo,
      descricao: rec.nome,
      valorCentavos: rec.valorCentavos,
      contaId: rec.contaId,
      contaDestinoId: rec.contaDestinoId || null,
      categoriaId: rec.categoriaId || null,
      donoId: rec.donoId || '',
      dataCompetencia: timestampCompetencia,
      dataCaixa: timestampCaixa,
      observacao: rec.observacao
        ? `[Recorrente] ${rec.observacao}`
        : `Lançamento gerado pela recorrência: ${rec.nome}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Criar registro de execução no histórico
    transaction.set(execRef, {
      recorrenciaId: recurrenceId,
      dataPrevista,
      dataExecucao: hoje,
      lancamentoId: lancamentoRef.id,
      status: 'gerada',
      createdAt: serverTimestamp(),
    });

    // 3. Atualizar próxima execução e verificar data final
    const novaProxima = getNextOccurrence(rec, dataPrevista);
    const finalizada = rec.dataFim && novaProxima > rec.dataFim;

    transaction.update(recRef, {
      proximaExecucao: novaProxima,
      ativa: finalizada ? false : rec.ativa,
      updatedAt: serverTimestamp(),
    });

    return lancamentoRef.id;
  });
}

/**
 * Processa todas as recorrências vencidas do plano (Regras 14, 15, 16).
 * Limite de segurança: no máximo 24 ocorrências por recorrência.
 */
export async function processDueRecurrences(
  planoId: string,
  referenceDateStr?: string
): Promise<{ processedCount: number; errors: string[] }> {
  const hoje = referenceDateStr || formatDateToString(new Date());
  const recorrenciasRef = collection(db, 'planos', planoId, 'recorrencias');
  const q = query(recorrenciasRef, where('ativa', '==', true));
  const snap = await getDocs(q);

  let processedCount = 0;
  const errors: string[] = [];
  const MAX_OCORRENCIAS_SEGURANCA = 24;

  for (const docSnap of snap.docs) {
    const rec = { id: docSnap.id, ...docSnap.data() } as RecorrenciaFinanceira;
    let currentProxima = rec.proximaExecucao;
    let loopCount = 0;

    // Enquanto a próxima execução for menor ou igual à data de referência
    while (currentProxima && currentProxima <= hoje && loopCount < MAX_OCORRENCIAS_SEGURANCA) {
      if (rec.dataFim && currentProxima > rec.dataFim) {
        await updateDoc(docSnap.ref, { ativa: false, updatedAt: serverTimestamp() });
        break;
      }

      loopCount++;
      const execDocId = `${rec.id}_${currentProxima}`;
      const execRef = doc(
        db,
        'planos',
        planoId,
        'recorrencias',
        rec.id,
        'execucoes',
        execDocId
      );

      try {
        const execSnap = await getDoc(execRef);
        if (!execSnap.exists()) {
          // Cria lançamento e execução
          const lancamentoRef = doc(collection(db, 'planos', planoId, 'lancamentos'));
          const dataPrevistaDate = parseStringToDate(currentProxima);
          const hojeDate = new Date();

          await runTransaction(db, async (t) => {
            t.set(lancamentoRef, {
              tipo: rec.tipo,
              descricao: rec.nome,
              valorCentavos: rec.valorCentavos,
              contaId: rec.contaId,
              contaDestinoId: rec.contaDestinoId || null,
              categoriaId: rec.categoriaId || null,
              donoId: rec.donoId || '',
              dataCompetencia: Timestamp.fromDate(dataPrevistaDate),
              dataCaixa: Timestamp.fromDate(hojeDate),
              observacao: rec.observacao
                ? `[Recorrente] ${rec.observacao}`
                : `Lançamento gerado pela recorrência: ${rec.nome}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            t.set(execRef, {
              recorrenciaId: rec.id,
              dataPrevista: currentProxima,
              dataExecucao: hoje,
              lancamentoId: lancamentoRef.id,
              status: 'gerada',
              createdAt: serverTimestamp(),
            });
          });

          processedCount++;
        }

        // Avança próxima execução
        const nextOccurrence = getNextOccurrence(rec, currentProxima);
        const finalizada = rec.dataFim && nextOccurrence > rec.dataFim;

        await updateDoc(docSnap.ref, {
          proximaExecucao: nextOccurrence,
          ativa: finalizada ? false : true,
          updatedAt: serverTimestamp(),
        });

        currentProxima = nextOccurrence;
      } catch (err: any) {
        errors.push(`Erro ao processar ${rec.nome} (${currentProxima}): ${err?.message}`);
        break;
      }
    }
  }

  return { processedCount, errors };
}

/**
 * Escuta todas as recorrências do plano em tempo real.
 */
export function subscribeRecurrences(
  planoId: string,
  callback: (recorrencias: RecorrenciaFinanceira[]) => void
): () => void {
  const recorrenciasRef = collection(db, 'planos', planoId, 'recorrencias');
  const q = query(recorrenciasRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: RecorrenciaFinanceira[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          nome: data.nome,
          tipo: data.tipo,
          valorCentavos: data.valorCentavos || 0,
          contaId: data.contaId,
          contaDestinoId: data.contaDestinoId,
          categoriaId: data.categoriaId,
          donoId: data.donoId ?? '',
          frequencia: data.frequencia || 'mensal',
          diaExecucao: data.diaExecucao,
          diaSemana: data.diaSemana,
          mesExecucao: data.mesExecucao,
          dataInicio: data.dataInicio || '',
          dataFim: data.dataFim || '',
          proximaExecucao: data.proximaExecucao || '',
          ativa: data.ativa !== false,
          observacao: data.observacao,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar recorrências:', err);
    }
  );
}

/**
 * Escuta as execuções históricas de uma recorrência.
 */
export function subscribeRecurrenceHistory(
  planoId: string,
  recurrenceId: string,
  callback: (execucoes: ExecucaoRecorrencia[]) => void
): () => void {
  const execsRef = collection(
    db,
    'planos',
    planoId,
    'recorrencias',
    recurrenceId,
    'execucoes'
  );
  const q = query(execsRef, orderBy('dataPrevista', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ExecucaoRecorrencia[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          recorrenciaId: data.recorrenciaId || recurrenceId,
          dataPrevista: data.dataPrevista,
          dataExecucao: data.dataExecucao,
          lancamentoId: data.lancamentoId,
          status: data.status || 'gerada',
          createdAt: data.createdAt,
        });
      });
      callback(list);
    },
    (err) => {
      console.error('Erro ao escutar histórico da recorrência:', err);
    }
  );
}
