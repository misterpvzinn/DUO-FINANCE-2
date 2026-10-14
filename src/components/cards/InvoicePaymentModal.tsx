import React, { useState, useEffect } from 'react';
import {
  Wallet,
  X,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { FaturaCartao, ContaPlano, CartaoCredito } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { parseBRLToCents, formatBRL } from '../../utils/money';
import { Button } from '../ui/Button';

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: (params: {
    faturaId: string;
    contaPagamentoId: string;
    valorCentavos: number;
    dataPagamento: string;
    donoId: string;
  }) => Promise<string>;
  fatura: FaturaCartao | null;
  cartao: CartaoCredito | null;
  accounts: ContaPlano[];
}

export function InvoicePaymentModal({
  isOpen,
  onClose,
  onPay,
  fatura,
  cartao,
  accounts,
}: InvoicePaymentModalProps) {
  const { user } = useAuthAndPlan();

  const [contaPagamentoId, setContaPagamentoId] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const saldoDevedorCentavos = fatura
    ? Math.max(0, fatura.valorTotalCentavos - (fatura.valorPagoCentavos || 0))
    : 0;

  useEffect(() => {
    if (!isOpen || !fatura) return;
    setErrorMsg(null);

    const today = new Date().toISOString().split('T')[0];
    setDataPagamento(today);

    // Valor padrão é o saldo devedor restante
    setValorTexto((saldoDevedorCentavos / 100).toFixed(2).replace('.', ','));

    // Primeira conta ativa
    const activeAccs = accounts.filter((a) => a.ativa);
    if (activeAccs.length > 0) {
      setContaPagamentoId(activeAccs[0].id);
    }
  }, [isOpen, fatura, accounts]);

  if (!isOpen || !fatura || !cartao) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!contaPagamentoId) {
      setErrorMsg('Selecione a conta bancária de origem para o pagamento.');
      return;
    }

    const centavos = parseBRLToCents(valorTexto);
    if (centavos <= 0) {
      setErrorMsg('O valor do pagamento deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPay({
        faturaId: fatura.id,
        contaPagamentoId,
        valorCentavos: centavos,
        dataPagamento,
        donoId: cartao.donoId || user?.uid || '',
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar pagamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Registrar Pagamento da Fatura
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {cartao.nome} • Mês {fatura.mesReferencia}
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

        {/* Resumo da Fatura */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 block font-medium">Total</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {formatBRL(fatura.valorTotalCentavos)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-medium">Pago</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatBRL(fatura.valorPagoCentavos || 0)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-medium">Saldo Restante</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              {formatBRL(saldoDevedorCentavos)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-zinc-400" />
              <span>Conta de Saída (Origem dos Fundos)</span>
            </label>
            <select
              required
              value={contaPagamentoId}
              onChange={(e) => setContaPagamentoId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
            >
              {accounts.filter((a) => a.ativa).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nome} ({acc.donoId ? 'Individual' : 'Compartilhada'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Valor do Pagamento
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
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Data do Pagamento</span>
              </label>
              <input
                type="date"
                required
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Regra Fundamental 8 */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Regra Contábil 8:</span>
              <span>
                O pagamento de fatura é registrado como <b>transferência bancária</b> para o cartão, liquidando o limite sem duplicar a despesa no orçamento.
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
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
              disabled={isSubmitting}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <span>{isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
