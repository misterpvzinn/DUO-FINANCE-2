import React, { useState, useMemo } from 'react';
import {
  Layers,
  Wallet,
  Tag,
  Plus,
  Landmark,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { ContaPlano, CategoriaPlano } from '../types/finance';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useTransactions } from '../hooks/useTransactions';
import {
  createAccount,
  updateAccount,
  deleteAccount,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/planData';
import { AccountCard } from '../components/planAccounts/AccountCard';
import { AccountModal } from '../components/planAccounts/AccountModal';
import { CategoryGroupSection } from '../components/planAccounts/CategoryGroupSection';
import { CategoryModal } from '../components/planAccounts/CategoryModal';
import { Button } from '../components/ui/Button';
import { formatBRL } from '../utils/money';

const GRUPOS_CATEGORIAS: {
  id: CategoriaPlano['tipo'];
  label: string;
  desc: string;
  cor: string;
  bgBadge: string;
}[] = [
  {
    id: 'receita',
    label: 'Receitas',
    desc: 'Salários, rendimentos, bônus e outras entradas financeiras',
    cor: '#10b981',
    bgBadge: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  {
    id: 'custo_fixo',
    label: 'Custos Fixos',
    desc: 'Aluguel, condomínio, luz, internet, seguros e mensalidades',
    cor: '#6366f1',
    bgBadge: 'bg-indigo-50 dark:bg-indigo-950/60',
  },
  {
    id: 'custo_variavel',
    label: 'Custos Variáveis',
    desc: 'Supermercado, farmácia, transporte, combustível e vestuário',
    cor: '#f59e0b',
    bgBadge: 'bg-amber-50 dark:bg-amber-950/60',
  },
  {
    id: 'investimento',
    label: 'Investimentos',
    desc: 'Reserva de emergência, aportes em ações, fundos e previdência',
    cor: '#06b6d4',
    bgBadge: 'bg-cyan-50 dark:bg-cyan-950/60',
  },
  {
    id: 'lazer',
    label: 'Lazer & Experiências',
    desc: 'Restaurantes, viagens, passeios, cinema e hobbies do casal',
    cor: '#ec4899',
    bgBadge: 'bg-pink-50 dark:bg-pink-950/60',
  },
  {
    id: 'divida',
    label: 'Dívidas & Financiamentos',
    desc: 'Financiamentos de imóveis ou veículos e amortizações de dívidas',
    cor: '#f43f5e',
    bgBadge: 'bg-rose-50 dark:bg-rose-950/60',
  },
];

export function PlanoDeContasView() {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();
  const { accounts, categories, transactions, loading } = useTransactions();

  const [activeTab, setActiveTab] = useState<'contas' | 'categorias'>('contas');
  const [searchCat, setSearchCat] = useState('');

  // Modais de Contas
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<ContaPlano | null>(null);

  // Modais de Categorias
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoriaPlano | null>(null);
  const [categoryDefaultType, setCategoryDefaultType] = useState<CategoriaPlano['tipo']>('custo_variavel');

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const membro1Uid = plano?.memberIds?.[0] || 'membro-1';
  const membro2Uid = segundoMembroUid || plano?.memberIds?.[1];

  // Cálculo do saldo atual de cada conta
  const balancesByAccount = useMemo(() => {
    const balances = new Map<string, number>();

    // Inicializa com saldo inicial
    accounts.forEach((acc) => {
      balances.set(acc.id, acc.saldoInicialCentavos || 0);
    });

    // Processa transações
    transactions.forEach((tx) => {
      if (tx.tipo === 'receita') {
        const cur = balances.get(tx.contaId) || 0;
        balances.set(tx.contaId, cur + tx.valorCentavos);
      } else if (tx.tipo === 'despesa') {
        const cur = balances.get(tx.contaId) || 0;
        balances.set(tx.contaId, cur - tx.valorCentavos);
      } else if (tx.tipo === 'transferencia') {
        const curOrigem = balances.get(tx.contaId) || 0;
        balances.set(tx.contaId, curOrigem - tx.valorCentavos);
        if (tx.contaDestinoId) {
          const curDestino = balances.get(tx.contaDestinoId) || 0;
          balances.set(tx.contaDestinoId, curDestino + tx.valorCentavos);
        }
      }
    });

    return balances;
  }, [accounts, transactions]);

  // Totais consolidados
  const totalPatrimonioContas = useMemo(() => {
    let sum = 0;
    accounts.forEach((acc) => {
      if (acc.ativa) {
        sum += balancesByAccount.get(acc.id) || 0;
      }
    });
    return sum;
  }, [accounts, balancesByAccount]);

  const totalInvestimentos = useMemo(() => {
    let sum = 0;
    accounts.forEach((acc) => {
      if (acc.ativa && acc.tipo === 'investimento') {
        sum += balancesByAccount.get(acc.id) || 0;
      }
    });
    return sum;
  }, [accounts, balancesByAccount]);

  // Contas
  const handleSaveAccount = async (accountData: Omit<ContaPlano, 'id'>) => {
    if (!plano?.id) return;
    try {
      if (accountToEdit) {
        await updateAccount(plano.id, accountToEdit.id, accountData);
        setFeedback({ type: 'success', text: `Conta "${accountData.nome}" atualizada com sucesso.` });
      } else {
        await createAccount(plano.id, accountData);
        setFeedback({ type: 'success', text: `Conta "${accountData.nome}" criada com sucesso.` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao salvar conta.' });
    }
  };

  const handleToggleAccountActive = async (acc: ContaPlano) => {
    if (!plano?.id) return;
    try {
      await updateAccount(plano.id, acc.id, { ativa: !acc.ativa });
      setFeedback({
        type: 'success',
        text: `Conta "${acc.nome}" ${acc.ativa ? 'desativada' : 'ativada'} com sucesso.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao alterar status da conta.' });
    }
  };

  const handleDeleteAccount = async (acc: ContaPlano) => {
    if (!plano?.id) return;
    if (!window.confirm(`Tem certeza que deseja excluir a conta "${acc.nome}"?`)) return;

    try {
      await deleteAccount(plano.id, acc.id, transactions);
      setFeedback({ type: 'success', text: `Conta "${acc.nome}" excluída com sucesso.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao excluir conta.' });
    }
  };

  // Categorias
  const handleSaveCategory = async (catData: Omit<CategoriaPlano, 'id'>) => {
    if (!plano?.id) return;
    try {
      if (categoryToEdit) {
        await updateCategory(plano.id, categoryToEdit.id, catData);
        setFeedback({ type: 'success', text: `Categoria "${catData.nome}" atualizada com sucesso.` });
      } else {
        await createCategory(plano.id, catData);
        setFeedback({ type: 'success', text: `Categoria "${catData.nome}" criada com sucesso.` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao salvar categoria.' });
    }
  };

  const handleToggleCategoryActive = async (cat: CategoriaPlano) => {
    if (!plano?.id) return;
    try {
      await updateCategory(plano.id, cat.id, { ativa: !cat.ativa });
      setFeedback({
        type: 'success',
        text: `Categoria "${cat.nome}" ${cat.ativa ? 'desativada' : 'ativada'} com sucesso.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao alterar status da categoria.' });
    }
  };

  const handleDeleteCategory = async (cat: CategoriaPlano) => {
    if (!plano?.id) return;
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${cat.nome}"?`)) return;

    try {
      await deleteCategory(plano.id, cat.id, transactions);
      setFeedback({ type: 'success', text: `Categoria "${cat.nome}" excluída com sucesso.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Erro ao excluir categoria.' });
    }
  };

  // Filtro de Categorias por busca
  const filteredCategories = useMemo(() => {
    if (!searchCat.trim()) return categories;
    const term = searchCat.toLowerCase();
    return categories.filter((c) => c.nome.toLowerCase().includes(term));
  }, [categories, searchCat]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 animate-in fade-in duration-300">
      {/* Cabeçalho com Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-500" />
            <span>Plano de Contas</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gerencie suas contas bancárias, carteiras e a estrutura de categorias do casal
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('contas')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'contas'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
            <span>Contas & Carteiras ({accounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categorias')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categorias'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Categorias ({categories.length})</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Conteúdo da Aba 1: Contas */}
      {activeTab === 'contas' && (
        <div className="space-y-6">
          {/* Métricas no topo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  Patrimônio em Contas
                </span>
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formatBRL(totalPatrimonioContas)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  Total em Investimentos
                </span>
                <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {formatBRL(totalInvestimentos)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
                  Contas Ativas
                </span>
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {accounts.filter((a) => a.ativa).length} de {accounts.length}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setAccountToEdit(null);
                  setAccountModalOpen(true);
                }}
                className="gap-1.5 text-xs shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nova Conta</span>
              </Button>
            </div>
          </div>

          {/* Grid de Contas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                currentBalanceCentavos={balancesByAccount.get(acc.id) || 0}
                membro1Nome={membro1Nome}
                membro2Nome={membro2Nome || 'Pessoa 2'}
                membro1Uid={membro1Uid}
                membro2Uid={membro2Uid}
                onEdit={(a) => {
                  setAccountToEdit(a);
                  setAccountModalOpen(true);
                }}
                onToggleActive={handleToggleAccountActive}
                onDelete={handleDeleteAccount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Categorias */}
      {activeTab === 'categorias' && (
        <div className="space-y-6">
          {/* Barra de Ações de Categorias */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Campo de Busca */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                setCategoryToEdit(null);
                setCategoryDefaultType('custo_variavel');
                setCategoryModalOpen(true);
              }}
              className="gap-1.5 text-xs shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nova Categoria</span>
            </Button>
          </div>

          {/* Grid dos 6 Grupos de Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GRUPOS_CATEGORIAS.map((grupo) => {
              const groupCats = filteredCategories.filter((c) => c.tipo === grupo.id);

              return (
                <CategoryGroupSection
                  key={grupo.id}
                  grupo={grupo}
                  categories={groupCats}
                  onAddCategory={(tipo) => {
                    setCategoryToEdit(null);
                    setCategoryDefaultType(tipo);
                    setCategoryModalOpen(true);
                  }}
                  onEditCategory={(c) => {
                    setCategoryToEdit(c);
                    setCategoryModalOpen(true);
                  }}
                  onToggleActive={handleToggleCategoryActive}
                  onDeleteCategory={handleDeleteCategory}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Modais */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setAccountToEdit(null);
        }}
        onSave={handleSaveAccount}
        accountToEdit={accountToEdit}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
        defaultType={categoryDefaultType}
      />
    </div>
  );
}
