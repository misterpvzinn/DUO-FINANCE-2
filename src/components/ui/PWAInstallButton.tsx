import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'sidebar' | 'header';
}

export function PWAInstallButton({ className = '', variant = 'header' }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isIOS, hasNativePrompt, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed as PWA standalone, don't show prompt
  if (isInstalled) {
    return null;
  }

  // If browser doesn't support PWA installation prompt and isn't iOS, don't clutter UI
  if (!canInstall && !hasNativePrompt && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (hasNativePrompt) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 3000);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={handleClick}
          type="button"
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-all cursor-pointer ${className}`}
          title="Instalar aplicativo no seu celular ou computador"
        >
          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Instalar App</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Acesso rápido offline</span>
          </div>
        </button>
      ) : (
        <button
          onClick={handleClick}
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/70 transition-all cursor-pointer ${className}`}
          title="Instalar Finance como Aplicativo (PWA)"
        >
          {installedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instalado!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Instalar App</span>
            </>
          )}
        </button>
      )}

      {/* iOS Safari instructions modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#14171c] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Instalar no seu iPhone / iPad
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Adicione o Finance à tela de início
                </p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 mb-5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  No Safari, toque no botão <strong>Compartilhar</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-500" /> na barra inferior.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-zinc-600 dark:text-zinc-300" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>
                  Toque em <strong>"Adicionar"</strong> no canto superior direito para finalizar.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
