import { useState, useEffect } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { ExecucaoRecorrencia } from '../types/recurrence';
import { subscribeRecurrenceHistory } from '../services/recurrences';

export function useRecurrenceExecutions(recurrenceId?: string) {
  const { plano } = useAuthAndPlan();
  const [executions, setExecutions] = useState<ExecucaoRecorrencia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!plano?.id || !recurrenceId) {
      setExecutions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeRecurrenceHistory(
      plano.id,
      recurrenceId,
      (list) => {
        setExecutions(list);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [plano?.id, recurrenceId]);

  return { executions, loading };
}
