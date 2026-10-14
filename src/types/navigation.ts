export type NavRoute = 'dashboard' | 'transactions' | 'accounts' | 'budgets' | 'goals' | 'settings';

export interface NavItemConfig {
  id: NavRoute;
  label: string;
  path: string;
  iconName: 'LayoutDashboard' | 'ArrowLeftRight' | 'WalletCards' | 'Target' | 'Settings';
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'transactions',
    label: 'Lançamentos',
    path: '/transactions',
    iconName: 'ArrowLeftRight',
  },
  {
    id: 'accounts',
    label: 'Plano de Contas',
    path: '/accounts',
    iconName: 'WalletCards',
  },
  {
    id: 'budgets',
    label: 'Metas e Orçamentos',
    path: '/budgets',
    iconName: 'Target',
  },
];

export const BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'settings',
    label: 'Configurações',
    path: '/settings',
    iconName: 'Settings',
  },
];
