import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  Trash2,
  Layers,
  Landmark,
  CreditCard,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFinance } from '../context/FinanceContext';
import { CategoryModal } from '../components/accounts/CategoryModal';
import { OpenFinanceCard } from '../components/openFinance/OpenFinanceCard';
import { CategoryGroup, Category } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

export function AccountsView() {
  const { categories, accounts, deleteCategory, transactions } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

  const getGroupLabel = (group: CategoryGroup) => {
    switch (group) {
      case 'fixed_cost':
        return 'Custos Fixos';
      case 'variable_cost':
        return 'Custos Variáveis';
      case 'investment':
        return 'Investimentos & Aportes';
      case 'leisure':
        return 'Lazer & Estilo de Vida';
      case 'income':
        return 'Receitas';
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Landmark className="w-5 h-5 text-blue-500" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'wallet':
        return <Coins className="w-5 h-5 text-amber-500" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      default:
        return <Landmark className="w-5 h-5 text-zinc-500" />;
    }
  };

  // Group categories
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const fixedCategories = categories.filter((c) => c.group === 'fixed_cost');
  const variableCategories = categories.filter((c) => c.group === 'variable_cost');
  const leisureCategories = categories.filter((c) => c.group === 'leisure');
  const investmentCategories = categories.filter((c) => c.group === 'investment');

  const renderCategoryList = (list: Category[], title: string, badgeColor: string) => {
    return (
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </div>
            <span className="text-xs font-mono text-zinc-400">{list.length} itens</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {list.map((cat) => {
              const usageCount = transactions.filter((t) => t.categoryId === cat.id).length;
              return (
                <div key={cat.id} className="py-2.5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {usageCount} {usageCount === 1 ? 'lançamento' : 'lançamentos'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja remover a categoria "${cat.name}"?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    title="Remover categoria"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-400 hover:text-rose-600 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Plano de Contas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Estrutura de contas financeiras e plano de classificação das despesas
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </Button>
      </div>

      {/* Open Finance Brasil Integration Banner */}
      <OpenFinanceCard />

      {/* Contas Cadastradas */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Contas e Carteiras Financeiras
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            // compute live balance per account
            const accIncome = transactions
              .filter((t) => t.accountId === acc.id && t.type === 'income')
              .reduce((s, t) => s + t.amount, 0);
            const accExpense = transactions
              .filter((t) => t.accountId === acc.id && t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0);
            const liveBalance = acc.initialBalance + accIncome - accExpense;

            return (
              <Card key={acc.id} className="p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {acc.name}
                  </span>
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    {getAccountIcon(acc.type)}
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {formatCurrency(liveBalance)}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Saldo disponível
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Categorias por Grupo */}
      <div className="flex flex-col gap-3 mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Classificação de Categorias
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderCategoryList(incomeCategories, 'Categorias de Receitas', 'bg-emerald-500')}
          {renderCategoryList(fixedCategories, 'Custos Fixos', 'bg-indigo-500')}
          {renderCategoryList(variableCategories, 'Custos Variáveis', 'bg-amber-500')}
          {renderCategoryList(leisureCategories, 'Lazer & Experiências', 'bg-teal-500')}
          {renderCategoryList(investmentCategories, 'Investimentos', 'bg-sky-500')}
        </div>
      </div>

      <CategoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
