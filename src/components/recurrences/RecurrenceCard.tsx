import React, { useState } from 'react';
import {
  Repeat,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  History,
  Trash2,
  Edit,
  Heart,
  User,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { RecorrenciaFinanceira } from '../../types/recurrence';
import { ContaPlano, CategoriaPlano } from '../../types/finance';
import { formatBRL, formatDataCurta } from '../../utils/money';

interface RecurrenceCardProps {
  recurrence: RecorrenciaFinanceira;
  contaOrigem?: ContaPlano;
  contaDestino?: ContaPlano;
  categoria?: CategoriaPlano;
  membro1Nome: string;
  membro2Nome: string;
  membro1Uid?: string;
  membro2Uid?: string;
  onEdit: (rec: RecorrenciaFinanceira) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onExecuteNow: (rec: RecorrenciaFinanceira) => void;
  onViewHistory: (rec: RecorrenciaFinanceira) => void;
  onDelete: (id: string) => void;
}

export function RecurrenceCard({
  recurrence,
  contaOrigem,
  contaDestino,
  categoria,
  membro1Nome,
  membro2Nome,
  membro1Uid,
  membro2Uid,
  onEdit,
  onPause,
  onResume,
  onExecuteNow,
  onViewHistory,
  onDelete,
}: RecurrenceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getDonoLabel = () => {
    if (!recurrence.donoId) return 'Compartilhado';
    if (recurrence.donoId === membro1Uid) return membro1Nome;
    if (recurrence.donoId === membro2Uid) return membro2Nome;
    return 'Individual';
  };

  const isCompartilhado = !recurrence.donoId;

  // Tipagem visual
  const typeConfig = {
    receita: {
      label: 'Receita',
      icon: TrendingUp,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    despesa: {
      label: 'Despesa',
      icon: TrendingDown,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/60',
    },
    transferencia: {
      label: 'Transferência',
      icon: ArrowRightLeft,
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/60',
    },
  }[recurrence.tipo];

  const TypeIcon = typeConfig.icon;

  const getFrequenciaLabel = () => {
    switch (recurrence.frequencia) {
      case 'semanal': {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const diaNome = recurrence.diaSemana !== undefined ? dias[recurrence.diaSemana] : '';
        return `Semanal (${diaNome})`;
      }
      case 'quinzenal':
        return 'Quinzenal (A cada 15 dias)';
      case 'anual': {
        const meses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const mesNome = recurrence.mesExecucao ? meses[recurrence.mesExecucao - 1] : '';
        return `Anual (Dia ${recurrence.diaExecucao} de ${mesNome})`;
      }
      case 'mensal':
      default:
        return `Mensal (Todo dia ${recurrence.diaExecucao || 1})`;
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl bg-white dark:bg-[#14171c] border transition-all shadow-xs flex flex-col justify-between gap-4 relative group ${
        !recurrence.ativa
          ? 'border-zinc-200 dark:border-zinc-800 opacity-70 bg-zinc-50/50 dark:bg-zinc-900/30'
          : 'border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Topo do Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${typeConfig.bgClass} ${typeConfig.colorClass}`}
          >
            <TypeIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {recurrence.nome}
              </h3>
              {!recurrence.ativa && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  Pausada
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium">
                {isCompartilhado ? (
                  <Heart className="w-3 h-3 text-purple-500 fill-current" />
                ) : (
                  <User className="w-3 h-3 text-blue-500" />
                )}
                <span>{getDonoLabel()}</span>
              </span>

              {categoria && (
                <>
                  <span>•</span>
                  <span className="truncate">{categoria.nome}</span>
                </>
              )}

              {contaOrigem && (
                <>
                  <span>•</span>
                  <span className="truncate">
                    {recurrence.tipo === 'transferencia' && contaDestino
                      ? `${contaOrigem.nome} ➔ ${contaDestino.nome}`
                      : contaOrigem.nome}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu de Ações (Regra 28) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Mais opções da recorrência"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-zinc-700 shadow-xl py-1 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(recurrence);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onExecuteNow(recurrence);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Executar agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewHistory(recurrence);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ver histórico</span>
                </button>

                {recurrence.ativa ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onPause(recurrence.id);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onResume(recurrence.id);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Reativar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(recurrence.id);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Valores e Próxima Execução */}
      <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <div>
            <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
              Valor
            </span>
            <span
              className={`text-lg font-bold ${
                recurrence.tipo === 'receita'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : recurrence.tipo === 'despesa'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {recurrence.tipo === 'receita' ? '+' : recurrence.tipo === 'despesa' ? '-' : ''}
              {formatBRL(recurrence.valorCentavos)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 block">
              Frequência
            </span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {getFrequenciaLabel()}
            </span>
          </div>
        </div>

        {/* Próxima execução */}
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Próxima ocorrência:</span>
          </span>
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {formatDataCurta(new Date(`${recurrence.proximaExecucao}T12:00:00`))}
          </span>
        </div>
      </div>
    </div>
  );
}
