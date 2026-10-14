import React, { useState } from 'react';
import {
  Wallet,
  Landmark,
  PiggyBank,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Heart,
  User,
} from 'lucide-react';
import { ContaPlano } from '../../types/finance';
import { formatBRL } from '../../utils/money';

interface AccountCardProps {
  account: ContaPlano;
  currentBalanceCentavos: number;
  membro1Nome: string;
  membro2Nome: string;
  membro1Uid?: string;
  membro2Uid?: string;
  onEdit: (acc: ContaPlano) => void;
  onToggleActive: (acc: ContaPlano) => void;
  onDelete: (acc: ContaPlano) => void;
}

export function AccountCard({
  account,
  currentBalanceCentavos,
  membro1Nome,
  membro2Nome,
  membro1Uid,
  membro2Uid,
  onEdit,
  onToggleActive,
  onDelete,
}: AccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getDonoLabel = () => {
    if (!account.donoId) return 'Compartilhada';
    if (account.donoId === membro1Uid) return membro1Nome;
    if (account.donoId === membro2Uid) return membro2Nome;
    return 'Individual';
  };

  const isCompartilhada = !account.donoId;

  const tipoConfig = {
    corrente: { label: 'Conta Corrente', icon: Landmark },
    poupanca: { label: 'Poupança', icon: PiggyBank },
    carteira: { label: 'Carteira / Dinheiro', icon: Wallet },
    investimento: { label: 'Investimento', icon: TrendingUp },
  }[account.tipo] || { label: 'Conta', icon: Wallet };

  const TipoIcon = tipoConfig.icon;
  const isPositive = currentBalanceCentavos >= 0;

  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#14171c] border transition-all shadow-xs flex flex-col justify-between gap-4 relative group ${
        !account.ativa
          ? 'border-zinc-200 dark:border-zinc-800 opacity-60 bg-zinc-50/50 dark:bg-zinc-900/30'
          : 'border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Topo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white"
            style={{ backgroundColor: account.cor || '#3b82f6' }}
          >
            <TipoIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {account.nome}
              </h3>
              {!account.ativa && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Inativa
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap">
              <span>{tipoConfig.label}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-medium">
                {isCompartilhada ? (
                  <Heart className="w-3 h-3 text-purple-500 fill-current" />
                ) : (
                  <User className="w-3 h-3 text-blue-500" />
                )}
                <span>{getDonoLabel()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Menu de Ações */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Mais opções da conta"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-zinc-700 shadow-xl py-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(account);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Editar conta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleActive(account);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {account.ativa ? (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Desativar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ativar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(account);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Saldo e Detalhes */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
          Saldo Atual
        </span>
        <div className="flex items-baseline justify-between">
          <span
            className={`text-xl font-bold font-mono tracking-tight ${
              isPositive
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatBRL(currentBalanceCentavos)}
          </span>

          <span className="text-[11px] font-mono text-zinc-400">
            Inicial: {formatBRL(account.saldoInicialCentavos)}
          </span>
        </div>
      </div>
    </div>
  );
}
