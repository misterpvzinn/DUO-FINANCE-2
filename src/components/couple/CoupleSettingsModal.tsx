import React, { useState, useEffect } from 'react';
import { Users, Heart, Percent, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useFinance } from '../../context/FinanceContext';

interface CoupleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoupleSettingsModal({ isOpen, onClose }: CoupleSettingsModalProps) {
  const { coupleSettings, updateCoupleSettings } = useFinance();

  const [enabled, setEnabled] = useState(coupleSettings.enabled);
  const [user1Name, setUser1Name] = useState(coupleSettings.user1Name);
  const [user2Name, setUser2Name] = useState(coupleSettings.user2Name);
  const [splitPercentage, setSplitPercentage] = useState(coupleSettings.defaultSplitPercentage);

  useEffect(() => {
    if (isOpen) {
      setEnabled(coupleSettings.enabled);
      setUser1Name(coupleSettings.user1Name);
      setUser2Name(coupleSettings.user2Name);
      setSplitPercentage(coupleSettings.defaultSplitPercentage);
    }
  }, [isOpen, coupleSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCoupleSettings({
      enabled,
      user1Name: user1Name.trim() || 'Paulo',
      user2Name: user2Name.trim() || 'Ana',
      defaultSplitPercentage: splitPercentage,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações de Finanças para Casal"
      description="Gerencie o controle financeiro conjunto, nomes e divisão de despesas."
    >
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Ativar Modo Casal
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Permite registrar despesas individuais, conjuntas e acerto de contas.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900" />
          </label>
        </div>

        {enabled && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Names of both partners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Seu Nome / Parceiro(a) 1</span>
                </label>
                <Input
                  value={user1Name}
                  onChange={(e) => setUser1Name(e.target.value)}
                  placeholder="Ex: Paulo"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span>Nome do(a) Parceiro(a) 2</span>
                </label>
                <Input
                  value={user2Name}
                  onChange={(e) => setUser2Name(e.target.value)}
                  placeholder="Ex: Ana"
                  required
                />
              </div>
            </div>

            {/* Split Proportion Slider */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Regra Padrão de Divisão das Contas</span>
                </span>
                <span className="font-mono text-zinc-600 dark:text-zinc-300">
                  {user1Name}: {splitPercentage}% | {user2Name}: {100 - splitPercentage}%
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={splitPercentage}
                onChange={(e) => setSplitPercentage(Number(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white mt-1"
              />

              {/* Quick Split presets */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { label: '50% / 50%', val: 50 },
                  { label: '60% / 40%', val: 60 },
                  { label: '70% / 30%', val: 70 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setSplitPercentage(preset.val)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      splitPercentage === preset.val
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white font-medium'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] text-zinc-400 mt-1">
                O percentual acima será usado para calcular automaticamente o balanço mensal de "quem deve a quem" nas despesas compartilhadas.
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md">
            Salvar Preferências
          </Button>
        </div>
      </form>
    </Modal>
  );
}
