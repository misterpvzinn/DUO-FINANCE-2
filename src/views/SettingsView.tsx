import React, { useState } from 'react';
import { Settings, Moon, Sun, Shield, Palette, Heart, Users, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { Button } from '../components/ui/Button';
import { CoupleSettingsModal } from '../components/couple/CoupleSettingsModal';

export function SettingsView() {
  const { theme, toggleTheme } = useTheme();
  const { coupleSettings, updateCoupleSettings } = useFinance();
  const [coupleModalOpen, setCoupleModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Configurações
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Preferências do sistema, aparência, finanças de casal e dados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* Couple Settings Card */}
        <Card className="border-pink-200/60 dark:border-pink-950/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <CardTitle>Finanças para Casal</CardTitle>
                <CardDescription>Gestão compartilhada, divisão de despesas e acerto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Status do Modo Casal</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {coupleSettings.enabled
                      ? `${coupleSettings.user1Name} & ${coupleSettings.user2Name} (Ativo)`
                      : 'Modo individual ativo'}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  coupleSettings.enabled
                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {coupleSettings.enabled ? 'Ativado' : 'Desativado'}
                </span>
              </div>

              {coupleSettings.enabled && (
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Divisão padrão:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {coupleSettings.defaultSplitPercentage}% ({coupleSettings.user1Name}) / {100 - coupleSettings.defaultSplitPercentage}% ({coupleSettings.user2Name})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCoupleModalOpen(true)}
                className="gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configurar Casal & Nomes</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateCoupleSettings({ enabled: !coupleSettings.enabled })}
                className="text-xs"
              >
                {coupleSettings.enabled ? 'Pausar Modo Casal' : 'Ativar Agora'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize o tema visual do aplicativo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Sun className="w-4 h-4 text-zinc-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tema Atual</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                    {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Alternar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System & Architecture Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Gerenciamento de Dados</CardTitle>
                <CardDescription>Armazenamento local, privacidade e reset</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Seus dados financeiros e de casal ficam armazenados com total privacidade no armazenamento local do seu navegador.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Deseja restaurar os dados de demonstração iniciais com suporte a casal?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                Restaurar Dados Iniciais
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CoupleSettingsModal
        isOpen={coupleModalOpen}
        onClose={() => setCoupleModalOpen(false)}
      />
    </div>
  );
}
