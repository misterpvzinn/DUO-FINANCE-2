import { useState, useEffect, useMemo } from 'react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { MetaFinanceira, GoalProgress } from '../types/goalsAndBudgets';
import {
  createGoal as createGoalService,
  updateGoal as updateGoalService,
  addGoalContribution as addContributionService,
  completeGoal as completeGoalService,
  cancelGoal as cancelGoalService,
  reactivateGoal as reactivateGoalService,
  subscribeGoals,
  CreateGoalParams,
  AddGoalContributionParams,
} from '../services/goals';
import { calculateGoalProgress } from '../utils/goalsAndBudgets';

export interface GoalWithProgress {
  goal: MetaFinanceira;
  progress: GoalProgress;
}

export function useGoals() {
  const { plano } = useAuthAndPlan();
  const [goals, setGoals] = useState<MetaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!plano?.id) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeGoals(plano.id, (list) => {
      setGoals(list);
      setLoading(false);
    });

    return () => unsub();
  }, [plano?.id]);

  const goalsWithProgress: GoalWithProgress[] = useMemo(() => {
    return goals.map((goal) => ({
      goal,
      progress: calculateGoalProgress(goal),
    }));
  }, [goals]);

  const activeGoals = useMemo(
    () => goalsWithProgress.filter((item) => item.goal.status === 'ativa'),
    [goalsWithProgress]
  );

  const completedGoals = useMemo(
    () => goalsWithProgress.filter((item) => item.goal.status === 'concluida'),
    [goalsWithProgress]
  );

  const cancelledGoals = useMemo(
    () => goalsWithProgress.filter((item) => item.goal.status === 'cancelada'),
    [goalsWithProgress]
  );

  const createGoal = async (params: CreateGoalParams) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await createGoalService(plano.id, params);
  };

  const updateGoal = async (goalId: string, params: Partial<MetaFinanceira>) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await updateGoalService(plano.id, goalId, params);
  };

  const addContribution = async (
    goalId: string,
    params: AddGoalContributionParams
  ) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await addContributionService(plano.id, goalId, params);
  };

  const completeGoal = async (goalId: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await completeGoalService(plano.id, goalId);
  };

  const cancelGoal = async (goalId: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await cancelGoalService(plano.id, goalId);
  };

  const reactivateGoal = async (goalId: string) => {
    if (!plano?.id) throw new Error('Plano não carregado.');
    return await reactivateGoalService(plano.id, goalId);
  };

  return {
    goals,
    goalsWithProgress,
    activeGoals,
    completedGoals,
    cancelledGoals,
    loading,
    createGoal,
    updateGoal,
    addContribution,
    completeGoal,
    cancelGoal,
    reactivateGoal,
  };
}
