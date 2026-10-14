import React, { createContext, useContext, useState, useEffect } from 'react';
import { OpenFinanceConnection, BRAZILIAN_BANKS, OpenFinanceHolder } from '../types/openFinance';
import { useFinance } from './FinanceContext';

interface OpenFinanceContextType {
  connections: OpenFinanceConnection[];
  connectBank: (params: {
    bankId: string;
    holder: OpenFinanceHolder;
    accountType: 'checking' | 'credit_card' | 'investment';
  }) => Promise<OpenFinanceConnection>;
  disconnectBank: (id: string) => void;
  syncConnection: (id: string) => Promise<{ newTransactionsCount: number }>;
  syncAll: () => Promise<{ totalNewTransactions: number }>;
  isSyncing: boolean;
  lastGlobalSync: string | null;
}

const DEFAULT_CONNECTIONS: OpenFinanceConnection[] = [
  {
    id: 'of-conn-1',
    bankId: 'nubank',
    bankName: 'Nubank',
    bankColor: '#820ad1',
    bankTextColor: '#ffffff',
    holder: 'user1',
    accountType: 'checking',
    accountNumberMasked: '•••• 4821',
    agencyMasked: '0001',
    balance: 3450,
    status: 'active',
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    consentExpiresAt: new Date(Date.now() + 300 * 86400000).toISOString(),
  },
  {
    id: 'of-conn-2',
    bankId: 'inter',
    bankName: 'Banco Inter',
    bankColor: '#ff7a00',
    bankTextColor: '#ffffff',
    holder: 'user2',
    accountType: 'checking',
    accountNumberMasked: '•••• 9102',
    agencyMasked: '0001',
    balance: 2900,
    status: 'active',
    lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
    consentExpiresAt: new Date(Date.now() + 280 * 86400000).toISOString(),
  },
  {
    id: 'of-conn-3',
    bankId: 'itau',
    bankName: 'Itaú Unibanco',
    bankColor: '#ec7000',
    bankTextColor: '#ffffff',
    holder: 'joint',
    accountType: 'checking',
    accountNumberMasked: '•••• 5510',
    agencyMasked: '2938',
    balance: 4800,
    status: 'active',
    lastSyncAt: new Date(Date.now() - 14400000).toISOString(),
    consentExpiresAt: new Date(Date.now() + 340 * 86400000).toISOString(),
  },
];

const OpenFinanceContext = createContext<OpenFinanceContextType | undefined>(undefined);

export function OpenFinanceProvider({ children }: { children: React.ReactNode }) {
  const { addTransactionsBatch, categories, accounts, coupleSettings } = useFinance();

  const [connections, setConnections] = useState<OpenFinanceConnection[]>(() => {
    const saved = localStorage.getItem('finance_open_banking_connections');
    return saved ? JSON.parse(saved) : DEFAULT_CONNECTIONS;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(() => {
    return localStorage.getItem('finance_open_banking_last_sync') || new Date().toISOString();
  });

  useEffect(() => {
    localStorage.setItem('finance_open_banking_connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    if (lastGlobalSync) {
      localStorage.setItem('finance_open_banking_last_sync', lastGlobalSync);
    }
  }, [lastGlobalSync]);

  const connectBank = async ({
    bankId,
    holder,
    accountType,
  }: {
    bankId: string;
    holder: OpenFinanceHolder;
    accountType: 'checking' | 'credit_card' | 'investment';
  }): Promise<OpenFinanceConnection> => {
    setIsSyncing(true);
    // Simulate real Open Finance authorization & webhook handshake delay
    await new Promise((resolve) => setTimeout(resolve, 1800));

    const bank = BRAZILIAN_BANKS.find((b) => b.id === bankId) || BRAZILIAN_BANKS[0];
    const randAcc = Math.floor(1000 + Math.random() * 9000);

    const newConn: OpenFinanceConnection = {
      id: `of-conn-${Date.now()}`,
      bankId: bank.id,
      bankName: bank.name,
      bankColor: bank.color,
      bankTextColor: bank.textColor,
      holder,
      accountType,
      accountNumberMasked: `•••• ${randAcc}`,
      agencyMasked: '0001',
      balance: Math.floor(1500 + Math.random() * 6000),
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      consentExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    };

    setConnections((prev) => [newConn, ...prev]);
    setIsSyncing(false);
    return newConn;
  };

  const disconnectBank = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const syncConnection = async (id: string): Promise<{ newTransactionsCount: number }> => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Target connection
    const conn = connections.find((c) => c.id === id);
    if (!conn) {
      setIsSyncing(false);
      return { newTransactionsCount: 0 };
    }

    // Pick suitable category
    const expenseCat = categories.find((c) => c.type === 'expense') || categories[0];
    const targetAccount = accounts[0]?.id || 'acc-checking-paulo';

    // Generate 1 realistic fresh synced transaction from open finance API
    const syncedTx = {
      description: `Compra Débito [${conn.bankName}]`,
      amount: Math.floor(35 + Math.random() * 120),
      date: dateStr,
      type: 'expense' as const,
      categoryId: expenseCat.id,
      accountId: targetAccount,
      notes: `Sincronizado automaticamente via Open Finance Bacen (${conn.bankName})`,
      paidBy: conn.holder,
      isShared: conn.holder === 'joint',
    };

    addTransactionsBatch([syncedTx]);

    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, lastSyncAt: now.toISOString() } : c))
    );

    setLastGlobalSync(now.toISOString());
    setIsSyncing(false);

    return { newTransactionsCount: 1 };
  };

  const syncAll = async (): Promise<{ totalNewTransactions: number }> => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newTxs = connections.map((conn) => {
      const expenseCat = categories.find((c) => c.type === 'expense') || categories[0];
      const targetAccount = accounts[0]?.id || 'acc-checking-paulo';

      return {
        description: `Lançamento Bancário [${conn.bankName}]`,
        amount: Math.floor(40 + Math.random() * 150),
        date: dateStr,
        type: 'expense' as const,
        categoryId: expenseCat.id,
        accountId: targetAccount,
        notes: `Importado via Open Finance Brasil (${conn.bankName} - ${conn.accountNumberMasked})`,
        paidBy: conn.holder,
        isShared: conn.holder === 'joint',
      };
    });

    if (newTxs.length > 0) {
      addTransactionsBatch(newTxs);
    }

    setConnections((prev) =>
      prev.map((c) => ({ ...c, lastSyncAt: now.toISOString() }))
    );

    setLastGlobalSync(now.toISOString());
    setIsSyncing(false);

    return { totalNewTransactions: newTxs.length };
  };

  return (
    <OpenFinanceContext.Provider
      value={{
        connections,
        connectBank,
        disconnectBank,
        syncConnection,
        syncAll,
        isSyncing,
        lastGlobalSync,
      }}
    >
      {children}
    </OpenFinanceContext.Provider>
  );
}

export function useOpenFinance(): OpenFinanceContextType {
  const context = useContext(OpenFinanceContext);
  if (!context) {
    throw new Error('useOpenFinance must be used within an OpenFinanceProvider');
  }
  return context;
}
