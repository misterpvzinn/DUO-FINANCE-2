import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { FaturaCartao, CartaoCredito } from '../types/finance';
import { subscribeInvoices, payInvoice } from '../services/invoices';
import { calculateCardLimits } from '../services/cardPurchases';

export function useInvoices(cartao: CartaoCredito | null) {
  const { plano } = useAuthAndPlan();
  const [invoices, setInvoices] = useState<FaturaCartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartaoId = cartao?.id;

  useEffect(() => {
    if (!plano?.id || !cartaoId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeInvoices(plano.id, cartaoId, (list) => {
      setInvoices(list);
      setLoading(false);
    });

    return () => unsub();
  }, [plano?.id, cartaoId]);

  const limits = useMemo(() => {
    if (!cartao) {
      return {
        limiteTotalCentavos: 0,
        limiteUtilizadoCentavos: 0,
        limiteDisponivelCentavos: 0,
        percentualUtilizado: 0,
      };
    }
    return calculateCardLimits(cartao, invoices);
  }, [cartao, invoices]);

  const handlePay = useCallback(
    async (params: {
      faturaId: string;
      contaPagamentoId: string;
      valorCentavos: number;
      dataPagamento: string;
      donoId: string;
    }) => {
      if (!plano?.id || !cartaoId) throw new Error('Dados incompletos.');
      return await payInvoice({
        planoId: plano.id,
        cartaoId,
        ...params,
      });
    },
    [plano?.id, cartaoId]
  );

  return {
    invoices,
    loading,
    error,
    limits,
    payInvoice: handlePay,
  };
}
