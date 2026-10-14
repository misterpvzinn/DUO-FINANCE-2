import React, { useState } from 'react';
import {
  Heart,
  ArrowRight,
  CheckCircle2,
  Settings2,
  Scale,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthName } from '../../utils/formatters';
import { CoupleSettingsModal } from './CoupleSettingsModal';

export function CoupleSettlementCard() {
  const { coupleSettings, settlementSummary, recordSettlementPayment, selectedMonth } =
    useFinance();

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [successPaymentNotice, setSuccessPaymentNotice] = useState(false);

  if (!coupleSettings.enabled) return null;

  const {
    totalShared,
    paidByUser1,
    paidByUser2,
    paidByJoint,
    amountOwed,
    debtorName,
    creditorName,
    isSettled,
  } = settlementSummary;

  const totalOutOfPocket = paidByUser1 + paidByUser2;
  const user1Percentage =
    totalOutOfPocket > 0 ? Math.round((paidByUser1 / totalOutOfPocket) * 100) : 50;
  const user2Percentage = 100 - user1Percentage;

  const handleSettle = () => {
    recordSettlementPayment();
    setSuccessPaymentNotice(true);
    setTimeout(() => setSuccessPaymentNotice(false), 3500);
  };

  return (
    <Card className="p-5 sm:p-6 border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-br from-white via-zinc-50/50 to-pink-50/20 dark:from-[#14171c] dark:via-zinc-900/50 dark:to-pink-950/10 shadow-xs relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Finanças do Casal: {coupleSettings.user1Name} & {coupleSettings.user2Name}
              </h3>
              <span className="text-[10px] font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 rounded-full">
                Divisão {coupleSettings.defaultSplitPercentage}% / {100 - coupleSettings.defaultSplitPercentage}%
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Acerto de contas e despesas compartilhadas em {formatMonthName(selectedMonth)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Configurar Casal</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-center">
        {/* Left: Total Shared */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
            Total Compartilhado no Mês
          </span>
          <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatCurrency(totalShared)}
          </span>
          <span className="text-[11px] text-zinc-400">
            Aluguel, contas da casa, mercado e lazer a dois
          </span>
        </div>

        {/* Center: Contribution split bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {coupleSettings.user1Name}: {formatCurrency(paidByUser1)} ({user1Percentage}%)
            </span>
            <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              {coupleSettings.user2Name}: {formatCurrency(paidByUser2)} ({user2Percentage}%)
            </span>
          </div>

          {/* Visual Bar */}
          <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${user1Percentage}%` }}
              title={`${coupleSettings.user1Name}: ${user1Percentage}%`}
            />
            <div
              className="h-full bg-pink-500 transition-all duration-300"
              style={{ width: `${user2Percentage}%` }}
              title={`${coupleSettings.user2Name}: ${user2Percentage}%`}
            />
          </div>

          {paidByJoint > 0 && (
            <span className="text-[10px] text-zinc-400 text-right">
              + {formatCurrency(paidByJoint)} pagos direto da Conta Conjunta
            </span>
          )}
        </div>

        {/* Right: Settlement Status & Action */}
        <div className="flex flex-col sm:items-end justify-center gap-2 bg-white/70 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Status do Acerto
            </span>
            {isSettled ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-xs mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Contas 100% equilibradas!</span>
              </div>
            ) : (
              <div className="mt-0.5">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <span className="text-pink-600 dark:text-pink-400">{debtorName}</span> deve transferir:
                </p>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(amountOwed)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  para <span className="text-blue-600 dark:text-blue-400 font-medium">{creditorName}</span>
                </p>
              </div>
            )}
          </div>

          {!isSettled && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleSettle}
              className="w-full sm:w-auto text-xs gap-1.5 mt-1"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Registrar Acerto (PIX)</span>
            </Button>
          )}

          {successPaymentNotice && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              ✓ Lançamento de acerto registrado!
            </span>
          )}
        </div>
      </div>

      <CoupleSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </Card>
  );
}
