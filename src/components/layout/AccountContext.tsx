import React, { useState } from 'react';
import {
  User,
  Heart,
  ChevronDown,
  Check,
  Share2,
  Sliders,
  Wallet,
  Shield,
  Eye,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { FinanceViewMode } from '../../types/finance';
import { CoupleSettingsModal } from '../couple/CoupleSettingsModal';

interface AccountContextProps {
  className?: string;
}

export function AccountContext({ className = '' }: AccountContextProps) {
  const {
    viewMode,
    setViewMode,
    coupleSettings,
    updateCoupleSettings,
    accounts,
  } = useFinance();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [coupleSettingsModalOpen, setCoupleSettingsModalOpen] = useState(false);

  const user1Name = coupleSettings.user1Name || 'Paulo';
  const user2Name = coupleSettings.user2Name || 'Ana';
  const isPersonal = viewMode === 'personal';
  const isCouple = viewMode === 'couple';

  const sharedAccountIds = coupleSettings.sharedAccountIds || ['acc-joint', 'acc-card', 'acc-invest'];

  const handleSelectMode = (mode: FinanceViewMode) => {
    setViewMode(mode);
  };

  const toggleAccountSharing = (accountId: string) => {
    const current = new Set(sharedAccountIds);
    if (current.has(accountId)) {
      current.delete(accountId);
    } else {
      current.add(accountId);
    }
    updateCoupleSettings({ sharedAccountIds: Array.from(current) });
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Segmented Control & Dropdown trigger */}
      <div className="flex items-center p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        {/* Segmented option: Pessoal */}
        <button
          type="button"
          onClick={() => handleSelectMode('personal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isPersonal
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          aria-label="Alternar para visão Pessoal"
          title={`Visão Pessoal (${user1Name})`}
        >
          <User className={`w-3.5 h-3.5 ${isPersonal ? 'text-blue-500' : 'text-zinc-400'}`} />
          <span className="hidden sm:inline">Pessoal</span>
          <span className="sm:hidden">{user1Name}</span>
        </button>

        {/* Segmented option: Casal (Paulo & Ana) */}
        <button
          type="button"
          onClick={() => handleSelectMode('couple')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isCouple
              ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 font-semibold shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          aria-label={`Alternar para visão Casal (${user1Name} & ${user2Name})`}
          title={`Visão Casal (${user1Name} & ${user2Name})`}
        >
          <Heart className={`w-3.5 h-3.5 ${isCouple ? 'fill-current text-pink-500' : 'text-zinc-400'}`} />
          <span className="hidden sm:inline">Casal ({user1Name} & {user2Name})</span>
          <span className="sm:hidden">Casal</span>
        </button>

        {/* Dropdown toggle button */}
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-label="Abrir opções de compartilhamento do contexto"
          title="Opções de compartilhamento e contexto de contas"
          className="ml-0.5 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80 rounded-md transition-colors cursor-pointer"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
            }`}
          />
        </button>
      </div>

      {/* AccountContext Dropdown Panel */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    Contexto de Contas
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Alternância de visão e compartilhamento de dados
                  </p>
                </div>
              </div>
            </div>

            {/* Mode selection items */}
            <div className="py-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Selecionar Modo de Visualização
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* Pessoal Card */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMode('personal');
                    setDropdownOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isPersonal
                      ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 ring-1 ring-blue-500/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5 text-xs">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Pessoal
                    </span>
                    {isPersonal && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    Apenas finanças próprias de {user1Name}.
                  </p>
                </button>

                {/* Casal Card */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMode('couple');
                    setDropdownOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isCouple
                      ? 'border-pink-500/80 bg-pink-50/50 dark:bg-pink-950/40 text-pink-950 dark:text-pink-200 ring-1 ring-pink-500/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5 text-xs">
                      <Heart className="w-3.5 h-3.5 fill-current text-pink-500" />
                      Casal
                    </span>
                    {isCouple && <Check className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    {user1Name} & {user2Name} com acerto de despesas.
                  </p>
                </button>
              </div>
            </div>

            {/* Sharing Accounts Management */}
            <div className="py-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Contas Compartilhadas com {user2Name}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {sharedAccountIds.length} selecionadas
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const isShared = sharedAccountIds.includes(acc.id);
                  return (
                    <label
                      key={acc.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-800"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                          {acc.name}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isShared}
                        onChange={() => toggleAccountSharing(acc.id)}
                        className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Privacy rule toggle */}
            <div className="py-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Regras de Privacidade
              </span>

              <label className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Ocultar gastos 100% pessoais do extrato conjunto
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Apenas transações marcadas como compartilhadas entram no extrato do casal.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={coupleSettings.hidePersonalFromJoint ?? false}
                  onChange={(e) =>
                    updateCoupleSettings({ hidePersonalFromJoint: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Footer */}
            <div className="pt-3 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">
                Divisão: <b>{coupleSettings.defaultSplitPercentage}% / {100 - coupleSettings.defaultSplitPercentage}%</b>
              </span>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setCoupleSettingsModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configurar Casal</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal for detailed couple settings */}
      <CoupleSettingsModal
        isOpen={coupleSettingsModalOpen}
        onClose={() => setCoupleSettingsModalOpen(false)}
      />
    </div>
  );
}
