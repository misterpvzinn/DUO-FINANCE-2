import React, { useState } from 'react';
import { Mail, Users, Check, AlertCircle, Copy, Send, Heart } from 'lucide-react';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { Button } from '../ui/Button';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { plano, convidarSegundoMembro, segundoMembroUid, membro2Nome } = useAuthAndPlan();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErro(null);

    try {
      await convidarSegundoMembro(email.trim());
      setSucesso(true);
      setEmail('');
    } catch (err: any) {
      setErro(err.message || 'Falha ao enviar convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Convidar Segundo Membro
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {plano?.nome || 'Finanças em Conjunto'}
            </p>
          </div>
        </div>

        {segundoMembroUid ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Plano Completo!
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Este plano já possui os dois membros conectados:{' '}
              <b className="text-zinc-800 dark:text-zinc-200">{membro2Nome}</b> já está ativo e sincronizando.
            </p>
            <div className="pt-4">
              <Button variant="outline" size="sm" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : sucesso ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Convite Registrado com Sucesso!
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Quando a pessoa fizer login no aplicativo com esta mesma conta Google, o convite aparecerá automaticamente para ela aceitar.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSucesso(false)}
              >
                Convidar outro e-mail
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Concluir
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnviarConvite} className="pt-4 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Digite o e-mail da conta Google da pessoa com quem você deseja compartilhar o plano. Ela terá acesso aos lançamentos, contas e relatórios compartilhados.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                E-mail do parceiro(a)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {erro && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Segurança Firestore:
              </span>
              <p>
                O segundo membro só terá acesso de leitura e escrita após aceitar este convite, respeitando as Security Rules do Firestore.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading || !email.trim()}
                className="gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Registrando...' : 'Enviar Convite'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
