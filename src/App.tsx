import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthAndPlanProvider, useAuthAndPlan } from './context/AuthAndPlanContext';
import { LoginView } from './views/LoginView';
import { CreatePlanModal } from './components/plan/CreatePlanModal';
import { AppLayout } from './components/layout/AppLayout';
import { Heart, RefreshCw } from 'lucide-react';

function AppRoot() {
  const { user, loadingAuth, plano, loadingPlano } = useAuthAndPlan();

  if (loadingAuth || (user && loadingPlano)) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0d0f12] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-md animate-pulse">
          <Heart className="w-6 h-6 fill-current text-rose-500" />
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Sincronizando com Firebase...</span>
        </div>
      </div>
    );
  }

  // 1. Usuário não autenticado -> Tela de Login com Google
  if (!user) {
    return <LoginView />;
  }

  // 2. Usuário autenticado sem plano vinculado -> Tela de Criar Plano ou Aceitar Convite
  if (!plano) {
    return <CreatePlanModal />;
  }

  // 3. Usuário autenticado com plano ativo -> Layout Completo com Sidebar, Header e Views
  return <AppLayout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthAndPlanProvider>
        <AppRoot />
      </AuthAndPlanProvider>
    </ThemeProvider>
  );
}
