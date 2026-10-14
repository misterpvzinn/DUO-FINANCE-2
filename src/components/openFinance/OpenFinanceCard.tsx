import React, { useState } from 'react';
import {
  Landmark,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useOpenFinance } from '../../context/OpenFinanceContext';
import { OpenFinanceModal } from './OpenFinanceModal';
import { formatDate } from '../../utils/formatters';

interface OpenFinanceCardProps {
  className?: string;
}

export function OpenFinanceCard({ className = '' }: OpenFinanceCardProps) {
  const { connections, syncAll, isSyncing, lastGlobalSync } = useOpenFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSync = async () => {
    const res = await syncAll();
    setSyncNotice(`${res.totalNewTransactions} lançamentos sincronizados.`);
    setTimeout(() => setSyncNotice(false as any), 3000);
  };

  return (
    <Card className={`p-5 border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-br from-white via-zinc-50/50 to-emerald-50/20 dark:from-[#14171c] dark:via-zinc-900/50 dark:to-emerald-950/10 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Info & Connected Banks */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-900/50">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Open Finance Brasil
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Bacen Ativo</span>
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {connections.length > 0
                ? `${connections.length} bancos conectados com sincronização automática de extratos e saldos.`
                : 'Conecte seus bancos para sincronizar lançamentos automaticamente.'}
            </p>

            {/* Bank pills */}
            {connections.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {connections.map((conn) => (
                  <span
                    key={conn.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-2xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: conn.bankColor }}
                    />
                    <span>{conn.bankName}</span>
                    <span className="text-[9px] text-zinc-400">{conn.accountNumberMasked}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {connections.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gerenciar Conexões</span>
          </Button>
        </div>
      </div>

      {syncNotice && (
        <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncNotice}</span>
        </div>
      )}

      <OpenFinanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Card>
  );
}
