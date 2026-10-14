import React, { useState } from 'react';
import { Heart, Sparkles, Check, ArrowRight, Mail, LogOut, Users } from 'lucide-react';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { parseRealParaCentavos, formatCentavosParaReal } from '../../utils/money';
import { Button } from '../ui/Button';

export function CreatePlanModal() {
  const {
    user,
    criarPlano,
    convitesPendentes,
    aceitarConvite,
    recusarConvite,
    logout,
  } = useAuthAndPlan();

  const [nomePlano, setNomePlano] = useState('Finanças do Casal');
  const [rendaTexto, setRendaTexto] = useState('5.000,00');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePlano.trim()) return;

    setLoading(true);
    try {
      const centavos = parseRealParaCentavos(rendaTexto);
      await criarPlano(nomePlano.trim(), centavos);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar o plano. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleAceitar = async (convite: any) => {
    setActionLoadingId(convite.id);
    try {
      await aceitarConvite(convite);
    } catch (err: any) {
      alert(err.message || 'Erro ao aceitar convite.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRecusar = async (conviteId: string) => {
    setActionLoadingId(conviteId);
    try {
      await recusarConvite(conviteId);
    } catch (err: any) {
      alert(err.message || 'Erro ao recusar convite.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0d0f12] flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#14171c] border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* User bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuário'}
                className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-zinc-300">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {user?.displayName || 'Usuário Google'}
              </p>
              <p className="text-[11px] text-zinc-400">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sair da conta"
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Convites pendentes recebidos */}
        {convitesPendentes.length > 0 && (
          <div className="p-4 rounded-xl border border-pink-200 dark:border-pink-900/60 bg-pink-50/50 dark:bg-pink-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-900 dark:text-pink-200">
              <Mail className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span>Você recebeu um convite para entrar em um plano!</span>
            </div>

            {convitesPendentes.map((convite) => (
              <div
                key={convite.id}
                className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-pink-100 dark:border-pink-900/40 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {convite.planoNome}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Convidado por: <b>{convite.criadorNome}</b>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRecusar(convite.id)}
                    disabled={actionLoadingId === convite.id}
                    className="px-2.5 py-1 text-[11px] rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Recusar
                  </button>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAceitar(convite)}
                    disabled={actionLoadingId === convite.id}
                    className="text-xs bg-pink-600 hover:bg-pink-700 text-white gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceitar Convite</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Criar novo plano */}
        <div className="space-y-4">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 mx-auto flex items-center justify-center shadow-sm">
              <Heart className="w-6 h-6 fill-current text-rose-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Criar Plano Compartilhado
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Configure o espaço financeiro para vocês dois. Você poderá convidar o segundo membro por e-mail logo em seguida.
            </p>
          </div>

          <form onSubmit={handleCriar} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nome do Plano
              </label>
              <input
                type="text"
                required
                value={nomePlano}
                onChange={(e) => setNomePlano(e.target.value)}
                placeholder="Ex: Finanças Paulo & Ana"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Sua Renda Mensal Líquida (R$)
              </label>
              <input
                type="text"
                value={rendaTexto}
                onChange={(e) => setRendaTexto(e.target.value)}
                placeholder="5.000,00"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 text-zinc-900 dark:text-zinc-100 font-mono font-medium"
              />
              <p className="text-[10px] text-zinc-400">
                Armazenado no Firestore como {parseRealParaCentavos(rendaTexto)} centavos (Regra 1).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[11px] text-zinc-500 space-y-1">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Modelo de Dados e Regras:
              </span>
              <p>
                Este plano será salvo no caminho <code>planos/&#123;planoId&#125;</code> com suas subcoleções protegidas pelas Security Rules do Firestore.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !nomePlano.trim()}
              className="w-full py-2.5 justify-center gap-2 text-xs shadow-sm font-semibold"
            >
              <span>{loading ? 'Criando Plano...' : 'Começar Plano do Casal'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
