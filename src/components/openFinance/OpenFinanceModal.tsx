import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Lock,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useOpenFinance } from '../../context/OpenFinanceContext';
import { useFinance } from '../../context/FinanceContext';
import { ConnectBank } from './ConnectBank';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface OpenFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'connect' | 'manage';
}

export function OpenFinanceModal({ isOpen, onClose, defaultTab = 'connect' }: OpenFinanceModalProps) {
  const {
    connections,
    disconnectBank,
    syncConnection,
    syncAll,
    isSyncing,
  } = useOpenFinance();

  const { coupleSettings } = useFinance();

  const [activeTab, setActiveTab] = useState<'connect' | 'manage'>(defaultTab);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const user1Name = coupleSettings.user1Name || 'Paulo';
  const user2Name = coupleSettings.user2Name || 'Ana';

  const handleSyncAll = async () => {
    const res = await syncAll();
    setSyncFeedback(`${res.totalNewTransactions} lançamentos atualizados com sucesso!`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleSyncSingle = async (id: string, name: string) => {
    const res = await syncConnection(id);
    setSyncFeedback(`Sincronizado com ${name}! ${res.newTransactionsCount} novos lançamentos.`);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Finance Brasil"
      description="Sincronização bancária automática e segura regulamentada pelo Banco Central do Brasil."
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('connect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'connect'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Conectar Novo Banco
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Bancos Conectados</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {connections.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Padrão Bacen TLS 1.3</span>
          </div>
        </div>

        {/* Sync Feedback Alert */}
        {syncFeedback && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Tab 1: Connect Bank Component */}
        {activeTab === 'connect' && (
          <ConnectBank
            onSuccess={() => {
              setSyncFeedback('Novo banco vinculado e integrado com sucesso!');
              setTimeout(() => setSyncFeedback(null), 3500);
            }}
            onCancel={onClose}
          />
        )}

        {/* Tab 2: Manage Active Connections */}
        {activeTab === 'manage' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {connections.length} Instituições Conectadas
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
                <span>Sincronizar Todas as Contas</span>
              </Button>
            </div>

            {connections.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                Nenhum banco conectado ainda. Conecte o primeiro na aba "Conectar Novo Banco".
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {connections.map((conn) => {
                  const holderName =
                    conn.holder === 'user1'
                      ? user1Name
                      : conn.holder === 'user2'
                      ? user2Name
                      : 'Casal (Conjunta)';

                  return (
                    <div
                      key={conn.id}
                      className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          style={{ backgroundColor: conn.bankColor, color: conn.bankTextColor }}
                        >
                          {conn.bankName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {conn.bankName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              {conn.accountNumberMasked}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                conn.holder === 'user1'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                  : conn.holder === 'user2'
                                  ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400'
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                              }`}
                            >
                              {holderName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                            <span>Saldo: <b className="text-zinc-700 dark:text-zinc-300 font-mono">{formatCurrency(conn.balance)}</b></span>
                            <span>•</span>
                            <span>Sincronizado: {formatDate(conn.lastSyncAt.split('T')[0])}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(conn.id, conn.bankName)}
                          disabled={isSyncing}
                          title="Sincronizar extrato deste banco agora"
                          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => disconnectBank(conn.id)}
                          title="Desconectar banco e revogar consentimento"
                          className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
