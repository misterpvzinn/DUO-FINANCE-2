import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  X,
  AlertCircle,
  Calendar,
  Lock,
  User,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { CartaoCredito } from '../../types/finance';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { parseBRLToCents, formatBRL } from '../../utils/money';
import { Button } from '../ui/Button';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: any) => Promise<void>;
  cardToEdit?: CartaoCredito | null;
}

const BANDEIRAS = [
  'Mastercard',
  'Visa',
  'Elo',
  'American Express',
  'Nubank',
  'Inter',
  'Itaú',
  'Bradesco',
  'Santander',
  'Outra',
];

export function CardModal({ isOpen, onClose, onSave, cardToEdit }: CardModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const isEditing = !!cardToEdit;

  const [nome, setNome] = useState('');
  const [bandeira, setBandeira] = useState('Mastercard');
  const [ultimos4, setUltimos4] = useState('');
  const [limiteTexto, setLimiteTexto] = useState('');
  const [diaFechamento, setDiaFechamento] = useState<number>(10);
  const [diaVencimento, setDiaVencimento] = useState<number>(17);
  const [donoId, setDonoId] = useState('');
  const [ativo, setAtivo] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);

    if (cardToEdit) {
      setNome(cardToEdit.nome);
      setBandeira(cardToEdit.bandeira || 'Mastercard');
      setUltimos4(cardToEdit.ultimos4 || '');
      setLimiteTexto((cardToEdit.limiteCentavos / 100).toFixed(2).replace('.', ','));
      setDiaFechamento(cardToEdit.diaFechamento);
      setDiaVencimento(cardToEdit.diaVencimento);
      setDonoId(cardToEdit.donoId || '');
      setAtivo(cardToEdit.ativo !== false);
    } else {
      setNome('');
      setBandeira('Mastercard');
      setUltimos4('');
      setLimiteTexto('5.000,00');
      setDiaFechamento(10);
      setDiaVencimento(17);
      setDonoId(''); // Compartilhado
      setAtivo(true);
    }
  }, [isOpen, cardToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim()) {
      setErrorMsg('Informe o nome do cartão.');
      return;
    }

    const centavos = parseBRLToCents(limiteTexto);
    if (centavos <= 0) {
      setErrorMsg('O limite do cartão deve ser maior que zero.');
      return;
    }

    if (diaFechamento < 1 || diaFechamento > 31) {
      setErrorMsg('O dia de fechamento deve estar entre 1 e 31.');
      return;
    }

    if (diaVencimento < 1 || diaVencimento > 31) {
      setErrorMsg('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    if (ultimos4.trim() && !/^\d{4}$/.test(ultimos4.trim())) {
      setErrorMsg('Os últimos 4 dígitos devem conter exatamente 4 caracteres numéricos.');
      return;
    }

    const payload = {
      nome: nome.trim(),
      bandeira: bandeira.trim(),
      ultimos4: ultimos4.trim() || undefined,
      limiteCentavos: centavos,
      diaFechamento: Number(diaFechamento),
      diaVencimento: Number(diaVencimento),
      donoId,
      ativo,
    };

    setIsSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao salvar o cartão.');
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
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {isEditing ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {plano?.nome || 'Finanças do Casal'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nome de Identificação do Cartão
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Nubank Ultravioleta, Black XP, Inter Gold"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Bandeira / Emissor
              </label>
              <select
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {BANDEIRAS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Últimos 4 dígitos (opcional)
              </label>
              <input
                type="text"
                maxLength={4}
                value={ultimos4}
                onChange={(e) => setUltimos4(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Limite Total de Crédito (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-zinc-400 font-mono">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={limiteTexto}
                  onChange={(e) => setLimiteTexto(e.target.value)}
                  placeholder="5.000,00"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Dia de Fechamento da Fatura
              </label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              <p className="text-[10px] text-zinc-400">Ex: dia 10</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Dia de Vencimento da Fatura
              </label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              <p className="text-[10px] text-zinc-400">Ex: dia 17</p>
            </div>
          </div>

          {/* Responsável pelo Cartão */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Titular / Responsável</span>
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

          {/* Segurança / Privacidade */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Segurança: Nunca solicitamos CVV, senhas ou o número integral do cartão.
            </span>
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
              disabled={isSubmitting}
              className="text-xs"
            >
              <span>{isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Cartão' : 'Cadastrar Cartão'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
