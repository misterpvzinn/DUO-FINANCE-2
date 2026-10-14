import React, { useState } from 'react';
import { RouteId } from '../../types/couplePlan';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { InviteModal } from '../plan/InviteModal';
import { TransactionModal } from '../transactions/TransactionModal';
import { useTransactions } from '../../hooks/useTransactions';
import { DashboardView } from '../../views/DashboardView';
import { LancamentosView } from '../../views/LancamentosView';
import { CartoesView } from '../../views/CartoesView';
import { PlanoDeContasView } from '../../views/PlanoDeContasView';
import { MetasOrcamentosView } from '../../views/MetasOrcamentosView';
import { RecurrenciasView } from '../../views/RecurrenciasView';
import { RelatoriosView } from '../../views/RelatoriosView';

export function AppLayout() {
  const [currentRoute, setCurrentRoute] = useState<RouteId>('dashboard');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  const { accounts, categories, addTransaction } = useTransactions();

  const handleSaveGlobalTransaction = async (params: any) => {
    await addTransaction(params);
  };

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentRoute} />;
      case 'lancamentos':
        return <LancamentosView />;
      case 'cartoes':
        return <CartoesView accounts={accounts} categories={categories} />;
      case 'plano-de-contas':
        return <PlanoDeContasView />;
      case 'metas':
        return <MetasOrcamentosView initialTab="metas" accounts={accounts} />;
      case 'orcamentos':
        return <MetasOrcamentosView initialTab="orcamentos" accounts={accounts} />;
      case 'recorrencias':
        return <RecurrenciasView />;
      case 'relatorios':
        return <RelatoriosView />;
      default:
        return <DashboardView onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#0d0f12] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 transition-colors">
      {/* Sidebar fixa */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={setCurrentRoute}
        onOpenInvite={() => setInviteModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onNovoLancamentoClick={() => setTransactionModalOpen(true)} />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Modais Globais */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      {/* Modal Funcional de Lançamento (Header "+ Novo lançamento") */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSave={handleSaveGlobalTransaction}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
