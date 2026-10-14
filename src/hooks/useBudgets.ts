import { useState, useEffect, useMemo } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import {
  OrcamentoFinanceiro,
  BudgetUsage,
  BudgetSummary,
} from '../types/goalsAndBudgets';
import {
  LancamentoFinanceiro,
  CategoriaPlano,
  RegimeFinanceiro,
} from '../types/finance';
import {
  createBudget as createBudgetService,
  updateBudget as updateBudgetService,
  disableBudget as disableBudgetService,
  deleteBudget as deleteBudgetService,
  subscribeBudgets,
  CreateBudgetParams,
} from '../services/budgets';
import { subscribeCategories } from '../services/planData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  calculateBudgetUsage,
  calculateBudgetSummary,
} from '../utils/goalsAndBudgets';

export function useBudgets(customMonth?: string) {
  const { plano, mesSelecionado, regime, filtroPessoa } = useAuthAndPlan();

  const [activeMonth, setActiveMonth] = useState<string>(
    customMonth || mesSelecionado
  );

  // Sincroniza se customMonth mudar
  useEffect(() => {
    if (customMonth) {
      setActiveMonth(customMonth);
    } else {
      setActiveMonth(mesSelecionado);
    }
  }, [customMonth, mesSelecionado]);

  const [allBudgets, setAllBudgets] = useState<OrcamentoFinanceiro[]>([]);
  const [categories, setCategories] = useState<CategoriaPlano[]>([]);
  const [transactions, setTransactions] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Escutar Orçamentos
  useEffect(() => {
    if (!plano?.id) {
      setAllBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeBudgets(plano.id, (list) => {
      setAllBudgets(list);
      setLoading(false);
    });

    return () => unsub();
  }, [plano?.id]);

  // 2. Escutar Categorias
  useEffect(() => {
    if (!plano?.id) {
      setCategories([]);
      return;
    }

    const unsub = subscribeCategories(plano.id, (cats) => {
      setCategories(cats);
    });

    return () => unsub();
  }, [plano?.id]);

  // 3. Escutar Lançamentos para cálculo de consumo
  useEffect(() => {
    if (!plano?.id) {
      setTransactions([]);
      return;
    }

    const lancamentosRef = collection(db, 'planos', plano.id, 'lancamentos');
    const unsub = onSnapshot(lancamentosRef, (snap) => {
      const list: LancamentoFinanceiro[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          tipo: data.tipo,
          descricao: data.descricao,
          valorCentavos: data.valorCentavos,
          contaId: data.contaId,
          contaDestinoId: data.contaDestinoId,
          categoriaId: data.categoriaId,
          donoId: data.donoId ?? '',
          dataCompetencia: data.dataCompetencia,
          dataCaixa: data.dataCaixa,
          observacao: data.observacao,
          cartaoId: data.cartaoId,
          compraCartaoId: data.compraCartaoId,
          parcelaCartaoId: data.parcelaCartaoId,
          faturaId: data.faturaId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setTransactions(list);
    });

    return () => unsub();
  }, [plano?.id]);

  // Mapas rápidos
  const categoriesMap = useMemo(() => {
    const map = new Map<string, CategoriaPlano>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Orçamentos ativos do mês selecionado
  const currentMonthBudgets = useMemo(() => {
    return allBudgets.filter(
      (b) => b.ativo && b.mesReferencia === activeMonth
    );
  }, [allBudgets, activeMonth]);

  // Cálculo de utilização para cada orçamento do mês
  const budgetUsages: BudgetUsage[] = useMemo(() => {
    return currentMonthBudgets.map((b) => {
      const cat = categoriesMap.get(b.categoriaId);
      return calculateBudgetUsage(
        b,
        transactions,
        cat,
        regime as RegimeFinanceiro,
        filtroPessoa
      );
    });
  }, [currentMonthBudgets, transactions, categoriesMap, regime, filtroPessoa]);

  // Resumo consolidado do mês
  const summary: BudgetSummary = useMemo(() => {
    return calculateBudgetSummary(budgetUsages);
  }, [budgetUsages]);

  const createBudget = async (params: CreateBudgetParams) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await createBudgetService(plano.id, params);
  };

  const updateBudget = async (
    budgetId: string,
    params: Partial<OrcamentoFinanceiro>
  ) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await updateBudgetService(plano.id, budgetId, params);
  };

  const disableBudget = async (budgetId: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await disableBudgetService(plano.id, budgetId);
  };

  const deleteBudget = async (budgetId: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await deleteBudgetService(plano.id, budgetId);
  };

  return {
    allBudgets,
    currentMonthBudgets,
    budgetUsages,
    summary,
    categories,
    categoriesMap,
    loading,
    activeMonth,
    setActiveMonth,
    createBudget,
    updateBudget,
    disableBudget,
    deleteBudget,
  };
}
