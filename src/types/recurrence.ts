import { Timestamp } from 'firebase/firestore';

export type RecurrenceFrequency = 'mensal' | 'semanal' | 'quinzenal' | 'anual';
export type RecurrenceType = 'receita' | 'despesa' | 'transferencia';
export type RecurrenceExecutionStatus = 'gerada' | 'cancelada' | 'erro';

export interface RecorrenciaFinanceira {
  id: string;
  nome: string;
  tipo: RecurrenceType;
  valorCentavos: number;
  contaId: string;
  contaDestinoId?: string;
  categoriaId?: string;
  donoId: string; // "" = compartilhada, ou uid
  frequencia: RecurrenceFrequency;
  diaExecucao?: number; // 1 a 31
  diaSemana?: number; // 0 a 6 (0 = domingo, 1 = segunda, ..., 6 = sábado)
  mesExecucao?: number; // 1 a 12
  dataInicio: string; // "YYYY-MM-DD"
  dataFim?: string; // "YYYY-MM-DD"
  proximaExecucao: string; // "YYYY-MM-DD"
  ativa: boolean;
  observacao?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExecucaoRecorrencia {
  id: string;
  recorrenciaId: string;
  dataPrevista: string; // "YYYY-MM-DD"
  dataExecucao: string; // "YYYY-MM-DD"
  lancamentoId: string;
  status: RecurrenceExecutionStatus;
  createdAt: Timestamp;
}
