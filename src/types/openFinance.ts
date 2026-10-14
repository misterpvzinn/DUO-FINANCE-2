export type OpenFinanceHolder = 'user1' | 'user2' | 'joint';

export interface BankInstitution {
  id: string;
  name: string;
  ispb: string;
  color: string;
  textColor: string;
  popular: boolean;
  category: 'bank' | 'fintech' | 'investment';
  initials: string;
}

export interface OpenFinanceConnection {
  id: string;
  bankId: string;
  bankName: string;
  bankColor: string;
  bankTextColor: string;
  holder: OpenFinanceHolder;
  accountType: 'checking' | 'credit_card' | 'investment';
  accountNumberMasked: string;
  agencyMasked?: string;
  balance: number;
  status: 'active' | 'syncing' | 'needs_reconnect';
  lastSyncAt: string;
  consentExpiresAt: string;
}

export const BRAZILIAN_BANKS: BankInstitution[] = [
  { id: 'nubank', name: 'Nubank', ispb: '18236120', color: '#820ad1', textColor: '#ffffff', popular: true, category: 'fintech', initials: 'NU' },
  { id: 'itau', name: 'Itaú Unibanco', ispb: '60701190', color: '#ec7000', textColor: '#ffffff', popular: true, category: 'bank', initials: 'IT' },
  { id: 'inter', name: 'Banco Inter', ispb: '00416968', color: '#ff7a00', textColor: '#ffffff', popular: true, category: 'fintech', initials: 'IN' },
  { id: 'bradesco', name: 'Bradesco', ispb: '60746948', color: '#cc092f', textColor: '#ffffff', popular: true, category: 'bank', initials: 'BR' },
  { id: 'santander', name: 'Santander Brasil', ispb: '90400888', color: '#ec0000', textColor: '#ffffff', popular: true, category: 'bank', initials: 'ST' },
  { id: 'c6', name: 'C6 Bank', ispb: '31872495', color: '#1a1a1a', textColor: '#ffffff', popular: true, category: 'fintech', initials: 'C6' },
  { id: 'btg', name: 'BTG Pactual', ispb: '30306294', color: '#001e62', textColor: '#ffffff', popular: true, category: 'investment', initials: 'BTG' },
  { id: 'bb', name: 'Banco do Brasil', ispb: '00000000', color: '#003882', textColor: '#ffef38', popular: true, category: 'bank', initials: 'BB' },
  { id: 'caixa', name: 'Caixa Econômica', ispb: '00360305', color: '#005ca9', textColor: '#ffffff', popular: true, category: 'bank', initials: 'CX' },
  { id: 'xp', name: 'XP Investimentos', ispb: '02332886', color: '#000000', textColor: '#ffffff', popular: true, category: 'investment', initials: 'XP' },
];
