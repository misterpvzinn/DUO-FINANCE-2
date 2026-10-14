import React, { useState } from 'react';
import { Heart, ShieldCheck, Users, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuthAndPlan } from '../context/AuthAndPlanContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

export function LoginView() {
  const { loginWithGoogle } = useAuthAndPlan();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0d0f12] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900 transition-colors">
      {/* Top Navbar */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <Heart className="w-5 h-5 fill-current text-rose-500" />
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            DuoFinance
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Hero Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
            <Users className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Finanças para Casais
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Controle financeiro conjunto para duas pessoas com regime de competência, cartões, metas e divisão inteligente.
            </p>
          </div>

          {/* Business rules badge pill */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Autenticação e Firestore</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Login individual seguro com Google. Acesso estrito por plano financeiro com Security Rules do Firebase.
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-3 shadow-xs cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-600"
          >
            {/* Official Google 'G' icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Conectando ao Google...' : 'Continuar com o Google'}</span>
          </Button>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 max-w-sm mx-auto">
        DuoFinance • Plataforma de Gestão Financeira para Casais. Desenvolvido com React, Tailwind CSS e Firebase.
      </div>
    </div>
  );
}
