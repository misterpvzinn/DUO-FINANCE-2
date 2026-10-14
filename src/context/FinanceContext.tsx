import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Transaction,
  Category,
  Account,
  Budget,
  FinancialGoal,
  TransactionType,
  CoupleSettings,
  CoupleViewFilter,
  TransactionOwner,
  FinanceViewMode,
} from '../types/finance';
import { getCurrentYearMonth } from '../utils/formatters';

export interface CoupleSettlementSummary {
  totalShared: number;
  paidByUser1: number;
  paidByUser2: number;
  paidByJoint: number;
  user1IdealShare: number;
  user2IdealShare: number;
  balanceDiff: number; // positive = user2 owes user1; negative = user1 owes user2
  debtorName: string;
  creditorName: string;
  amountOwed: number;
  statusText: string;
  isSettled: boolean;
}

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  goals: FinancialGoal[];
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  // Viewing mode tracking
  viewMode: FinanceViewMode;
  setViewMode: (mode: FinanceViewMode) => void;
  // Couple feature state
  coupleSettings: CoupleSettings;
  updateCoupleSettings: (settings: Partial<CoupleSettings>) => void;
  coupleFilter: CoupleViewFilter;
  setCoupleFilter: (filter: CoupleViewFilter) => void;
  settlementSummary: CoupleSettlementSummary;
  recordSettlementPayment: () => void;
  // Transactions actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addTransactionsBatch: (txs: Array<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  updateTransaction: (id: string, tx: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  // Category actions
  addCategory: (cat: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  // Budget actions
  setBudgetLimit: (categoryId: string, monthlyLimit: number, month?: string) => void;
  deleteBudget: (id: string) => void;
  // Goal actions
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<Omit<FinancialGoal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  // Calculated summaries
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  netWorth: number;
  resetToDefaultData: () => void;
}

const DEFAULT_COUPLE_SETTINGS: CoupleSettings = {
  enabled: true,
  user1Name: 'Paulo',
  user2Name: 'Ana',
  user1Color: '#3b82f6',
  user2Color: '#ec4899',
  defaultSplitPercentage: 50,
  sharedAccountIds: ['acc-joint', 'acc-card', 'acc-invest'],
  hidePersonalFromJoint: false,
  allowPartnerToViewBalance: true,
  autoShareReceipts: true,
};

const DEFAULT_CATEGORIES: Category[] = [
  // Receitas
  { id: 'cat-salario', name: 'Salário & Honorários', type: 'income', group: 'income', color: '#10b981' },
  { id: 'cat-freelance', name: 'Freelance & Consultoria', type: 'income', group: 'income', color: '#06b6d4' },
  { id: 'cat-rendimentos', name: 'Rendimentos de Investimento', type: 'income', group: 'income', color: '#3b82f6' },
  { id: 'cat-outras-rec', name: 'Outras Receitas', type: 'income', group: 'income', color: '#8b5cf6' },
  // Despesas - Custos Fixos
  { id: 'cat-moradia', name: 'Moradia (Aluguel/Condomínio)', type: 'expense', group: 'fixed_cost', color: '#6366f1' },
  { id: 'cat-contas-casa', name: 'Contas Básicas (Luz, Água, Net)', type: 'expense', group: 'fixed_cost', color: '#8b5cf6' },
  { id: 'cat-saude', name: 'Saúde & Farmácia', type: 'expense', group: 'fixed_cost', color: '#ec4899' },
  { id: 'cat-educacao', name: 'Educação & Cursos', type: 'expense', group: 'fixed_cost', color: '#f43f5e' },
  // Despesas - Custos Variáveis
  { id: 'cat-alimentacao', name: 'Alimentação & Supermercado', type: 'expense', group: 'variable_cost', color: '#f97316' },
  { id: 'cat-transporte', name: 'Transporte & Combustível', type: 'expense', group: 'variable_cost', color: '#eab308' },
  // Lazer
  { id: 'cat-lazer', name: 'Lazer & Restaurantes', type: 'expense', group: 'leisure', color: '#14b8a6' },
  // Investimentos
  { id: 'cat-investimentos', name: 'Aportes em Investimentos', type: 'expense', group: 'investment', color: '#0ea5e9' },
  // Outros
  { id: 'cat-outros', name: 'Outros Gastos', type: 'expense', group: 'variable_cost', color: '#64748b' },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-checking-paulo', name: 'Conta Corrente (Paulo)', type: 'checking', initialBalance: 3450, owner: 'user1' },
  { id: 'acc-checking-ana', name: 'Conta Corrente (Ana)', type: 'checking', initialBalance: 2900, owner: 'user2' },
  { id: 'acc-joint', name: 'Conta Conjunta (Casal)', type: 'checking', initialBalance: 4800, owner: 'joint' },
  { id: 'acc-card', name: 'Cartão de Crédito Compartilhado', type: 'credit_card', initialBalance: 0, owner: 'joint' },
  { id: 'acc-wallet', name: 'Carteira (Dinheiro)', type: 'wallet', initialBalance: 200, owner: 'user1' },
  { id: 'acc-invest', name: 'Investimentos do Casal', type: 'investment', initialBalance: 28000, owner: 'joint' },
];

function getInitialTransactions(): Transaction[] {
  const currentYM = getCurrentYearMonth();
  return [
    {
      id: 'tx-1',
      description: 'Salário Paulo',
      amount: 8500,
      date: `${currentYM}-05`,
      type: 'income',
      categoryId: 'cat-salario',
      accountId: 'acc-checking-paulo',
      notes: 'Depósito em conta',
      createdAt: Date.now() - 25 * 86400000,
      paidBy: 'user1',
      isShared: false,
    },
    {
      id: 'tx-1b',
      description: 'Salário Ana',
      amount: 7200,
      date: `${currentYM}-05`,
      type: 'income',
      categoryId: 'cat-salario',
      accountId: 'acc-checking-ana',
      notes: 'Depósito em conta',
      createdAt: Date.now() - 25 * 86400000,
      paidBy: 'user2',
      isShared: false,
    },
    {
      id: 'tx-2',
      description: 'Projeto Consultoria',
      amount: 2200,
      date: `${currentYM}-12`,
      type: 'income',
      categoryId: 'cat-freelance',
      accountId: 'acc-checking-paulo',
      notes: 'Serviço prestado',
      createdAt: Date.now() - 18 * 86400000,
      paidBy: 'user1',
      isShared: false,
    },
    {
      id: 'tx-3',
      description: 'Aluguel do Apartamento',
      amount: 2400,
      date: `${currentYM}-06`,
      type: 'expense',
      categoryId: 'cat-moradia',
      accountId: 'acc-checking-paulo',
      createdAt: Date.now() - 24 * 86400000,
      paidBy: 'user1',
      isShared: true,
      user1SharePercentage: 50,
    },
    {
      id: 'tx-4',
      description: 'Supermercado Mensal',
      amount: 1150,
      date: `${currentYM}-08`,
      type: 'expense',
      categoryId: 'cat-alimentacao',
      accountId: 'acc-card',
      createdAt: Date.now() - 22 * 86400000,
      paidBy: 'user2',
      isShared: true,
      user1SharePercentage: 50,
    },
    {
      id: 'tx-5',
      description: 'Combustível Carro',
      amount: 320,
      date: `${currentYM}-11`,
      type: 'expense',
      categoryId: 'cat-transporte',
      accountId: 'acc-card',
      createdAt: Date.now() - 19 * 86400000,
      paidBy: 'user1',
      isShared: true,
      user1SharePercentage: 50,
    },
    {
      id: 'tx-6',
      description: 'Internet & Energia',
      amount: 380,
      date: `${currentYM}-10`,
      type: 'expense',
      categoryId: 'cat-contas-casa',
      accountId: 'acc-checking-ana',
      createdAt: Date.now() - 20 * 86400000,
      paidBy: 'user2',
      isShared: true,
      user1SharePercentage: 50,
    },
    {
      id: 'tx-7',
      description: 'Aporte Tesouro Direto & Fundos',
      amount: 1800,
      date: `${currentYM}-15`,
      type: 'expense',
      categoryId: 'cat-investimentos',
      accountId: 'acc-invest',
      notes: 'Investimento conjunto',
      createdAt: Date.now() - 15 * 86400000,
      paidBy: 'joint',
      isShared: true,
    },
    {
      id: 'tx-8',
      description: 'Jantar a Dois',
      amount: 260,
      date: `${currentYM}-18`,
      type: 'expense',
      categoryId: 'cat-lazer',
      accountId: 'acc-card',
      createdAt: Date.now() - 12 * 86400000,
      paidBy: 'user1',
      isShared: true,
      user1SharePercentage: 50,
    },
    {
      id: 'tx-9',
      description: 'Farmácia & Cuidados',
      amount: 145,
      date: `${currentYM}-20`,
      type: 'expense',
      categoryId: 'cat-saude',
      accountId: 'acc-card',
      createdAt: Date.now() - 10 * 86400000,
      paidBy: 'user2',
      isShared: true,
      user1SharePercentage: 50,
    },
  ];
}

function getInitialBudgets(): Budget[] {
  const currentYM = getCurrentYearMonth();
  return [
    { id: 'b-1', categoryId: 'cat-alimentacao', monthlyLimit: 1400, month: currentYM },
    { id: 'b-2', categoryId: 'cat-moradia', monthlyLimit: 2600, month: currentYM },
    { id: 'b-3', categoryId: 'cat-transporte', monthlyLimit: 600, month: currentYM },
    { id: 'b-4', categoryId: 'cat-lazer', monthlyLimit: 500, month: currentYM },
    { id: 'b-5', categoryId: 'cat-saude', monthlyLimit: 400, month: currentYM },
  ];
}

function getInitialGoals(): FinancialGoal[] {
  return [
    {
      id: 'g-1',
      title: 'Reserva do Casal (6 meses)',
      targetAmount: 40000,
      currentAmount: 26500,
      deadline: '2026-12-31',
      color: '#10b981',
      category: 'Segurança',
    },
    {
      id: 'g-2',
      title: 'Viagem de Férias a Dois',
      targetAmount: 15000,
      currentAmount: 9200,
      deadline: '2026-11-20',
      color: '#3b82f6',
      category: 'Lazer',
    },
    {
      id: 'g-3',
      title: 'Reforma do Apartamento',
      targetAmount: 20000,
      currentAmount: 7500,
      deadline: '2027-04-30',
      color: '#ec4899',
      category: 'Moradia',
    },
  ];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentYearMonth());

  const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>(() => {
    const saved = localStorage.getItem('finance_couple_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user2Name === 'Camila') {
          parsed.user2Name = 'Ana';
        }
        return parsed;
      } catch {
        return DEFAULT_COUPLE_SETTINGS;
      }
    }
    return DEFAULT_COUPLE_SETTINGS;
  });

  const [viewMode, setViewModeState] = useState<FinanceViewMode>(() => {
    const saved = localStorage.getItem('finance_view_mode');
    return saved === 'personal' ? 'personal' : 'couple';
  });

  const [coupleFilter, setCoupleFilterState] = useState<CoupleViewFilter>(() => {
    const saved = localStorage.getItem('finance_view_mode');
    return saved === 'personal' ? 'user1' : 'all';
  });

  const setViewMode = (mode: FinanceViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('finance_view_mode', mode);
    if (mode === 'personal') {
      setCoupleFilterState('user1');
    } else {
      setCoupleFilterState('all');
    }
  };

  const setCoupleFilter = (filter: CoupleViewFilter) => {
    setCoupleFilterState(filter);
    if (filter === 'user1') {
      setViewModeState('personal');
      localStorage.setItem('finance_view_mode', 'personal');
    } else {
      setViewModeState('couple');
      localStorage.setItem('finance_view_mode', 'couple');
    }
  };

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('finance_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('finance_accounts');
    if (saved) {
      try {
        const parsed: Account[] = JSON.parse(saved);
        return parsed.map((acc) =>
          acc.name.includes('Camila')
            ? { ...acc, name: acc.name.replace('Camila', 'Ana'), id: acc.id.replace('camila', 'ana') }
            : acc
        );
      } catch {
        return DEFAULT_ACCOUNTS;
      }
    }
    return DEFAULT_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
      try {
        const parsed: Transaction[] = JSON.parse(saved);
        return parsed.map((tx) => ({
          ...tx,
          description: tx.description.replace('Camila', 'Ana'),
          notes: tx.notes ? tx.notes.replace('Camila', 'Ana') : tx.notes,
          accountId: tx.accountId.replace('camila', 'ana'),
        }));
      } catch {
        return getInitialTransactions();
      }
    }
    return getInitialTransactions();
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('finance_budgets');
    return saved ? JSON.parse(saved) : getInitialBudgets();
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem('finance_goals');
    return saved ? JSON.parse(saved) : getInitialGoals();
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('finance_couple_settings', JSON.stringify(coupleSettings));
  }, [coupleSettings]);

  useEffect(() => {
    localStorage.setItem('finance_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finance_goals', JSON.stringify(goals));
  }, [goals]);

  const updateCoupleSettings = (newSettings: Partial<CoupleSettings>) => {
    setCoupleSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Transaction Actions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      paidBy: tx.paidBy || 'user1',
      isShared: tx.isShared ?? false,
      user1SharePercentage: tx.user1SharePercentage ?? coupleSettings.defaultSplitPercentage,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const addTransactionsBatch = (newItems: Array<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const timestamp = Date.now();
    const formatted: Transaction[] = newItems.map((tx, idx) => ({
      ...tx,
      id: `tx-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: timestamp + idx,
      paidBy: tx.paidBy || 'user1',
      isShared: tx.isShared ?? false,
      user1SharePercentage: tx.user1SharePercentage ?? coupleSettings.defaultSplitPercentage,
    }));
    setTransactions((prev) => [...formatted, ...prev]);
  };

  const updateTransaction = (id: string, tx: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...tx } : item))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  // Category Actions
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((item) => item.id !== id));
  };

  // Budget Actions
  const setBudgetLimit = (categoryId: string, monthlyLimit: number, month?: string) => {
    const targetMonth = month || selectedMonth;
    setBudgets((prev) => {
      const existingIndex = prev.findIndex(
        (b) => b.categoryId === categoryId && b.month === targetMonth
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], monthlyLimit };
        return copy;
      }
      return [
        ...prev,
        {
          id: `b-${Date.now()}`,
          categoryId,
          monthlyLimit,
          month: targetMonth,
        },
      ];
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // Goals Actions
  const addGoal = (goal: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: `g-${Date.now()}`,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = (id: string, goal: Partial<Omit<FinancialGoal, 'id'>>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...goal } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const resetToDefaultData = () => {
    setCoupleSettings(DEFAULT_COUPLE_SETTINGS);
    setCategories(DEFAULT_CATEGORIES);
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions(getInitialTransactions());
    setBudgets(getInitialBudgets());
    setGoals(getInitialGoals());
    setSelectedMonth(getCurrentYearMonth());
    setViewMode('couple');
  };

  // Couple Settlement Calculations for the selected month
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(selectedMonth));

  // Shared expenses: where isShared is true and type is expense
  const sharedExpenseTxs = monthTransactions.filter((tx) => tx.type === 'expense' && tx.isShared);
  const totalShared = sharedExpenseTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const paidByUser1 = sharedExpenseTxs
    .filter((tx) => tx.paidBy === 'user1')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const paidByUser2 = sharedExpenseTxs
    .filter((tx) => tx.paidBy === 'user2')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const paidByJoint = sharedExpenseTxs
    .filter((tx) => tx.paidBy === 'joint')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Remaining shared that was paid out-of-pocket by user1 or user2 (excluding joint account which is already 50/50)
  const user1Ratio = coupleSettings.defaultSplitPercentage / 100;
  const user2Ratio = (100 - coupleSettings.defaultSplitPercentage) / 100;

  const outOfPocketShared = paidByUser1 + paidByUser2;
  const user1IdealShare = outOfPocketShared * user1Ratio;
  const user2IdealShare = outOfPocketShared * user2Ratio;

  // If user1 paid more than their ideal share, user2 owes user1
  const balanceDiff = paidByUser1 - user1IdealShare;
  const amountOwed = Math.abs(balanceDiff);

  let debtorName = '';
  let creditorName = '';
  let statusText = '';
  let isSettled = amountOwed < 0.5;

  if (isSettled) {
    statusText = 'Contas compartilhadas equilibradas!';
  } else if (balanceDiff > 0) {
    debtorName = coupleSettings.user2Name;
    creditorName = coupleSettings.user1Name;
    statusText = `${debtorName} deve para ${creditorName}`;
  } else {
    debtorName = coupleSettings.user1Name;
    creditorName = coupleSettings.user2Name;
    statusText = `${debtorName} deve para ${creditorName}`;
  }

  const settlementSummary: CoupleSettlementSummary = {
    totalShared,
    paidByUser1,
    paidByUser2,
    paidByJoint,
    user1IdealShare,
    user2IdealShare,
    balanceDiff,
    debtorName,
    creditorName,
    amountOwed,
    statusText,
    isSettled,
  };

  // Record settlement payment action
  const recordSettlementPayment = () => {
    if (isSettled || amountOwed <= 0) return;
    const nowStr = new Date().toISOString().split('T')[0];

    // Add settlement transaction
    addTransaction({
      description: `Acerto do Casal: ${debtorName} ➔ ${creditorName}`,
      amount: Math.round(amountOwed * 100) / 100,
      date: nowStr,
      type: 'expense',
      categoryId: 'cat-outras-rec',
      accountId: 'acc-joint',
      notes: `Transferência de acerto de contas de ${debtorName} para ${creditorName}.`,
      paidBy: debtorName === coupleSettings.user1Name ? 'user1' : 'user2',
      isShared: false,
    });
  };

  // Filtered view transactions (when user chooses 'all' vs 'user1' vs 'user2' vs 'shared')
  const viewTransactions = transactions.filter((tx) => {
    if (!coupleSettings.enabled || coupleFilter === 'all') return true;
    if (coupleFilter === 'user1') return tx.paidBy === 'user1';
    if (coupleFilter === 'user2') return tx.paidBy === 'user2';
    if (coupleFilter === 'shared') return tx.isShared || tx.paidBy === 'joint';
    return true;
  });

  const filteredMonthTransactions = viewTransactions.filter((tx) =>
    tx.date.startsWith(selectedMonth)
  );

  const monthlyIncome = filteredMonthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpense = filteredMonthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Overall Balance calculation across all transactions
  const totalAllIncome = viewTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalAllExpense = viewTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const relevantAccounts = accounts.filter((acc) => {
    if (!coupleSettings.enabled || coupleFilter === 'all') return true;
    if (coupleFilter === 'user1') return acc.owner === 'user1' || !acc.owner;
    if (coupleFilter === 'user2') return acc.owner === 'user2';
    if (coupleFilter === 'shared') return acc.owner === 'joint';
    return true;
  });

  const initialBalanceSum = relevantAccounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
  const currentBalance = initialBalanceSum + totalAllIncome - totalAllExpense;

  const investmentAccount = relevantAccounts.find((a) => a.type === 'investment');
  const netWorth = currentBalance + (investmentAccount ? investmentAccount.initialBalance : 0);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        accounts,
        budgets,
        goals,
        selectedMonth,
        setSelectedMonth,
        viewMode,
        setViewMode,
        coupleSettings,
        updateCoupleSettings,
        coupleFilter,
        setCoupleFilter,
        settlementSummary,
        recordSettlementPayment,
        addTransaction,
        addTransactionsBatch,
        updateTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        setBudgetLimit,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        currentBalance,
        monthlyIncome,
        monthlyExpense,
        netWorth,
        resetToDefaultData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
