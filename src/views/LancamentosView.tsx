import React, { useState } from 'react';
import {
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  Wallet,
  Tag,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Heart,
  User,
  Search,
  Upload,
} from 'lucide-react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useTransactions } from '../hooks/useTransactions';
import { LancamentoFinanceiro, TipoLancamento } from '../types/finance';
import { formatBRL, formatMesAno, formatDataCurta, formatDataCompleta } from '../utils/money';
import { Button } from '../components/ui/Button';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { DeleteConfirmModal } from '../components/transactions/DeleteConfirmModal';
import { ImportStatementModal } from '../components/transactions/ImportStatementModal';

interface LancamentosViewProps {
  onOpenNovoLancamento?: () => void;
}

export function LancamentosView() {
  const {
    plano,
    mesSelecionado,
    regime,
    filtroPessoa,
    membro1Nome,
    membro2Nome,
    segundoMembroUid,
  } = useAuthAndPlan();

  const {
    transactions,
    loading,
    error,
    accounts,
    categories,
    accountsMap,
    categoriesMap,
    addTransaction,
    editTransaction,
    removeTransaction,
    filtroTipo,
    setFiltroTipo,
    filtroConta,
    setFiltroConta,
    filtroCategoria,
    setFiltroCategoria,
  } = useTransactions();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LancamentoFinanceiro | null>(null);

  // Delete modal state
  const [deletingTx, setDeletingTx] = useState<LancamentoFinanceiro | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Feedback state
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action menu dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: LancamentoFinanceiro) => {
    setActiveMenuId(null);
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handlePromptDelete = (tx: LancamentoFinanceiro) => {
    setActiveMenuId(null);
    setDeletingTx(tx);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    const desc = deletingTx.descricao;
    try {
      await removeTransaction(deletingTx.id);
      setDeletingTx(null);
      setFeedbackMsg({
        type: 'success',
        text: `Lançamento "${desc}" excluído com sucesso.`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Erro ao excluir lançamento.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTransaction = async (params: any) => {
    try {
      if (editingTransaction) {
        await editTransaction(editingTransaction.id, params);
        setFeedbackMsg({
          type: 'success',
          text: `Lançamento "${params.descricao || editingTransaction.descricao}" atualizado com sucesso.`,
        });
      } else {
        await addTransaction(params);
        setFeedbackMsg({
          type: 'success',
          text: `Lançamento "${params.descricao}" criado com sucesso.`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Erro ao salvar lançamento.',
      });
      throw err;
    }
  };

  // Helper name for responsavel
  const getResponsavelLabel = (donoId: string) => {
    if (!donoId || donoId === '') return 'Compartilhado';
    const uids = plano?.memberIds || [];
    if (donoId === uids[0]) return membro1Nome;
    if (donoId === uids[1]) return membro2Nome || 'Pessoa 2';
    return plano?.membros?.[donoId]?.nomeExibicao || 'Individual';
  };

  // Filter with client search
  const displayedTransactions = transactions.filter((tx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchDesc = tx.descricao.toLowerCase().includes(term);
    const catName = tx.categoriaId ? categoriesMap.get(tx.categoriaId)?.nome.toLowerCase() : '';
    const accName = tx.contaId ? accountsMap.get(tx.contaId)?.nome.toLowerCase() : '';
    return matchDesc || (catName && catName.includes(term)) || (accName && accName.includes(term));
  });

  // Totais rápidos
  const totalReceitas = displayedTransactions
    .filter((tx) => tx.tipo === 'receita')
    .reduce((sum, tx) => sum + tx.valorCentavos, 0);

  const totalDespesas = displayedTransactions
    .filter((tx) => tx.tipo === 'despesa')
    .reduce((sum, tx) => sum + tx.valorCentavos, 0);

  const saldoPeriodo = totalReceitas - totalDespesas;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Lançamentos
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Controle todas as movimentações do seu plano • {formatMesAno(mesSelecionado)} ({regime === 'competencia' ? 'Competência' : 'Caixa'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar extrato</span>
          </Button>

          <Button
            onClick={handleOpenNew}
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo lançamento</span>
          </Button>
        </div>
      </div>

      {/* Mini Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Receitas ({regime})
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              +{formatBRL(totalReceitas)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Despesas ({regime})
            </span>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              -{formatBRL(totalDespesas)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Saldo Líquido
            </span>
            <p
              className={`text-base font-bold font-mono mt-0.5 ${
                saldoPeriodo >= 0
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatBRL(saldoPeriodo)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] font-semibold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, conta ou categoria..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Dropdowns de Tipo, Conta e Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
            <option value="transferencia">Transferências</option>
          </select>

          {/* Conta */}
          <select
            value={filtroConta}
            onChange={(e) => setFiltroConta(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas as contas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.nome}
              </option>
            ))}
          </select>

          {/* Categoria */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
            <p className="text-xs font-medium">Carregando lançamentos...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-2 text-rose-500">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : displayedTransactions.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <ArrowLeftRight className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Nenhum lançamento neste período
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Adicione uma receita, despesa ou transferência para começar.
              </p>
            </div>
            <div className="pt-2">
              <Button size="sm" onClick={handleOpenNew} className="text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Lançamento</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {displayedTransactions.map((tx) => {
              const dateTimestamp = regime === 'competencia' ? tx.dataCompetencia : tx.dataCaixa;
              const txDate = dateTimestamp ? dateTimestamp.toDate() : new Date();
              const contaOrigem = accountsMap.get(tx.contaId);
              const contaDestino = tx.contaDestinoId ? accountsMap.get(tx.contaDestinoId) : null;
              const categoria = tx.categoriaId ? categoriesMap.get(tx.categoriaId) : null;
              const responsavelLabel = getResponsavelLabel(tx.donoId);

              const isReceita = tx.tipo === 'receita';
              const isDespesa = tx.tipo === 'despesa';
              const isTransferencia = tx.tipo === 'transferencia';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group"
                >
                  {/* Left: Data e Ícone do tipo */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Badge da Data */}
                    <div className="text-center shrink-0 w-11 py-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 leading-tight">
                        {formatDataCurta(txDate).split(' ')[1]}
                      </span>
                      <span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                        {formatDataCurta(txDate).split(' ')[0]}
                      </span>
                    </div>

                    {/* Ícone discreto */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isReceita
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : isDespesa
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {isReceita ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isDespesa ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4" />
                      )}
                    </div>

                    {/* Descrição, Conta e Categoria */}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {tx.descricao}
                        </span>
                        {/* Responsável Pill */}
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-medium shrink-0 ${
                            !tx.donoId
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : tx.donoId === plano?.memberIds[0]
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
                          }`}
                        >
                          {responsavelLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 truncate">
                        {isTransferencia ? (
                          <span>
                            {contaOrigem?.nome || 'Conta Origem'} → {contaDestino?.nome || 'Conta Destino'}
                          </span>
                        ) : (
                          <>
                            <span>{contaOrigem?.nome || 'Conta'}</span>
                            {categoria && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-600 dark:text-zinc-400">{categoria.nome}</span>
                              </>
                            )}
                          </>
                        )}
                        {tx.observacao && (
                          <>
                            <span>•</span>
                            <span className="italic truncate">"{tx.observacao}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Valor e Ações */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono tracking-tight ${
                          isReceita
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isDespesa
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {isReceita ? '+' : isDespesa ? '-' : ''}
                        {formatBRL(tx.valorCentavos)}
                      </span>
                      <span className="block text-[10px] text-zinc-400">
                        {regime === 'competencia' ? 'Comp:' : 'Caixa:'}{' '}
                        {formatDataCompleta(txDate)}
                      </span>
                    </div>

                    {/* Botões Rápidos no Hover (Desktop) */}
                    <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Editar lançamento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptDelete(tx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Menu de Ações (Mobile e Alternativo) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === tx.id ? null : tx.id)
                        }
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === tx.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xl py-1 z-30 animate-in fade-in duration-100">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tx)}
                              className="w-full px-3 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromptDelete(tx)}
                              className="w-full px-3 py-1.5 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={editingTransaction}
        accounts={accounts}
        categories={categories}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
        descricao={deletingTx?.descricao}
        isDeleting={isDeleting}
      />

      {/* Modal de Importação de Extratos */}
      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setFeedbackMsg({
            type: 'success',
            text: 'Extrato importado com sucesso! Os lançamentos foram adicionados.',
          });
        }}
      />
    </div>
  );
}
