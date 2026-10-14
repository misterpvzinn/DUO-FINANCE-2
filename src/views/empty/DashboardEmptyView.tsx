import React from 'react';
import {
  LayoutDashboard,
  Heart,
  UserPlus,
  ShieldCheck,
  Calendar,
  Layers,
  CreditCard,
  Coins,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { formatCentavosParaReal, formatMesAno } from '../../utils/money';
import { Button } from '../../components/ui/Button';

interface DashboardEmptyViewProps {
  onOpenInvite: () => void;
  onNovoLancamentoClick: () => void;
}

export function DashboardEmptyView({ onOpenInvite, onNovoLancamentoClick }: DashboardEmptyViewProps) {
  const {
    plano,
    membro1Nome,
    membro2Nome,
    segundoMembroUid,
    mesSelecionado,
    regime,
    filtroPessoa,
  } = useAuthAndPlan();

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto py-2 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 backdrop-blur-md">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Plano Compartilhado: {plano?.nome}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Boas-vindas ao DuoFinance
            </h1>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              O espaço compartilhado do casal para planejar o mês de {formatMesAno(mesSelecionado)} no regime de{' '}
              <b className="text-white capitalize">{regime}</b>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!segundoMembroUid && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenInvite}
                className="gap-2 text-xs bg-rose-500 hover:bg-rose-600 text-white border-none"
              >
                <UserPlus className="w-4 h-4" />
                <span>Convidar Parceiro(a)</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Couple Status Pill Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Consolidado */}
        <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800/90 p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Saldo Consolidado
          </span>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatCentavosParaReal(0)}
            </span>
            <p className="text-[11px] text-zinc-400 mt-1">
              Contas do casal sincronizadas
            </p>
          </div>
        </div>

        {/* Card 2: Receitas Previstas */}
        <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800/90 p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Receitas do Mês
          </span>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCentavosParaReal(0)}
            </span>
            <p className="text-[11px] text-zinc-400 mt-1">
              Competência {mesSelecionado}
            </p>
          </div>
        </div>

        {/* Card 3: Despesas Totais */}
        <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800/90 p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Despesas Totais
          </span>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatCentavosParaReal(0)}
            </span>
            <p className="text-[11px] text-zinc-400 mt-1">
              Fixos, variáveis e lazer
            </p>
          </div>
        </div>

        {/* Card 4: Status do Segundo Membro */}
        <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800/90 p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Parceria do Plano
          </span>
          <div className="mt-3">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${segundoMembroUid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>{segundoMembroUid ? membro2Nome : 'Aguardando Parceiro'}</span>
            </span>
            <p className="text-[11px] text-zinc-400 mt-1">
              {segundoMembroUid ? '2 contas Google conectadas' : 'Convide por e-mail no topo'}
            </p>
          </div>
        </div>
      </div>

      {/* Regras de Negócio e Estado Inicial */}
      <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800/90 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
          <LayoutDashboard className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Painel Geral Pronto para Lançamentos
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Seu ambiente está provisionado no Firebase Firestore. As regras de segurança protegem as subcoleções para que apenas os membros autorizados deste plano possam ler e gravar.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenInvite}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-pink-500" />
            <span>Gerenciar Convites</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onNovoLancamentoClick}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <span>Conhecer Estrutura de Lançamentos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
