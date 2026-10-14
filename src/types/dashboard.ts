export type DashboardPeriodType =
  | 'mes_atual'
  | 'mes_anterior'
  | 'ultimos_3_meses'
  | 'ultimos_6_meses'
  | 'ultimos_12_meses';

export interface PeriodRange {
  startDate: Date;
  endDate: Date;
  label: string;
  previousStartDate: Date;
  previousEndDate: Date;
  months: string[]; // ['2026-08', '2026-09', '2026-10']
}

export interface MetricComparison {
  currentCentavos: number;
  previousCentavos: number;
  percentageChange: number | null; // null se não houver base anterior ou for divisão por zero
}

export interface DashboardMetrics {
  income: MetricComparison;
  expense: MetricComparison;
  investment: MetricComparison;
  result: MetricComparison;
  availableBalanceCentavos: number;
  cardSpendingCentavos: number;
}

export interface MonthlyFinancialSummary {
  month: string; // "YYYY-MM"
  label: string; // "Jan", "Fev", "Mar"
  incomeCentavos: number;
  expenseCentavos: number;
  investmentCentavos: number;
  resultCentavos: number;
}

export interface CategoryExpenseSummary {
  categoryId: string;
  categoryName: string;
  categoryType: string;
  color: string;
  icon?: string;
  totalCentavos: number;
  percentage: number;
}

export interface MemberFinancialSummary {
  uid: string; // "" para Compartilhado, ou UID do membro
  name: string;
  incomeCentavos: number;
  expenseCentavos: number;
  investmentCentavos: number;
  netCentavos: number;
}

export interface CardDashboardSummary {
  cardId: string;
  name: string;
  bandeira?: string;
  ultimos4?: string;
  limiteCentavos: number;
  utilizadoCentavos: number;
  disponivelCentavos: number;
  percentualUtilizado: number;
  proximaFaturaMes?: string;
  proximaFaturaValorCentavos?: number;
  proximaFaturaVencimento?: string;
}

export interface UpcomingInvoiceSummary {
  faturaId: string;
  cartaoId: string;
  cartaoNome: string;
  mesReferencia: string;
  valorCentavos: number;
  vencimento: string;
  status: 'aberta' | 'fechada' | 'paga' | 'vencida';
  isVencida: boolean;
}
