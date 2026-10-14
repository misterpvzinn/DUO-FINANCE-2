import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import {
  LancamentoFinanceiro,
  TipoLancamento,
  ContaPlano,
  CategoriaPlano,
} from '../types/finance';
import {
  subscribeTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  CreateTransactionParams,
  UpdateTransactionParams,
} from '../services/transactions';
import {
  subscribeAccounts,
  subscribeCategories,
  ensurePlanSeedData,
} from '../services/planData';

export function useTransactions() {
  const { plano, mesSelecionado, regime, filtroPessoa } = useAuthAndPlan();

  const [rawTransactions, setRawTransactions] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contas e Categorias auxiliares
  const [accounts, setAccounts] = useState<ContaPlano[]>([]);
  const [categories, setCategories] = useState<CategoriaPlano[]>([]);
  const [loadingAux, setLoadingAux] = useState(true);

  // Filtros locais adicionais da listagem
  const [filtroTipo, setFiltroTipo] = useState<TipoLancamento | 'todos'>('todos');
  const [filtroConta, setFiltroConta] = useState<string | 'todas'>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string | 'todas'>('todas');

  // Inicializar contas/categorias padrão caso o plano seja novo
  useEffect(() => {
    if (!plano?.id) return;
    ensurePlanSeedData(plano.id).catch(console.error);
  }, [plano?.id]);

  // Escutar contas
  useEffect(() => {
    if (!plano?.id) {
      setAccounts([]);
      return;
    }
    const unsub = subscribeAccounts(plano.id, (list) => {
      setAccounts(list);
    });
    return () => unsub();
  }, [plano?.id]);

  // Escutar categorias
  useEffect(() => {
    if (!plano?.id) {
      setCategories([]);
      return;
    }
    const unsub = subscribeCategories(plano.id, (list) => {
      setCategories(list);
      setLoadingAux(false);
    });
    return () => unsub();
  }, [plano?.id]);

  // Escutar Lançamentos do Firestore
  useEffect(() => {
    if (!plano?.id) {
      setRawTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeTransactions(
      plano.id,
      {
        mes: mesSelecionado,
        regime: regime as any,
        filtroPessoa,
        tipo: filtroTipo,
        contaId: filtroConta,
        categoriaId: filtroCategoria,
      },
      (data) => {
        setRawTransactions(data);
        setLoading(false);
      },
      (err) => {
        setError('Não foi possível carregar os lançamentos.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [plano?.id, mesSelecionado, regime, filtroPessoa, filtroTipo, filtroConta, filtroCategoria]);

  // Funções de mutação
  const handleCreate = useCallback(
    async (params: CreateTransactionParams): Promise<string> => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await createTransaction(plano.id, params);
    },
    [plano?.id]
  );

  const handleUpdate = useCallback(
    async (lancamentoId: string, params: UpdateTransactionParams): Promise<void> => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await updateTransaction(plano.id, lancamentoId, params);
    },
    [plano?.id]
  );

  const handleDelete = useCallback(
    async (lancamentoId: string): Promise<void> => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await deleteTransaction(plano.id, lancamentoId);
    },
    [plano?.id]
  );

  // Mapeamentos rápidos de ID -> Nome/Cor
  const accountsMap = useMemo(() => {
    const map = new Map<string, ContaPlano>();
    accounts.forEach((acc) => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, CategoriaPlano>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  return {
    transactions: rawTransactions,
    loading,
    error,
    accounts,
    categories,
    loadingAux,
    accountsMap,
    categoriesMap,
    addTransaction: handleCreate,
    editTransaction: handleUpdate,
    removeTransaction: handleDelete,
    // Filtros
    filtroTipo,
    setFiltroTipo,
    filtroConta,
    setFiltroConta,
    filtroCategoria,
    setFiltroCategoria,
  };
}
