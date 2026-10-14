import { useState, useEffect, useCallback } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { CompraCartao, ParcelaCartao } from '../types/finance';
import {
  subscribeCardPurchases,
  createCardPurchase,
  getInvoiceInstallments,
  CreateCardPurchaseParams,
} from '../services/cardPurchases';

export function useCardPurchases(cartaoId?: string) {
  const { plano } = useAuthAndPlan();
  const [purchases, setPurchases] = useState<CompraCartao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plano?.id || !cartaoId) {
      setPurchases([]);
      return;
    }

    setLoading(true);
    const unsub = subscribeCardPurchases(plano.id, cartaoId, (list) => {
      setPurchases(list);
      setLoading(false);
    });

    return () => unsub();
  }, [plano?.id, cartaoId]);

  const handleCreatePurchase = useCallback(
    async (params: CreateCardPurchaseParams) => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await createCardPurchase(plano.id, params);
    },
    [plano?.id]
  );

  const fetchInvoiceItems = useCallback(
    async (targetCartaoId: string, faturaId: string) => {
      if (!plano?.id) return [];
      return await getInvoiceInstallments(plano.id, targetCartaoId, faturaId);
    },
    [plano?.id]
  );

  return {
    purchases,
    loading,
    error,
    addPurchase: handleCreatePurchase,
    fetchInvoiceItems,
  };
}
