import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingDown,
  User,
  Heart,
  Power,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { CartaoCredito, ContaPlano, CategoriaPlano } from '../types/finance';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useCards } from '../hooks/useCards';
import { useInvoices } from '../hooks/useInvoices';
import { useCardPurchases } from '../hooks/useCardPurchases';
import { formatBRL } from '../utils/money';
import { Button } from '../components/ui/Button';
import { CardModal } from '../components/cards/CardModal';
import { CardPurchaseModal } from '../components/cards/CardPurchaseModal';
import { FaturasView } from './FaturasView';

interface CartoesViewProps {
  accounts: ContaPlano[];
  categories: CategoriaPlano[];
}

function CardItem({
  card,
  onEdit,
  onToggleActive,
  onOpenInvoices,
}: {
  card: CartaoCredito;
  onEdit: (card: CartaoCredito) => void;
  onToggleActive: (card: CartaoCredito) => void;
  onOpenInvoices: (card: CartaoCredito) => void;
}) {
  const { plano, membro1Nome, membro2Nome } = useAuthAndPlan();
  const { limits } = useInvoices(card);

  const getResponsavelBadge = (donoId: string) => {
    if (!donoId) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          <Heart className="w-3 h-3 fill-current" />
          <span>Compartilhado</span>
        </span>
      );
    }
    const uids = plano?.memberIds || [];
    const isPessoa1 = donoId === uids[0];
    const nome = isPessoa1 ? membro1Nome : membro2Nome || 'Pessoa 2';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          isPessoa1
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
            : 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
        }`}
      >
        <User className="w-3 h-3" />
        <span>{nome}</span>
      </span>
    );
  };

  // Cores dinâmicas para a barra de progresso do limite
  const percent = limits.percentualUtilizado;
  const barColor =
    percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#14171c] border transition-all p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5 ${
        card.ativo
          ? 'border-zinc-200/90 dark:border-zinc-800'
          : 'border-zinc-200/50 dark:border-zinc-800/40 opacity-70'
      }`}
    >
      {/* Topo do Card */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
                card.ativo
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {card.nome}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {card.bandeira || 'Crédito'} {card.ultimos4 ? `•••• ${card.ultimos4}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {getResponsavelBadge(card.donoId)}
          </div>
        </div>

        {/* Datas do Cartão */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Fecha dia <b>{card.diaFechamento}</b></span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Vence dia <b>{card.diaVencimento}</b></span>
          </div>
        </div>
      </div>

      {/* Seção de Limite (Regra 9) */}
      <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Limite Utilizado
          </span>
          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {formatBRL(limits.limiteUtilizadoCentavos)}{' '}
            <span className="text-[10px] text-zinc-400 font-normal">
              de {formatBRL(limits.limiteTotalCentavos)}
            </span>
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-zinc-400">Disponível:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatBRL(limits.limiteDisponivelCentavos)} ({100 - percent}%)
          </span>
        </div>
      </div>

      {/* Ações do Card */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleActive(card)}
            title={card.ativo ? 'Desativar cartão' : 'Ativar cartão'}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              card.ativo
                ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="text-[11px]">{card.ativo ? 'Ativo' : 'Inativo'}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(card)}
            title="Editar cartão"
            className="p-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenInvoices(card)}
          className="text-xs gap-1.5 py-1 px-3 shadow-2xs"
        >
          <span>Ver Faturas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function CartoesView({ accounts, categories }: CartoesViewProps) {
  const { cards, loading, apenasAtivos, setApenasAtivos, addCard, editCard, toggleCardActive } =
    useCards();
  const { addPurchase } = useCardPurchases();

  // Estados dos modais
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CartaoCredito | null>(null);

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // Cartão selecionado para visualizar faturas
  const [selectedCardForInvoices, setSelectedCardForInvoices] = useState<CartaoCredito | null>(null);

  const handleOpenNewCard = () => {
    setCardToEdit(null);
    setCardModalOpen(true);
  };

  const handleEditCard = (card: CartaoCredito) => {
    setCardToEdit(card);
    setCardModalOpen(true);
  };

  const handleToggleActive = async (card: CartaoCredito) => {
    await toggleCardActive(card.id, !card.ativo);
  };

  const handleSaveCard = async (params: any) => {
    if (cardToEdit) {
      await editCard(cardToEdit.id, params);
    } else {
      await addCard(params);
    }
  };

  // Se o usuário selecionou um cartão para ver faturas, renderiza a tela de faturas
  if (selectedCardForInvoices) {
    return (
      <FaturasView
        cartao={selectedCardForInvoices}
        onBack={() => setSelectedCardForInvoices(null)}
        accounts={accounts}
        categories={categories}
        allCards={cards}
      />
    );
  }

  const displayedCards = apenasAtivos ? cards.filter((c) => c.ativo) : cards;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Cartões de Crédito
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gerencie limites, faturas e compras parceladas do casal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cards.some((c) => c.ativo) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPurchaseModalOpen(true)}
              className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Nova Compra</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleOpenNewCard}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Novo Cartão</span>
          </Button>
        </div>
      </div>

      {/* Filtro Ativos / Todos */}
      {cards.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {cards.length} {cards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}
          </span>

          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setApenasAtivos(false)}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                !apenasAtivos
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Todos os cartões
            </button>
            <button
              type="button"
              onClick={() => setApenasAtivos(true)}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                apenasAtivos
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Somente ativos
            </button>
          </div>
        </div>
      )}

      {/* Grid de Cartões ou Estado Vazio */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
          <p className="text-xs font-medium">Carregando cartões...</p>
        </div>
      ) : displayedCards.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Você ainda não possui cartões cadastrados.
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Adicione os cartões de crédito individuais e compartilhados para gerenciar limites, faturas e parcelamentos.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleOpenNewCard} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Cartão</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={handleEditCard}
              onToggleActive={handleToggleActive}
              onOpenInvoices={(c) => setSelectedCardForInvoices(c)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <CardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onSave={handleSaveCard}
        cardToEdit={cardToEdit}
      />

      <CardPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSave={async (params) => {
          await addPurchase(params);
        }}
        cards={cards}
        categories={categories}
      />
    </div>
  );
}
