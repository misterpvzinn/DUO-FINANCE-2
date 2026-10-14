export type TipoCategoria =
  | 'receita'
  | 'custo_fixo'
  | 'custo_variavel'
  | 'investimento'
  | 'lazer'
  | 'divida';

export type RegimeVisualizacao = 'competencia' | 'caixa';

export interface MembroPlano {
  uid: string;
  papel: 'proprietario' | 'membro';
  nomeExibicao: string;
  email: string;
  avatarUrl?: string;
  rendaMensalCentavos: number;
}

export interface PlanoFinanceiro {
  id: string;
  nome: string;
  memberIds: string[];
  membros: {
    [uid: string]: {
      papel: 'proprietario' | 'membro';
      nomeExibicao: string;
      email?: string;
      rendaMensalCentavos: number;
    };
  };
  criadorUid: string;
  criadoEm: string;
}

export interface ConvitePlano {
  id: string;
  email: string;
  planoId: string;
  planoNome: string;
  criadorUid: string;
  criadorNome: string;
  status: 'pendente' | 'aceito' | 'recusado';
  criadoEm: string;
}

export type FiltroPessoa = 'todos' | string; // 'todos' ou o UID da pessoa

export type RouteId =
  | 'dashboard'
  | 'lancamentos'
  | 'cartoes'
  | 'plano-de-contas'
  | 'metas'
  | 'orcamentos'
  | 'recorrencias'
  | 'relatorios';

export interface NavItem {
  id: RouteId;
  label: string;
  icon: string;
}
