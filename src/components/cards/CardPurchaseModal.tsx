import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  AlertCircle,
  Calendar,
  Tag,
  User,
  Heart,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CartaoCredito, CategoriaPlano } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { parseBRLToCents, formatBRL } from '../../utils/money';
import { generateInstallments } from '../../utils/creditCard';
import { Button } from '../ui/Button';

interface CardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: any) => Promise<void>;
  cards: CartaoCredito[];
  categories: CategoriaPlano[];
  defaultCardId?: string;
}

export function CardPurchaseModal({
  isOpen,
  onClose,
  onSave,
  cards,
  categories,
  defaultCardId,
}: CardPurchaseModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const activeCards = cards.filter((c) => c.ativo);

  const [cartaoId, setCartaoId] = useState(defaultCardId || '');
  const [descricao, setDescricao] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [dataCompra, setDataCompra] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [donoId, setDonoId] = useState('');
  const [observacao, setObservacao] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);

    const today = new Date().toISOString().split('T')[0];
    setDataCompra(today);
    setDescricao('');
    setValorTexto('');
    setNumeroParcelas(1);
    setDonoId('');
    setObservacao('');

    if (defaultCardId && activeCards.some((c) => c.id === defaultCardId)) {
      setCartaoId(defaultCardId);
    } else if (activeCards.length > 0) {
      setCartaoId(activeCards[0].id);
    } else {
      setCartaoId('');
    }

    // Primeira categoria de despesa válida
    const despesas = categories.filter((c) => c.tipo !== 'receita' && c.ativa);
    if (despesas.length > 0) {
      setCategoriaId(despesas[0].id);
    }
  }, [isOpen, defaultCardId, cards]);

  if (!isOpen) return null;

  const selectedCard = cards.find((c) => c.id === cartaoId);

  // Apenas categorias de despesa (não receita)
  const expenseCategories = categories.filter((c) => c.tipo !== 'receita' && c.ativa);

  const groupedCategories = expenseCategories.reduce<Record<string, CategoriaPlano[]>>((acc, curr) => {
    const groupName =
      curr.tipo === 'custo_fixo'
        ? 'Custos Fixos'
        : curr.tipo === 'custo_variavel'
        ? 'Custos Variáveis'
        : curr.tipo === 'investimento'
        ? 'Investimentos'
        : curr.tipo === 'lazer'
        ? 'Lazer'
        : 'Dívidas';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(curr);
    return acc;
  }, {});

  // Simulação de parcelas em tempo real
  const centavos = parseBRLToCents(valorTexto);
  let installmentSimulation = '';
  if (centavos > 0 && numeroParcelas > 1 && selectedCard) {
    try {
      const insts = generateInstallments({
        valorTotalCentavos: centavos,
        numeroParcelas,
        dataCompra: dataCompra || new Date().toISOString().split('T')[0],
        cartao: selectedCard,
      });
      installmentSimulation = `${numeroParcelas}x de ${formatBRL(insts[0].valorCentavos)}`;
      if (insts[0].valorCentavos !== insts[insts.length - 1].valorCentavos) {
        installmentSimulation += ` (última ${formatBRL(insts[insts.length - 1].valorCentavos)})`;
      }
    } catch {
      installmentSimulation = '';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!cartaoId) {
      setErrorMsg('Selecione um cartão ativo.');
      return;
    }
    if (!descricao.trim()) {
      setErrorMsg('Informe a descrição da compra.');
      return;
    }
    if (centavos <= 0) {
      setErrorMsg('O valor da compra deve ser maior que zero.');
      return;
    }
    if (!dataCompra) {
      setErrorMsg('Informe a data da compra.');
      return;
    }
    if (!categoriaId) {
      setErrorMsg('Selecione uma categoria.');
      return;
    }

    const payload = {
      cartaoId,
      descricao: descricao.trim(),
      valorTotalCentavos: centavos,
      numeroParcelas,
      categoriaId,
      donoId,
      dataCompra,
      observacao: observacao.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar a compra no cartão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uids = plano?.memberIds || [];
  const uidPessoa1 = uids[0] || 'p1';
  const uidPessoa2 = uids[1] || 'p2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Nova Compra no Cartão
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gera despesa e parcelas automáticas nas faturas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Seletor de Cartão */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Cartão de Crédito
            </label>
            <select
              required
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
            >
              {activeCards.length === 0 ? (
                <option value="" disabled>
                  Nenhum cartão ativo cadastrado
                </option>
              ) : (
                activeCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.ultimos4 ? `(final ${c.ultimos4})` : ''} - Fecha dia {c.diaFechamento}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Descrição e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Descrição da Compra
              </label>
              <input
                type="text"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Passagens aéreas, Sofá novo, Mercado"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Valor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-zinc-400 font-mono">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={valorTexto}
                  onChange={(e) => setValorTexto(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Data e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Data da Compra</span>
              </label>
              <input
                type="date"
                required
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>Categoria</span>
              </label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <optgroup key={group} label={group}>
                    {cats.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Parcelamento (1x até 24x) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Número de Parcelas</span>
              </label>
              {installmentSimulation && (
                <span className="text-[11px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                  {installmentSimulation}
                </span>
              )}
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {[1, 2, 3, 4, 6, 10, 12, 18, 24].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumeroParcelas(n)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    numeroParcelas === n
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {n === 1 ? 'À vista' : `${n}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Responsável pela Despesa</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDonoId('')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  donoId === ''
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-purple-500 fill-current" />
                <span>Compartilhado</span>
              </button>

              <button
                type="button"
                onClick={() => setDonoId(uidPessoa1)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  donoId === uidPessoa1
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">{membro1Nome}</span>
              </button>

              {segundoMembroUid ? (
                <button
                  type="button"
                  onClick={() => setDonoId(uidPessoa2)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    donoId === uidPessoa2
                      ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 font-semibold shadow-2xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-pink-500" />
                  <span className="truncate">{membro2Nome || 'Pessoa 2'}</span>
                </button>
              ) : (
                <div className="py-2 px-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-center">
                  <span>Pessoa 2 pendente</span>
                </div>
              )}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Observação (opcional)</span>
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Comprado com desconto, garantia estendida"
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || activeCards.length === 0}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              <span>{isSubmitting ? 'Registrando...' : 'Confirmar Compra'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
