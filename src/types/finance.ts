import { Timestamp } from 'firebase/firestore';

// Tipos oficiais da Parte 3: Lançamentos
export type TipoLancamento = 'receita' | 'despesa' | 'transferencia';
export type RegimeFinanceiro = 'competencia' | 'caixa';

export interface LancamentoFinanceiro {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valorCentavos: number;
  contaId: string;
  contaDestinoId?: string;
  categoriaId?: string;
  donoId: string; // "" para compartilhado ou uid para individual
  dataCompetencia: Timestamp;
  dataCaixa: Timestamp;
  observacao?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Campos estendidos para vínculo com Cartão (Parte 4)
  cartaoId?: string;
  compraCartaoId?: string;
  parcelaCartaoId?: string;
  faturaId?: string;
}

export interface ContaPlano {
  id: string;
  nome: string;
  tipo: 'corrente' | 'poupanca' | 'carteira' | 'investimento';
  saldoInicialCentavos: number;
  donoId: string; // "" para compartilhado ou uid para individual
  ativa: boolean;
  cor?: string;
}

export interface CategoriaPlano {
  id: string;
  nome: string;
  tipo: 'receita' | 'custo_fixo' | 'custo_variavel' | 'investimento' | 'lazer' | 'divida';
  categoriaPaiId?: string;
  cor?: string;
  icone?: string;
  ativa: boolean;
}

// ==========================================
// Tipos Oficiais da Parte 4: Cartões e Faturas
// ==========================================

export interface CartaoCredito {
  id: string;
  nome: string;
  bandeira?: string;
  ultimos4?: string;
  limiteCentavos: number;
  diaFechamento: number; // 1 a 31
  diaVencimento: number; // 1 a 31
  donoId: string; // "" para compartilhado ou UID do membro
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type FaturaStatus = 'aberta' | 'fechada' | 'paga' | 'vencida';

export interface FaturaCartao {
  id: string;
  cartaoId: string;
  mesReferencia: string; // Formato consistente "YYYY-MM"
  dataFechamento: string; // "YYYY-MM-DD"
  dataVencimento: string; // "YYYY-MM-DD"
  valorTotalCentavos: number;
  valorPagoCentavos: number;
  status: FaturaStatus;
  contaPagamentoId?: string;
  pagamentoLancamentoId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompraCartao {
  id: string;
  cartaoId: string;
  descricao: string;
  valorTotalCentavos: number;
  numeroParcelas: number;
  categoriaId: string;
  donoId: string; // "" para compartilhado ou UID do membro
  dataCompra: string; // "YYYY-MM-DD"
  observacao?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ParcelaStatus = 'aberta' | 'paga' | 'cancelada';

export interface ParcelaCartao {
  id: string;
  compraId: string;
  cartaoId: string;
  numeroParcela: number;
  totalParcelas: number;
  valorCentavos: number;
  faturaId: string;
  dataCompetencia: string; // "YYYY-MM-DD"
  dataCaixa: string; // "YYYY-MM-DD"
  status: ParcelaStatus;
  lancamentoId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tipos legados mantidos para compatibilidade com outros componentes
export type TransactionType = 'income' | 'expense';
export type TransactionOwner = 'user1' | 'user2' | 'joint';
export type FinanceViewMode = 'personal' | 'couple';
export type CoupleViewFilter = 'all' | 'user1' | 'user2' | 'shared';

export interface CoupleSettings {
  enabled: boolean;
  user1Name: string;
  user2Name: string;
  user1Color?: string;
  user2Color?: string;
  defaultSplitPercentage: number;
  sharedAccountIds?: string[];
  hidePersonalFromJoint?: boolean;
  allowPartnerToViewBalance?: boolean;
  autoShareReceipts?: boolean;
}

export type CategoryGroup =
  | 'fixed_cost'
  | 'variable_cost'
  | 'investment'
  | 'leisure'
  | 'income';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  group: CategoryGroup;
  icon?: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'credit_card' | 'wallet' | 'investment';
  initialBalance: number;
  color?: string;
  owner?: TransactionOwner;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  notes?: string;
  createdAt: number;
  paidBy?: TransactionOwner;
  isShared?: boolean;
  user1SharePercentage?: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  month: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  category?: string;
}
