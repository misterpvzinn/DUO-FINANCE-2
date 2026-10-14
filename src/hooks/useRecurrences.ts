import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { RecorrenciaFinanceira } from '../types/recurrence';
import { ContaPlano, CategoriaPlano } from '../types/finance';
import {
  createRecurrence as createService,
  updateRecurrence as updateService,
  pauseRecurrence as pauseService,
  resumeRecurrence as resumeService,
  deleteRecurrence as deleteService,
  executeRecurrenceNow as executeNowService,
  processDueRecurrences as processDueService,
  subscribeRecurrences,
  CreateRecurrenceParams,
} from '../services/recurrences';
import { subscribeAccounts, subscribeCategories } from '../services/planData';

export function useRecurrences() {
  const { plano } = useAuthAndPlan();
  const [recurrences, setRecurrences] = useState<RecorrenciaFinanceira[]>([]);
  const [accounts, setAccounts] = useState<ContaPlano[]>([]);
  const [categories, setCategories] = useState<CategoriaPlano[]>([]);
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  // 1. Escutar recorrências
  useEffect(() => {
    if (!plano?.id) {
      setRecurrences([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeRecurrences(plano.id, (list) => {
      setRecurrences(list);
      setLoading(false);
    });

    return () => unsub();
  }, [plano?.id]);

  // 2. Processar recorrências vencidas automaticamente ao abrir
  useEffect(() => {
    if (!plano?.id || processedRef.current) return;
    processedRef.current = true;

    processDueService(plano.id).catch((err) => {
      console.warn('Processamento de recorrências pendentes:', err);
    });
  }, [plano?.id]);

  // 3. Escutar contas e categorias
  useEffect(() => {
    if (!plano?.id) {
      setAccounts([]);
      setCategories([]);
      return;
    }

    const unsubAcc = subscribeAccounts(plano.id, setAccounts);
    const unsubCat = subscribeCategories(plano.id, setCategories);

    return () => {
      unsubAcc();
      unsubCat();
    };
  }, [plano?.id]);

  // Mapas rápidos
  const accountsMap = useMemo(() => {
    const map = new Map<string, ContaPlano>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, CategoriaPlano>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const activeRecurrences = useMemo(
    () => recurrences.filter((r) => r.ativa),
    [recurrences]
  );

  const inactiveRecurrences = useMemo(
    () => recurrences.filter((r) => !r.ativa),
    [recurrences]
  );

  // Próximas 5 para o Dashboard (Regra 32)
  const upcomingRecurrences = useMemo(() => {
    return [...activeRecurrences]
      .filter((r) => !!r.proximaExecucao)
      .sort((a, b) => a.proximaExecucao.localeCompare(b.proximaExecucao))
      .slice(0, 5);
  }, [activeRecurrences]);

  const createRecurrence = async (params: CreateRecurrenceParams) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await createService(plano.id, params);
  };

  const updateRecurrence = async (
    id: string,
    params: Partial<RecorrenciaFinanceira>
  ) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await updateService(plano.id, id, params);
  };

  const pauseRecurrence = async (id: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await pauseService(plano.id, id);
  };

  const resumeRecurrence = async (id: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await resumeService(plano.id, id);
  };

  const deleteRecurrence = async (id: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await deleteService(plano.id, id);
  };

  const executeNow = async (id: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await executeNowService(plano.id, id);
  };

  const processDue = async () => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await processDueService(plano.id);
  };

  return {
    recurrences,
    activeRecurrences,
    inactiveRecurrences,
    upcomingRecurrences,
    accounts,
    categories,
    accountsMap,
    categoriesMap,
    loading,
    createRecurrence,
    updateRecurrence,
    pauseRecurrence,
    resumeRecurrence,
    deleteRecurrence,
    executeNow,
    processDue,
  };
}
