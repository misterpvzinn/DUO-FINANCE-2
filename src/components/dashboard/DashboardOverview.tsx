import React, { useState } from 'react';
import { Plus, Calendar, ArrowRight, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Zap } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { BalanceCard } from './BalanceCard';
import { IncomeCard } from './IncomeCard';
import { ExpenseCard } from './ExpenseCard';
import { NetWorthCard } from './NetWorthCard';
import { CashFlowChart } from './CashFlowChart';
import { NetWorthChart } from './NetWorthChart';
import { CategoryChart } from './CategoryChart';
import { BudgetProgress } from './BudgetProgress';
import { TransactionModal } from '../transactions/TransactionModal';
import { ImportStatementModal } from '../transactions/ImportStatementModal';
import { OpenFinanceModal } from '../openFinance/OpenFinanceModal';
import { CoupleSettlementCard } from '../couple/CoupleSettlementCard';
import { CoupleFilterBar } from '../couple/CoupleFilterBar';
import { formatCurrency, formatDate, formatMonthName } from '../../utils/formatters';
import { NavRoute } from '../../types/navigation';

interface DashboardOverviewProps {
  onNavigate?: (route: NavRoute) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const {
    currentBalance,
    monthlyIncome,
    monthlyExpense,
    netWorth,
    transactions,
    categories,
    budgets,
    selectedMonth,
    coupleSettings,
    coupleFilter,
  } = useFinance();

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [openFinanceModalOpen, setOpenFinanceModalOpen] = useState(false);

  // Filter recent transactions according to couple filter if active
  const filteredRecentTransactions = transactions
    .filter((tx) => {
      if (!coupleSettings.enabled || coupleFilter === 'all') return true;
      if (coupleFilter === 'user1') return tx.paidBy === 'user1';
      if (coupleFilter === 'user2') return tx.paidBy === 'user2';
      if (coupleFilter === 'shared') return tx.isShared || tx.paidBy === 'joint';
      return true;
    })
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
            Visão geral financeira • {formatMonthName(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setOpenFinanceModalOpen(true)}
            variant="outline"
            className="gap-2 shrink-0 self-start sm:self-auto border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100"
          >
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
            <span>Open Finance</span>
          </Button>

          <Button
            onClick={() => setImportModalOpen(true)}
            variant="outline"
            className="gap-2 shrink-0 self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Importar Extrato</span>
          </Button>

          <Button
            onClick={() => setTxModalOpen(true)}
            className="gap-2 shrink-0 self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </Button>
        </div>
      </div>

      {/* Couple Features on Dashboard (if enabled) */}
      {coupleSettings.enabled && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Visualização Geral:
            </span>
            <CoupleFilterBar />
          </div>
          <CoupleSettlementCard />
        </div>
      )}

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BalanceCard balance={currentBalance} />
        <IncomeCard income={monthlyIncome} monthName={formatMonthName(selectedMonth)} />
        <ExpenseCard expense={monthlyExpense} monthName={formatMonthName(selectedMonth)} />
        <NetWorthCard netWorth={netWorth} />
      </div>

      {/* 2 Main Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart transactions={transactions} />
        <NetWorthChart transactions={transactions} currentNetWorth={netWorth} />
      </div>

      {/* Categories & Budgets breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart
          transactions={transactions}
          categories={categories}
          selectedMonth={selectedMonth}
        />
        <BudgetProgress
          budgets={budgets}
          categories={categories}
          transactions={transactions}
          selectedMonth={selectedMonth}
        />
      </div>

      {/* Recent Transactions List on Dashboard */}
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Últimos Lançamentos</CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Movimentações mais recentes cadastradas
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver extrato completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {filteredRecentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Nenhuma transação encontrada para este filtro.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredRecentTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {tx.description}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>{formatDate(tx.date)}</span>
                          <span>•</span>
                          <span>{category?.name || 'Geral'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-sm font-semibold">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={async () => {}}
        accounts={[]}
        categories={categories as any}
      />
      <ImportStatementModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
      <OpenFinanceModal isOpen={openFinanceModalOpen} onClose={() => setOpenFinanceModalOpen(false)} />
    </div>
  );
}
