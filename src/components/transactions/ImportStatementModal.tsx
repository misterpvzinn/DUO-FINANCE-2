import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  X,
  Wallet,
  Tag,
  User,
  Heart,
  Loader2,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthAndPlan } from '../../context/AuthAndPlanContext';
import { useTransactions } from '../../hooks/useTransactions';
import { createTransaction } from '../../services/transactions';
import {
  parseStatementFile,
  ParsedTransactionRow,
  generateSampleCsv,
} from '../../utils/statementParser';
import { formatBRL } from '../../utils/money';
import { ContaPlano, CategoriaPlano } from '../../types/finance';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportStatementModal({ isOpen, onClose, onSuccess }: ImportStatementModalProps) {
  const { plano, membro1Nome, membro2Nome, segundoMembroUid } = useAuthAndPlan();
  const { accounts, categories, transactions } = useTransactions();

  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [defaultDonoId, setDefaultDonoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<
    Array<ParsedTransactionRow & { donoId: string; categoryId: string }>
  >([]);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Helper to match category name against plan's real categories
  const matchBestCategory = (desc: string, isIncome: boolean): string => {
    const norm = desc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const candidates = categories.filter((c) =>
      isIncome ? c.tipo === 'receita' : c.tipo !== 'receita'
    );

    if (candidates.length === 0) return categories[0]?.id || '';

    // Direct name match
    for (const cat of candidates) {
      const catNorm = cat.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes(catNorm) || catNorm.includes(norm)) {
        return cat.id;
      }
    }

    // Common Brazilian banking keywords mapped to typical category words
    const KEYWORD_MAP: Array<{ words: string[]; catSearch: string }> = [
      { words: ['ifood', 'supermercado', 'mercado', 'restaurante', 'padaria', 'acougue', 'hortifruti', 'mcdonalds', 'burger'], catSearch: 'aliment' },
      { words: ['uber', '99', 'combustivel', 'posto', 'gasolina', 'estacionamento', 'pedagio'], catSearch: 'transporte' },
      { words: ['aluguel', 'condominio', 'imobiliaria', 'quintoandar'], catSearch: 'moradia' },
      { words: ['enel', 'light', 'cpfl', 'sabesp', 'copasa', 'claro', 'vivo', 'tim', 'internet', 'energia', 'luz', 'agua'], catSearch: 'contas' },
      { words: ['drogasil', 'droga raia', 'farmacia', 'hospital', 'consulta', 'medico', 'unimed'], catSearch: 'saude' },
      { words: ['netflix', 'spotify', 'cinema', 'show', 'steam', 'bar', 'hotel', 'viagem'], catSearch: 'lazer' },
      { words: ['salario', 'pagamento', 'folha', 'proventos'], catSearch: 'salario' },
      { words: ['rendimento', 'dividendos', 'jcp', 'cdb'], catSearch: 'rendimento' },
      { words: ['investimento', 'aporte', 'tesouro', 'b3'], catSearch: 'investimento' },
    ];

    for (const mapping of KEYWORD_MAP) {
      if (mapping.words.some((w) => norm.includes(w))) {
        const found = candidates.find((c) =>
          c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(mapping.catSearch)
        );
        if (found) return found.id;
      }
    }

    return candidates[0].id;
  };

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setLoading(false);
      setIsImporting(false);
      setErrorMessage('');
      setFileName('');
      setParsedRows([]);
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [isOpen, accounts]);

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMessage('');
    setFileName(file.name);

    try {
      const rows = await parseStatementFile(file);

      if (rows.length === 0) {
        throw new Error(
          'Nenhum lançamento válido foi identificado no arquivo enviado. Verifique se o extrato possui datas, descrições e valores legíveis.'
        );
      }

      // Check duplicates against real Firestore transactions in plan
      const enrichedRows = rows.map((r) => {
        const amountCents = Math.round(r.amount * 100);
        const duplicate = transactions.some((t) => {
          // Compare date
          let txDateStr = '';
          if (t.dataCaixa && typeof (t.dataCaixa as any).toDate === 'function') {
            const d = (t.dataCaixa as any).toDate();
            txDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          const sameDate = txDateStr === r.date;
          const sameAmount = Math.abs(t.valorCentavos - amountCents) === 0;
          const similarDesc =
            t.descricao.toLowerCase().includes(r.description.toLowerCase()) ||
            r.description.toLowerCase().includes(t.descricao.toLowerCase());

          return sameDate && sameAmount && similarDesc;
        });

        const catId = matchBestCategory(r.description, r.type === 'income');

        return {
          ...r,
          isDuplicate: duplicate,
          selected: !duplicate, // Leave unselected by default if potential duplicate
          donoId: defaultDonoId,
          categoryId: catId,
        };
      });

      setParsedRows(enrichedRows);
      setStep('preview');
    } catch (err: any) {
      console.error('Erro ao processar extrato:', err);
      setErrorMessage(err.message || 'Erro ao processar o arquivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_extrato_finance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadDemoStatement = () => {
    const csvContent = generateSampleCsv();
    const file = new File([csvContent], 'extrato_nubank_modelo.csv', { type: 'text/csv' });
    processFile(file);
  };

  // Selection toggle
  const toggleRowSelected = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const updateRowCategory = (id: string, categoryId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, categoryId } : r))
    );
  };

  const updateRowDono = (id: string, donoId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, donoId } : r))
    );
  };

  // Summaries
  const selectedRows = parsedRows.filter((r) => r.selected);
  const totalIncomeCents = selectedRows
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + Math.round(r.amount * 100), 0);
  const totalExpenseCents = selectedRows
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + Math.round(r.amount * 100), 0);

  const handleConfirmImport = async () => {
    if (!plano?.id || selectedRows.length === 0) return;
    if (!selectedAccountId) {
      setErrorMessage('Por favor, selecione uma conta bancária de destino.');
      return;
    }

    setIsImporting(true);
    setErrorMessage('');

    try {
      let count = 0;
      // Import items sequentially to prevent race conditions in subcollections
      for (const row of selectedRows) {
        const [year, month, day] = row.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day, 12, 0, 0);
        const timestamp = Timestamp.fromDate(dateObj);

        await createTransaction(plano.id, {
          tipo: row.type === 'income' ? 'receita' : 'despesa',
          descricao: row.description.trim(),
          valorCentavos: Math.round(row.amount * 100),
          contaId: selectedAccountId,
          categoriaId: row.categoryId || categories[0]?.id || '',
          donoId: row.donoId || '',
          dataCaixa: timestamp,
          dataCompetencia: timestamp,
          observacao: `Importado de ${fileName}`,
        });
        count++;
      }

      setImportedCount(count);
      setStep('success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Erro ao importar lote de lançamentos:', err);
      setErrorMessage(err.message || 'Erro ao salvar os lançamentos no banco de dados.');
    } finally {
      setIsImporting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Extrato Bancário"
      description="Importe extratos em Excel (.xlsx, .xls), CSV (.csv), OFX (.ofx) ou PDF."
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-5 max-h-[80vh] overflow-y-auto pr-1">
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="flex flex-col gap-5">
            {/* Target Account & Default Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Conta de Destino *</span>
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nome} ({acc.tipo})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-zinc-400">
                  Todas as movimentações serão vinculadas a esta conta.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Responsável Padrão</span>
                </label>
                <select
                  value={defaultDonoId}
                  onChange={(e) => setDefaultDonoId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Compartilhado (Casal)</option>
                  {plano?.memberIds?.[0] && (
                    <option value={plano.memberIds[0]}>{membro1Nome}</option>
                  )}
                  {segundoMembroUid && (
                    <option value={segundoMembroUid}>{membro2Nome || 'Pessoa 2'}</option>
                  )}
                </select>
                <span className="text-[11px] text-zinc-400">
                  Pode ser ajustado individualmente para cada linha no próximo passo.
                </span>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.ofx,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Clique para selecionar ou arraste seu arquivo
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 max-w-sm">
                Compatível com arquivos <strong>OFX</strong> (Internet Banking de qualquer banco),{' '}
                <strong>CSV</strong>, <strong>Excel (.xlsx)</strong> ou <strong>PDF</strong>.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                  .OFX
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                  .CSV
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                  .XLSX
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                  .PDF
                </span>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando e classificando extrato...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Helper Tools */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200 underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar modelo de planilha CSV</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemoStatement}
                className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Testar com extrato de exemplo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & CONCILIATION */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {fileName}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Conta: <strong>{selectedAccount?.nome || 'Conta Selecionada'}</strong> • {parsedRows.length} linhas detectadas
                </p>
              </div>

              {/* Totals Pill */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  +{formatBRL(totalIncomeCents)}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">
                  -{formatBRL(totalExpenseCents)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[11px] font-bold">
                  {selectedRows.length} selecionados
                </span>
              </div>
            </div>

            {/* Quick bulk actions */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 font-medium cursor-pointer"
                >
                  Selecionar todos
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 font-medium cursor-pointer"
                >
                  Desmarcar todos
                </button>
              </div>

              {parsedRows.some((r) => r.isDuplicate) && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Possíveis duplicados desmarcados por segurança
                </span>
              )}
            </div>

            {/* Table of Rows */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-[42vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === parsedRows.length && parsedRows.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded accent-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="p-2.5">Data</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5">Categoria Sugerida</th>
                    <th className="p-2.5">Responsável</th>
                    <th className="p-2.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors ${
                        !row.selected ? 'opacity-50 bg-zinc-50/30 dark:bg-zinc-900/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRowSelected(row.id)}
                          className="rounded accent-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {row.date}
                      </td>
                      <td className="p-2.5 max-w-[200px]">
                        <div className="truncate font-medium text-zinc-900 dark:text-zinc-100" title={row.description}>
                          {row.description}
                        </div>
                        {row.isDuplicate && (
                          <span className="inline-block text-[9px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                            Alerta: Duplicado suspeito
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.categoryId}
                          onChange={(e) => updateRowCategory(row.id, e.target.value)}
                          className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nome} ({cat.tipo})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={row.donoId}
                          onChange={(e) => updateRowDono(row.id, e.target.value)}
                          className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">Compartilhado</option>
                          {plano?.memberIds?.[0] && (
                            <option value={plano.memberIds[0]}>{membro1Nome}</option>
                          )}
                          {segundoMembroUid && (
                            <option value={segundoMembroUid}>{membro2Nome || 'Pessoa 2'}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            row.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {row.type === 'income' ? '+' : '-'}
                          {formatBRL(Math.round(row.amount * 100))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('upload')}
                disabled={isImporting}
              >
                Voltar
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmImport}
                disabled={selectedRows.length === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importando {selectedRows.length} lançamentos...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Importação ({selectedRows.length})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Importação Concluída com Sucesso!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                <strong>{importedCount} lançamentos</strong> foram devidamente registrados na conta{' '}
                <strong>{selectedAccount?.nome}</strong> e integrados aos relatórios e orçamentos do casal.
              </p>
            </div>

            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={onClose}>
                Ver Lançamentos
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
