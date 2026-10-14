import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  LogOut,
  UserPlus,
  Users,
  User,
  Heart,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { formatMesAno } from '../../utils/money';
import { InviteModal } from '../plan/InviteModal';
import { PWAInstallButton } from '../ui/PWAInstallButton';

interface HeaderProps {
  onNovoLancamentoClick: () => void;
}

export function Header({ onNovoLancamentoClick }: HeaderProps) {
  const {
    user,
    logout,
    plano,
    filtroPessoa,
    setFiltroPessoa,
    mesSelecionado,
    setMesSelecionado,
    regime,
    setRegime,
    membro1Nome,
    membro2Nome,
    segundoMembroUid,
  } = useAuthAndPlan();

  const { theme, toggleTheme } = useTheme();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Navegação de mês
  const handleMesAnterior = () => {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const date = new Date(ano, mes - 2, 1);
    setMesSelecionado(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleMesProximo = () => {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const date = new Date(ano, mes, 1);
    setMesSelecionado(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const uids = plano?.memberIds || [];
  const uidPessoa1 = uids[0] || 'p1';
  const uidPessoa2 = uids[1] || 'p2';

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#101317]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-8 py-3 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-7xl mx-auto">
          {/* Seletor de Mês e Regime */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mês com setas */}
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={handleMesAnterior}
                aria-label="Mês anterior"
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 min-w-32 text-center select-none">
                {formatMesAno(mesSelecionado)}
              </div>

              <button
                type="button"
                onClick={handleMesProximo}
                aria-label="Próximo mês"
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Alternância de Regime (Competência vs Caixa) - Regra de Negócio 2 */}
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-0.5 text-[11px] shadow-2xs">
              <button
                type="button"
                onClick={() => setRegime('competencia')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  regime === 'competencia'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Competência
              </button>
              <button
                type="button"
                onClick={() => setRegime('caixa')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  regime === 'caixa'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Caixa
              </button>
            </div>
          </div>

          {/* Filtro de Pessoa (Todos, Pessoa 1, Pessoa 2) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setFiltroPessoa('todos')}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroPessoa === 'todos'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Todos</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroPessoa(uidPessoa1)}
                className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroPessoa === uidPessoa1
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>{membro1Nome}</span>
              </button>

              {segundoMembroUid ? (
                <button
                  type="button"
                  onClick={() => setFiltroPessoa(uidPessoa2)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroPessoa === uidPessoa2
                      ? 'bg-pink-600 text-white font-semibold shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-pink-500" />
                  <span>{membro2Nome || 'Pessoa 2'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Convidar Pessoa 2</span>
                </button>
              )}
            </div>

            {/* Botão Novo Lançamento */}
            <Button
              onClick={onNovoLancamentoClick}
              variant="primary"
              size="sm"
              className="gap-1.5 shadow-sm text-xs py-2 px-3.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo lançamento</span>
            </Button>

            {/* Botão Instalar PWA */}
            <PWAInstallButton variant="header" />

            {/* Alternância de Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema claro/escuro"
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Perfil & Logout */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}

              <button
                type="button"
                onClick={logout}
                title="Desconectar do Firebase"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  );
}
