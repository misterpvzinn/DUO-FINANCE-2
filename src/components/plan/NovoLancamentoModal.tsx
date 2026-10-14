import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface NovoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovoLancamentoModal({ isOpen, onClose }: NovoLancamentoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Novo Lançamento
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Etapa 1: Acesso &amp; Estrutura do Casal
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 space-y-2.5">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            Estrutura de dados preparada no Firestore:
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Armazenamento de valores estritamente em centavos inteiros.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Controle de datas: dataCompetencia e dataCaixa.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Associação por donoId (Pessoa 1, Pessoa 2 ou compartilhado).</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Nesta etapa inicial foram implementados o login com Google, criação de plano, convite do segundo membro por e-mail e o layout completo com estados vazios. Na etapa seguinte os formulários interativos de lançamento estarão ativos!
        </p>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose} className="text-xs">
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
