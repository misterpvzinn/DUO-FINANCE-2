import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  Tag,
  User,
  Heart,
  DollarSign,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { CartaoCredito, FaturaCartao, ContaPlano, CategoriaPlano } from '../types/finance';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useInvoices } from '../hooks/useInvoices';
import { useCardPurchases } from '../hooks/useCardPurchases';
import { formatBRL, formatMesAno, formatDataCompleta } from '../utils/money';
import { Button } from '../components/ui/Button';
import { InvoicePaymentModal } from '../components/cards/InvoicePaymentModal';
import { CardPurchaseModal } from '../components/cards/CardPurchaseModal';

interface FaturasViewProps {
  cartao: CartaoCredito;
  onBack: () => void;
  accounts: ContaPlano[];
  categories: CategoriaPlano[];
  allCards: CartaoCredito[];
}

export function FaturasView({
  cartao,
  onBack,
  accounts,
  categories,
  allCards,
}: FaturasViewProps) {
  const { plano, membro1Nome, membro2Nome } = useAuthAndPlan();
  const { invoices, loading: loadingInvoices, limits, payInvoice } = useInvoices(cartao);
  const { addPurchase, fetchInvoiceItems } = useCardPurchases(cartao.id);

  // Mês selecionado para a fatura ativa
  const [selectedMesIndex, setSelectedMesIndex] = useState(0);
  const [invoiceItems, setInvoiceItems] = useState<{ parcela: any; compra: any }[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Modais
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // Fatura selecionada
  const activeInvoice: FaturaCartao | null =
    invoices.length > 0 && invoices[selectedMesIndex] ? invoices[selectedMesIndex] : null;

  // Carrega as parcelas que compõem a fatura ativa
  useEffect(() => {
    if (!activeInvoice) {
      setInvoiceItems([]);
      return;
    }

    setLoadingItems(true);
    fetchInvoiceItems(cartao.id, activeInvoice.id)
      .then((items) => {
        setInvoiceItems(items);
        setLoadingItems(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingItems(false);
      });
  }, [activeInvoice?.id, cartao.id, fetchInvoiceItems]);

  const handlePrevInvoice = () => {
    if (selectedMesIndex < invoices.length - 1) {
      setSelectedMesIndex(selectedMesIndex + 1);
    }
  };

  const handleNextInvoice = () => {
    if (selectedMesIndex > 0) {
      setSelectedMesIndex(selectedMesIndex - 1);
    }
  };

  // Helper de categoria
  const getCategoriaName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.nome : 'Outras';
  };

  // Helper de responsável
  const getResponsavelLabel = (donoId: string) => {
    if (!donoId) return 'Compartilhado';
    const uids = plano?.memberIds || [];
    if (donoId === uids[0]) return membro1Nome;
    if (donoId === uids[1]) return membro2Nome || 'Pessoa 2';
    return plano?.membros?.[donoId]?.nomeExibicao || 'Individual';
  };

  const saldoDevedorCentavos = activeInvoice
    ? Math.max(0, activeInvoice.valorTotalCentavos - (activeInvoice.valorPagoCentavos || 0))
    : 0;

  // Badge de Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paga':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paga</span>
          </span>
        );
      case 'fechada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Fechada</span>
          </span>
        );
      case 'vencida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Vencida</span>
          </span>
        );
      case 'aberta':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Aberta</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Cartões</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setPurchaseModalOpen(true)}
            className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Compra</span>
          </Button>

          {activeInvoice && activeInvoice.status !== 'paga' && saldoDevedorCentavos > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPaymentModalOpen(true)}
              className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Registrar Pagamento</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cartão Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {cartao.nome}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {cartao.bandeira || 'Crédito'} {cartao.ultimos4 ? `•••• ${cartao.ultimos4}` : ''} • Fecha dia {cartao.diaFechamento}, Vence dia {cartao.diaVencimento}
            </p>
          </div>
        </div>

        {/* Limite Utilizado e Disponível */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Limite Utilizado
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
              {formatBRL(limits.limiteUtilizadoCentavos)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Limite Disponível
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatBRL(limits.limiteDisponivelCentavos)}
            </span>
          </div>
        </div>
      </div>

      {/* Seletor de Fatura por Mês */}
      {invoices.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Nenhuma fatura gerada para este cartão
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Ao registrar uma compra no cartão, as faturas correspondentes serão geradas automaticamente.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setPurchaseModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primeira Compra</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Navegador de Meses */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevInvoice}
              disabled={selectedMesIndex >= invoices.length - 1}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Fatura de Referência
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {activeInvoice ? formatMesAno(activeInvoice.mesReferencia) : '---'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextInvoice}
              disabled={selectedMesIndex <= 0}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Card Resumo da Fatura Ativa */}
          {activeInvoice && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Status da Fatura:
                    </span>
                    {getStatusBadge(activeInvoice.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                    <span>
                      Fechamento: <b>{formatDataCompleta(new Date(activeInvoice.dataFechamento + 'T12:00:00'))}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Vencimento: <b>{formatDataCompleta(new Date(activeInvoice.dataVencimento + 'T12:00:00'))}</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Total da Fatura
                    </span>
                    <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {formatBRL(activeInvoice.valorTotalCentavos)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Saldo Restante
                    </span>
                    <span
                      className={`text-xl font-bold font-mono ${
                        saldoDevedorCentavos > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatBRL(saldoDevedorCentavos)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de Compras que compõem a fatura (Item 13) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Compras e Parcelas Desta Fatura ({invoiceItems.length})
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    Total: {formatBRL(activeInvoice.valorTotalCentavos)}
                  </span>
                </div>

                {loadingItems ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-xs text-zinc-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Carregando compras da fatura...</span>
                  </div>
                ) : invoiceItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Nenhuma compra lançada nesta fatura.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
                    {invoiceItems.map(({ parcela, compra }) => (
                      <div
                        key={parcela.id}
                        className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {compra.descricao}
                            </span>
                            {/* Parcela Pill */}
                            <span className="text-[10px] px-2 py-0.2 rounded-full font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                              {parcela.numeroParcela}/{parcela.totalParcelas}
                            </span>
                            {/* Responsável Pill */}
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded-full font-medium shrink-0 ${
                                !compra.donoId
                                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : compra.donoId === plano?.memberIds[0]
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
                              }`}
                            >
                              {getResponsavelLabel(compra.donoId)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span>{getCategoriaName(compra.categoriaId)}</span>
                            <span>•</span>
                            <span>
                              Compra em {formatDataCompleta(new Date(compra.dataCompra + 'T12:00:00'))}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            {formatBRL(parcela.valorCentavos)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Pagamento da Fatura */}
      <InvoicePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPay={payInvoice}
        fatura={activeInvoice}
        cartao={cartao}
        accounts={accounts}
      />

      {/* Modal de Nova Compra no Cartão */}
      <CardPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSave={async (params) => {
          await addPurchase(params);
        }}
        cards={allCards}
        categories={categories}
        defaultCardId={cartao.id}
      />
    </div>
  );
}
