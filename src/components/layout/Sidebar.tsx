import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Layers,
  Target,
  PieChart,
  Repeat,
  Heart,
  UserPlus,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { RouteId } from '../../types/couplePlan';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { PWAInstallButton } from '../ui/PWAInstallButton';

interface SidebarProps {
  currentRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  onOpenInvite: () => void;
}

export function Sidebar({ currentRoute, onRouteChange, onOpenInvite }: SidebarProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();

  const NAV_ITEMS: { id: RouteId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard },
    { id: 'plano-de-contas', label: 'Plano de Contas', icon: Layers },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'orcamentos', label: 'Orçamentos', icon: PieChart },
    { id: 'recorrencias', label: 'Recorrências', icon: Repeat },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-[#101317] border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between p-4 transition-colors min-h-screen">
      <div className="flex flex-col gap-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <Heart className="w-5 h-5 fill-current text-rose-500" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {plano?.nome || 'DuoFinance'}
            </h2>
            <p className="text-[11px] text-zinc-400 truncate">
              Finanças a Dois
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          <span className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Navegação
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onRouteChange(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Couple Card & Member Status */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
        <PWAInstallButton variant="sidebar" />

        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Membros do Plano
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold">
              {segundoMembroUid ? '2/2 Ativos' : '1/2 Ativo'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
                {membro1Nome}
              </span>
            </div>

            {segundoMembroUid ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
                  {membro2Nome}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenInvite}
                className="w-full mt-2 py-1.5 px-2 rounded-lg bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 dark:hover:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Convidar Parceiro(a)</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 justify-center">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Firestore Security Rules Ativas</span>
        </div>
      </div>
    </aside>
  );
}
