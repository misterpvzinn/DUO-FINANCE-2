import { Timestamp } from 'firebase/firestore';

export interface MetaFinanceira {
  id: string;
  nome: string;
  descricao?: string;
  valorObjetivoCentavos: number;
  valorAtualCentavos: number;
  dataInicio: string; // "YYYY-MM-DD"
  dataAlvo?: string; // "YYYY-MM-DD"
  donoId: string; // "" = compartilhada, ou uid
  contaDestinoId?: string;
  categoriaId?: string;
  status: 'ativa' | 'concluida' | 'cancelada';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MovimentacaoMeta {
  id: string;
  metaId: string;
  valorCentavos: number;
  data: string; // "YYYY-MM-DD"
  contaOrigemId?: string;
  lancamentoId?: string;
  observacao?: string;
  createdAt: Timestamp;
}

export interface OrcamentoFinanceiro {
  id: string;
  nome: string;
  categoriaId: string;
  valorLimiteCentavos: number;
  mesReferencia: string; // "YYYY-MM"
  donoId: string; // "" = compartilhado, ou uid
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoalProgress {
  percentual: number; // visualmente 0..100% ou maior se exceder
  percentualVisual: number; // limitado a 100 para barras
  valorRestanteCentavos: number;
  isAtingida: boolean;
  diasRestantes?: number;
  prazoUltrapassado?: boolean;
}

export interface BudgetUsage {
  orcamentoId: string;
  nome: string;
  categoriaId: string;
  categoriaNome: string;
  categoriaCor: string;
  valorLimiteCentavos: number;
  valorUtilizadoCentavos: number;
  valorDisponivelCentavos: number;
  percentualUtilizado: number;
  status: 'dentro' | 'proximo' | 'acima'; // dentro: <80%, proximo: 80%..99.9%, acima: >=100%
  donoId: string;
}

export interface BudgetSummary {
  totalOrcadoCentavos: number;
  totalUtilizadoCentavos: number;
  totalDisponivelCentavos: number;
  quantidadeAcimaLimite: number;
}
