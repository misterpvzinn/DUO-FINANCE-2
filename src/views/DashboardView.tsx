import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Scale,
  Wallet,
  CreditCard,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { RouteId } from '../types/couplePlan';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTransactions } from '../hooks/useTransactions';
import { useCardPurchases } from '../hooks/useCardPurchases';
import { useCards } from '../hooks/useCards';

// Componentes do Dashboard
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { FinancialEvolutionChart } from '../components/dashboard/FinancialEvolutionChart';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { ExpenseDistributionChart } from '../components/dashboard/ExpenseDistributionChart';
import { TopCategories } from '../components/dashboard/TopCategories';
import { MemberSummary } from '../components/dashboard/MemberSummary';
import { CardSummary } from '../components/dashboard/CardSummary';
import { UpcomingInvoices } from '../components/dashboard/UpcomingInvoices';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { QuickActions } from '../components/dashboard/QuickActions';
import { DashboardGoalsSummary } from '../components/dashboard/DashboardGoalsSummary';
import { DashboardBudgetsSummary } from '../components/dashboard/DashboardBudgetsSummary';
import { DashboardRecurrencesSummary } from '../components/dashboard/DashboardRecurrencesSummary';

// Modais
import { TransactionModal } from '../components/transactions/TransactionModal';
import { CardPurchaseModal } from '../components/cards/CardPurchaseModal';
import { CardModal } from '../components/cards/CardModal';
import { Button } from '../components/ui/Button';

interface DashboardViewProps {
  onNavigate: (route: RouteId) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { regime } = useAuthAndPlan();

  const {
    metrics,
    monthlyEvolution,
    categoryExpenses,
    topCategories,
    memberSummary,
    cardSummary,
    upcomingInvoices,
    recentTransactions,
    accounts,
    categories,
    categoriesMap,
    accountsMap,
    cards,
    loading,
    isEmpty,
    periodType,
    setPeriodType,
    periodLabel,
  } = useDashboardData();

  const { addTransaction } = useTransactions();
  const { addPurchase } = useCardPurchases();
  const { addCard } = useCards();

  // Modais
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <RefreshCw className="w-7 h-7 animate-spin text-zinc-500" />
        <p className="text-xs font-medium">Carregando painel financeiro...</p>
      </div>
    );
  }

  // Dashboard Vazio (Regra 26)
  if (isEmpty) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Seu dashboard está pronto.
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Adicione seus primeiros lançamentos para começar a acompanhar sua vida financeira a dois.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => setTxModalOpen(true)} className="text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Novo lançamento</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setCardModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>Cadastrar cartão</span>
          </Button>
        </div>

        <TransactionModal
          isOpen={txModalOpen}
          onClose={() => setTxModalOpen(false)}
          onSave={async (p) => {
            await addTransaction(p);
          }}
          accounts={accounts}
          categories={categories}
        />

        <CardModal
          isOpen={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          onSave={async (p) => {
            await addCard(p);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto py-2 animate-in fade-in duration-300">
      {/* 1. Header com Período */}
      <DashboardHeader
        periodType={periodType}
        onPeriodChange={setPeriodType}
        periodLabel={periodLabel}
      />

      {/* 2. Barra de Ações Rápidas */}
      <QuickActions
        onNewTransaction={() => setTxModalOpen(true)}
        onNewPurchase={() => setPurchaseModalOpen(true)}
        onNewCard={() => setCardModalOpen(true)}
      />

      {/* 3. Cards de Indicadores Principais (Regras 4, 5 e 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Receitas */}
        <MetricCard
          title="Receitas"
          valueCentavos={metrics.income.currentCentavos}
          previousValueCentavos={metrics.income.previousCentavos}
          percentageChange={metrics.income.percentageChange}
          icon={TrendingUp}
          colorScheme="emerald"
        />

        {/* Despesas */}
        <MetricCard
          title="Despesas"
          valueCentavos={metrics.expense.currentCentavos}
          previousValueCentavos={metrics.expense.previousCentavos}
          percentageChange={metrics.expense.percentageChange}
          icon={TrendingDown}
          colorScheme="rose"
          reverseColors={true}
        />

        {/* Investimentos */}
        <MetricCard
          title="Investimentos"
          valueCentavos={metrics.investment.currentCentavos}
          previousValueCentavos={metrics.investment.previousCentavos}
          percentageChange={metrics.investment.percentageChange}
          icon={Landmark}
          colorScheme="blue"
        />

        {/* Resultado = Receitas - Despesas - Investimentos */}
        <MetricCard
          title="Resultado"
          valueCentavos={metrics.result.currentCentavos}
          previousValueCentavos={metrics.result.previousCentavos}
          percentageChange={metrics.result.percentageChange}
          icon={Scale}
          colorScheme={metrics.result.currentCentavos >= 0 ? 'purple' : 'rose'}
        />

        {/* Saldo Disponível */}
        <MetricCard
          title="Saldo em Contas"
          valueCentavos={metrics.availableBalanceCentavos}
          icon={Wallet}
          colorScheme="zinc"
          subtitle="Total acumulado"
        />

        {/* Gastos no Cartão */}
        <MetricCard
          title="Gastos no Cartão"
          valueCentavos={metrics.cardSpendingCentavos}
          icon={CreditCard}
          colorScheme="amber"
          subtitle="No período selecionado"
        />
      </div>

      {/* 4. Gráficos de Evolução e Comparativo Mensal (Regras 7 e 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FinancialEvolutionChart data={monthlyEvolution} />
        <IncomeExpenseChart data={monthlyEvolution} />
      </div>

      {/* 5. Distribuição de Despesas e Top Categorias (Regras 9 e 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExpenseDistributionChart categories={categoryExpenses} />
        <TopCategories categories={topCategories} />
      </div>

      {/* 6. Movimentação por Pessoa (Regra 11) */}
      <MemberSummary members={memberSummary} />

      {/* 7. Cartões e Próximas Faturas (Regras 12 e 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardSummary
          cards={cardSummary}
          onNavigateToCards={() => onNavigate('cartoes')}
        />
        <UpcomingInvoices
          invoices={upcomingInvoices}
          onNavigateToCards={() => onNavigate('cartoes')}
        />
      </div>

      {/* 8. Resumo de Metas, Orçamentos e Recorrências (Partes 6 e 7) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <DashboardGoalsSummary onNavigateToGoals={() => onNavigate('metas')} />
        <DashboardBudgetsSummary onNavigateToBudgets={() => onNavigate('orcamentos')} />
        <DashboardRecurrencesSummary onNavigateToRecurrences={() => onNavigate('recorrencias')} />
      </div>

      {/* 9. Últimos Lançamentos (Regra 14) */}
      <RecentTransactions
        transactions={recentTransactions}
        categoriesMap={categoriesMap}
        accountsMap={accountsMap}
        onNavigateToTransactions={() => onNavigate('lancamentos')}
        regime={regime}
      />

      {/* Modais de Ações */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={async (p) => {
          await addTransaction(p);
        }}
        accounts={accounts}
        categories={categories}
      />

      <CardPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSave={async (p) => {
          await addPurchase(p);
        }}
        cards={cards}
        categories={categories}
      />

      <CardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onSave={async (p) => {
          await addCard(p);
        }}
      />
    </div>
  );
}
