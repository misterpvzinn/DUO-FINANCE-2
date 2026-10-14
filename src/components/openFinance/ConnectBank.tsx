import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  User,
  Heart,
  CreditCard,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Check,
  Wallet,
} from 'lucide-react';
import { useOpenFinance } from '../../context/OpenFinanceContext';
import { useFinance } from '../../context/FinanceContext';
import {
  BRAZILIAN_BANKS,
  BankInstitution,
  OpenFinanceHolder,
  OpenFinanceConnection,
} from '../../types/openFinance';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface ConnectBankProps {
  onSuccess?: (connection: OpenFinanceConnection) => void;
  onCancel?: () => void;
  className?: string;
}

type Step = 'select' | 'configure' | 'connecting' | 'confirmed';

export function ConnectBank({ onSuccess, onCancel, className = '' }: ConnectBankProps) {
  const { connectBank } = useOpenFinance();
  const { coupleSettings } = useFinance();

  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedBank, setSelectedBank] = useState<BankInstitution | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'bank' | 'fintech' | 'investment'>('all');

  // Linkage setup parameters
  const [holder, setHolder] = useState<OpenFinanceHolder>('user1');
  const [accountType, setAccountType] = useState<'checking' | 'credit_card' | 'investment'>('checking');
  const [scopeTransactions, setScopeTransactions] = useState(true);
  const [scopeBalance, setScopeBalance] = useState(true);
  const [scopeCards, setScopeCards] = useState(true);

  // Connection simulation stages
  const [simulationStage, setSimulationStage] = useState(0);
  const [linkedConnection, setLinkedConnection] = useState<OpenFinanceConnection | null>(null);

  const user1Name = coupleSettings.user1Name || 'Paulo';
  const user2Name = coupleSettings.user2Name || 'Ana';

  const SIMULATION_STAGES = [
    'Estabelecendo túnel criptografado TLS 1.3 com a API bancária...',
    `Verificando certificados de segurança mTLS Bacen Open Finance...`,
    `Autorizando escopo de leitura de extratos para ${selectedBank?.name || 'o banco'}...`,
    'Sincronizando extratos e saldo em tempo real...',
  ];

  // Filter banks
  const filteredBanks = BRAZILIAN_BANKS.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.initials.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSelectBank = (bank: BankInstitution) => {
    setSelectedBank(bank);
    setCurrentStep('configure');
  };

  const handleStartConnection = async () => {
    if (!selectedBank) return;
    setCurrentStep('connecting');
    setSimulationStage(0);

    // Progress simulation steps
    const stage1Timer = setTimeout(() => setSimulationStage(1), 500);
    const stage2Timer = setTimeout(() => setSimulationStage(2), 1100);
    const stage3Timer = setTimeout(() => setSimulationStage(3), 1700);

    try {
      const conn = await connectBank({
        bankId: selectedBank.id,
        holder,
        accountType,
      });

      setTimeout(() => {
        setLinkedConnection(conn);
        setCurrentStep('confirmed');
        if (onSuccess) {
          onSuccess(conn);
        }
      }, 2300);
    } catch {
      setCurrentStep('configure');
    }

    return () => {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
    };
  };

  const handleReset = () => {
    setSelectedBank(null);
    setCurrentStep('select');
    setLinkedConnection(null);
    setSimulationStage(0);
  };

  return (
    <div className={`w-full flex flex-col gap-5 ${className}`}>
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-200/70 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Conexão Segura Open Finance
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Banco Central do Brasil • Criptografia de ponta a ponta
            </p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            currentStep === 'select' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'
          }`}>
            1. Banco
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            currentStep === 'configure' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'
          }`}>
            2. Configurar
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            currentStep === 'connecting' || currentStep === 'confirmed' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'
          }`}>
            3. Vinculação
          </span>
        </div>
      </div>

      {/* STEP 1: Select Bank */}
      {currentStep === 'select' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Security guarantee notice */}
          <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Acesso estritamente somente leitura.
              </span>{' '}
              Seus dados são protegidos por criptografia de nível bancário e autenticação regulamentada pelo Bacen. Nunca solicitamos sua senha de 4/6 dígitos nem chave Pix transacional.
            </div>
          </div>

          {/* Search bar & Category filters */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do banco, fintech ou corretora..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'bank', label: 'Bancos' },
                { id: 'fintech', label: 'Fintechs' },
                { id: 'investment', label: 'Investimentos' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                    categoryFilter === c.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bank list grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredBanks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => handleSelectBank(bank)}
                className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900/70 hover:shadow-2xs transition-all flex items-center gap-3 text-left cursor-pointer group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: bank.color, color: bank.textColor }}
                >
                  {bank.initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {bank.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {bank.category === 'fintech' ? 'Fintech Digital' : bank.category === 'investment' ? 'Corretora' : 'Banco Múltiplo'}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {onCancel && (
            <div className="pt-2 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Configure Linkage */}
      {currentStep === 'configure' && selectedBank && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Selected Bank Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs"
                style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor }}
              >
                {selectedBank.initials}
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedBank.name}
                </h4>
                <p className="text-xs text-zinc-500">API Registrada Bacen • ISPB {selectedBank.ispb}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep('select')}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              Trocar instituição
            </button>
          </div>

          {/* Holder selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Titular da Conta / Perfil do Casal
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHolder('user1')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  holder === 'user1'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs'
                }`}
              >
                <User className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
                <span className="text-xs">{user1Name}</span>
              </button>

              <button
                type="button"
                onClick={() => setHolder('user2')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  holder === 'user2'
                    ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 font-semibold shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs'
                }`}
              >
                <User className="w-3.5 h-3.5 mx-auto mb-1 text-pink-500" />
                <span className="text-xs">{user2Name}</span>
              </button>

              <button
                type="button"
                onClick={() => setHolder('joint')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  holder === 'joint'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-semibold shadow-2xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs'
                }`}
              >
                <Heart className="w-3.5 h-3.5 mx-auto mb-1 text-purple-500" />
                <span className="text-xs">Conjunta (Casal)</span>
              </button>
            </div>
          </div>

          {/* Account Type selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Produto / Tipo de Conta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'checking', label: 'Conta Corrente', icon: Landmark },
                { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
                { id: 'investment', label: 'Investimentos', icon: TrendingUp },
              ].map((t) => {
                const IconComponent = t.icon;
                const isSelected = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountType(t.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope checkboxes */}
          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Escopos Solicitados (Somente Leitura)
            </span>
            <div className="space-y-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={scopeTransactions}
                  onChange={(e) => setScopeTransactions(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Extrato de lançamentos e compras</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={scopeBalance}
                  onChange={(e) => setScopeBalance(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Saldo disponível e posição financeira</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={scopeCards}
                  onChange={(e) => setScopeCards(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Faturas e parcelas de cartões de crédito</span>
              </label>
            </div>
          </div>

          {/* Navigation actions */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep('select')}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStartConnection}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <span>Conectar e Autorizar no Bacen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Connecting & Secure Simulation */}
      {currentStep === 'connecting' && selectedBank && (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-5 animate-in fade-in duration-200">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md animate-pulse"
              style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor }}
            >
              {selectedBank.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
          </div>

          <div className="max-w-md space-y-1">
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Conectando com {selectedBank.name}
            </h4>
            <p className="text-xs text-zinc-500 font-mono min-h-6">
              {SIMULATION_STAGES[simulationStage] || SIMULATION_STAGES[0]}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${((simulationStage + 1) / SIMULATION_STAGES.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Open Finance Brasil • Resolução Conjunta nº 1/2020 Bacen</span>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmed Linkage */}
      {currentStep === 'confirmed' && linkedConnection && (
        <div className="flex flex-col gap-5 animate-in zoom-in-95 duration-200">
          {/* Success Header Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Conta Vinculada com Sucesso!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Sincronização em tempo real ativada via Open Finance Brasil.
              </p>
            </div>
          </div>

          {/* Linkage Details Card */}
          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs"
                  style={{ backgroundColor: linkedConnection.bankColor, color: linkedConnection.bankTextColor }}
                >
                  {linkedConnection.bankName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {linkedConnection.bankName}
                  </h5>
                  <p className="text-xs text-zinc-400 font-mono">
                    Agência {linkedConnection.agencyMasked || '0001'} • Conta {linkedConnection.accountNumberMasked}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Conectado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Titular Vinculado</span>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {linkedConnection.holder === 'user1'
                    ? user1Name
                    : linkedConnection.holder === 'user2'
                    ? user2Name
                    : 'Casal (Conjunta)'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Saldo Atualizado</span>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 font-mono">
                  {formatCurrency(linkedConnection.balance)}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 pt-1 flex items-center justify-between">
              <span>Consentimento válido até {new Date(linkedConnection.consentExpiresAt).toLocaleDateString('pt-BR')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Auto-Sync Ativo</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              Vincular Outro Banco
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onCancel || handleReset}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Concluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
