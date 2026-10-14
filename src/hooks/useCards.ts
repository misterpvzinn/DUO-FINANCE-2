import { useState, useEffect, useCallback } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { CartaoCredito } from '../types/finance';
import {
  subscribeCards,
  createCard,
  updateCard,
  toggleCardActive,
  CreateCardParams,
  UpdateCardParams,
} from '../services/cards';

export function useCards() {
  const { plano } = useAuthAndPlan();
  const [cards, setCards] = useState<CartaoCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apenasAtivos, setApenasAtivos] = useState(false);

  useEffect(() => {
    if (!plano?.id) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeCards(
      plano.id,
      (list) => {
        setCards(list);
        setLoading(false);
      },
      { apenasAtivos }
    );

    return () => unsub();
  }, [plano?.id, apenasAtivos]);

  const handleCreate = useCallback(
    async (params: CreateCardParams) => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await createCard(plano.id, params);
    },
    [plano?.id]
  );

  const handleUpdate = useCallback(
    async (cartaoId: string, params: UpdateCardParams) => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await updateCard(plano.id, cartaoId, params);
    },
    [plano?.id]
  );

  const handleToggle = useCallback(
    async (cartaoId: string, ativo: boolean) => {
      if (!plano?.id) throw new Error('Plano não carregado.');
      return await toggleCardActive(plano.id, cartaoId, ativo);
    },
    [plano?.id]
  );

  return {
    cards,
    loading,
    error,
    apenasAtivos,
    setApenasAtivos,
    addCard: handleCreate,
    editCard: handleUpdate,
    toggleCardActive: handleToggle,
  };
}
