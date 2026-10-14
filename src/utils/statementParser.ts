import * as XLSX from 'xlsx';
import { TransactionType } from '../types/finance';
import { extractTextFromPdf } from './pdfExtractor';

export interface ParsedTransactionRow {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TransactionType;
  suggestedCategoryId: string;
  isDuplicate?: boolean;
  selected: boolean;
  rawText?: string;
}

// Auto-categorization dictionary
const CATEGORY_RULES: Array<{ keywords: string[]; categoryId: string; type: TransactionType }> = [
  // Receitas
  { keywords: ['salario', 'pagamento de salario', 'folha', 'remuneracao'], categoryId: 'cat-salario', type: 'income' },
  { keywords: ['freelance', 'consultoria', 'honorarios', 'servico'], categoryId: 'cat-freelance', type: 'income' },
  { keywords: ['rendimento', 'proventos', 'dividendos', 'jcp', 'cdb rendimento'], categoryId: 'cat-rendimentos', type: 'income' },
  { keywords: ['pix recebido', 'ted recebida', 'transferencia recebida', 'deposito'], categoryId: 'cat-outras-rec', type: 'income' },

  // Custos Fixos
  { keywords: ['aluguel', 'condominio', 'imobiliaria', 'quintoandar', 'loft'], categoryId: 'cat-moradia', type: 'expense' },
  { keywords: ['enel', 'light', 'cpfl', 'sabesp', 'sanepar', 'copasa', 'claro', 'vivo', 'tim', 'net', 'internet', 'energia', 'agua e luz'], categoryId: 'cat-contas-casa', type: 'expense' },
  { keywords: ['farmacia', 'drogasil', 'droga raia', 'pague menos', 'drogaria', 'hospital', 'clinica', 'medico', 'laboratorio', 'unimed', 'consulta'], categoryId: 'cat-saude', type: 'expense' },
  { keywords: ['faculdade', 'escola', 'colegio', 'curso', 'udemy', 'alura', 'livraria', 'universidade'], categoryId: 'cat-educacao', type: 'expense' },

  // Custos Variáveis
  { keywords: ['ifood', 'rappi', 'supermercado', 'mercado', 'pao de acucar', 'carrefour', 'extra', 'assai', 'atacadao', 'mcdonalds', 'burger', 'restaurante', 'padaria', 'acougue', 'hortifruti'], categoryId: 'cat-alimentacao', type: 'expense' },
  { keywords: ['uber', '99app', '99 tecnologia', 'combustivel', 'posto', 'gasolina', 'etanol', 'shell', 'ipiranga', 'br distribuidora', 'sem parar', 'veloe', 'estacionamento', 'pedagio'], categoryId: 'cat-transporte', type: 'expense' },

  // Lazer
  { keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'cinema', 'ingresso', 'show', 'steam', 'playstation', 'xbox', 'bar', 'cervejaria', 'churrascaria', 'hotel', 'airbnb', 'viagem'], categoryId: 'cat-lazer', type: 'expense' },

  // Investimentos
  { keywords: ['tesouro', 'b3', 'xp investimentos', 'rico', 'clear', 'nu invest', 'btg', 'investimento', 'aporte', 'poupanca'], categoryId: 'cat-investimentos', type: 'expense' },
];

export function guessCategory(description: string, type: TransactionType): string {
  const norm = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const rule of CATEGORY_RULES) {
    if (rule.type === type) {
      for (const kw of rule.keywords) {
        if (norm.includes(kw)) {
          return rule.categoryId;
        }
      }
    }
  }

  // Fallbacks
  return type === 'income' ? 'cat-salario' : 'cat-outros';
}

// Clean and normalize number
export function parseNumberString(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  let s = String(val).trim();
  // Remove currency symbols, non-breaking spaces
  s = s.replace(/[R$\s]/g, '');

  // Handle accounting negative: (100.00)
  const isParenNegative = s.startsWith('(') && s.endsWith(')');
  if (isParenNegative) {
    s = s.substring(1, s.length - 1);
  }

  // Detect D or C suffix (common in bank statements: "150,00 D" or "200,00 C")
  let isDebitSuffix = false;
  if (s.endsWith('D') || s.endsWith('d')) {
    isDebitSuffix = true;
    s = s.slice(0, -1).trim();
  } else if (s.endsWith('C') || s.endsWith('c')) {
    s = s.slice(0, -1).trim();
  }

  // If format is Brazilian (e.g. 1.250,50)
  if (s.includes(',') && s.includes('.')) {
    if (s.indexOf('.') < s.indexOf(',')) {
      // 1.250,50 -> 1250.50
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,250.50 -> 1250.50
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // 1250,50 -> 1250.50
    s = s.replace(',', '.');
  }

  let num = parseFloat(s);
  if (isNaN(num)) return 0;
  if (isParenNegative || isDebitSuffix) {
    num = -Math.abs(num);
  }

  return num;
}

// Parse date string into YYYY-MM-DD
export function parseDateString(val: any): string | null {
  if (!val) return null;

  // If Excel serial number
  if (typeof val === 'number') {
    const excelEpoch = new Date(Math.round((val - 25569) * 86400 * 1000));
    return excelEpoch.toISOString().split('T')[0];
  }

  const s = String(val).trim();

  // Pattern: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    let day = dmyMatch[1].padStart(2, '0');
    let month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // Pattern: DD/MM (assume current year)
  const dmMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (dmMatch) {
    const day = dmMatch[1].padStart(2, '0');
    const month = dmMatch[2].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }

  return null;
}

// 1. Parse Excel (.xlsx, .xls) and CSV files
export async function parseSpreadsheetFile(file: File): Promise<ParsedTransactionRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    throw new Error('A planilha está vazia ou não pôde ser lida.');
  }

  // Find header row or analyze structure
  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let amountCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let typeCol = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c]).toLowerCase().trim();
      if (!cellText) continue;

      if (dateCol === -1 && (cellText === 'data' || cellText === 'date' || cellText.includes('data transação') || cellText.includes('data lançamento'))) {
        dateCol = c;
        headerIndex = r;
      } else if (descCol === -1 && (cellText === 'descrição' || cellText === 'descricao' || cellText === 'historico' || cellText === 'histórico' || cellText === 'detalhes' || cellText === 'estabelecimento' || cellText === 'memo')) {
        descCol = c;
        headerIndex = r;
      } else if (amountCol === -1 && (cellText === 'valor' || cellText === 'amount' || cellText === 'valor (r$)' || cellText === 'quantia')) {
        amountCol = c;
        headerIndex = r;
      } else if (debitCol === -1 && (cellText.includes('debito') || cellText.includes('débito') || cellText.includes('saida') || cellText.includes('saída'))) {
        debitCol = c;
      } else if (creditCol === -1 && (cellText.includes('credito') || cellText.includes('crédito') || cellText.includes('entrada'))) {
        creditCol = c;
      } else if (typeCol === -1 && (cellText === 'tipo' || cellText === 'natureza')) {
        typeCol = c;
      }
    }
    if (dateCol !== -1 && (amountCol !== -1 || (debitCol !== -1 && creditCol !== -1))) {
      break;
    }
  }

  // If header wasn't found by exact name, deduce from sample data
  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;
  const parsedRows: ParsedTransactionRow[] = [];

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    let dateVal: string | null = null;
    let description = '';
    let amount = 0;
    let type: TransactionType = 'expense';

    if (dateCol !== -1 && descCol !== -1 && amountCol !== -1) {
      dateVal = parseDateString(row[dateCol]);
      description = String(row[descCol] || '').trim();
      const rawNum = parseNumberString(row[amountCol]);

      if (rawNum > 0) {
        amount = rawNum;
        type = 'income';
      } else {
        amount = Math.abs(rawNum);
        type = 'expense';
      }

      // If there's an explicit type column
      if (typeCol !== -1) {
        const typeText = String(row[typeCol]).toLowerCase();
        if (typeText.includes('entrada') || typeText.includes('credito') || typeText.includes('receita')) {
          type = 'income';
        } else if (typeText.includes('saida') || typeText.includes('debito') || typeText.includes('despesa')) {
          type = 'expense';
        }
      }
    } else if (debitCol !== -1 && creditCol !== -1) {
      dateVal = dateCol !== -1 ? parseDateString(row[dateCol]) : null;
      description = descCol !== -1 ? String(row[descCol] || '').trim() : '';

      const debitVal = Math.abs(parseNumberString(row[debitCol]));
      const creditVal = Math.abs(parseNumberString(row[creditCol]));

      if (creditVal > 0) {
        amount = creditVal;
        type = 'income';
      } else if (debitVal > 0) {
        amount = debitVal;
        type = 'expense';
      }
    } else {
      // Heuristic detection per column in row
      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        if (!dateVal) {
          const parsed = parseDateString(val);
          if (parsed) {
            dateVal = parsed;
            continue;
          }
        }

        const num = parseNumberString(val);
        if (num !== 0 && amount === 0 && !isNaN(num) && typeof val !== 'boolean') {
          // Check if string looks numeric
          const s = String(val).trim();
          if (/[0-9]/.test(s) && (s.includes(',') || s.includes('.') || Math.abs(num) > 0.01)) {
            if (num > 0) {
              amount = num;
              type = 'income';
            } else {
              amount = Math.abs(num);
              type = 'expense';
            }
            continue;
          }
        }

        if (typeof val === 'string' && val.trim().length > 2 && !description) {
          description = val.trim();
        }
      }
    }

    // Filter out balance lines or invalid rows
    const normDesc = description.toLowerCase();
    if (
      normDesc.includes('saldo anterior') ||
      normDesc.includes('saldo do dia') ||
      normDesc.includes('saldo final') ||
      normDesc.includes('total de debitos') ||
      normDesc.includes('total de creditos')
    ) {
      continue;
    }

    if (dateVal && description && amount > 0) {
      parsedRows.push({
        id: `imp-${r}-${Date.now()}`,
        date: dateVal,
        description,
        amount,
        type,
        suggestedCategoryId: guessCategory(description, type),
        selected: true,
        rawText: row.join(' | '),
      });
    }
  }

  return parsedRows;
}

// 2. Parse PDF Bank Statements
export async function parsePdfStatement(file: File): Promise<ParsedTransactionRow[]> {
  const lines = await extractTextFromPdf(file);
  const parsedRows: ParsedTransactionRow[] = [];
  const currentYear = new Date().getFullYear();

  // Common ignore words in Brazilian bank statements
  const IGNORE_PATTERNS = [
    'saldo anterior',
    'saldo do dia',
    'saldo final',
    'saldo consolidado',
    'total de saídas',
    'total de entradas',
    'extrato de conta',
    'extrato consolidado',
    'banco do brasil',
    'itau unibanco',
    'banco bradesco',
    'santander',
    'nubank',
    'agencia:',
    'conta corrente:',
    'periodo:',
    'folha',
    'ouvidoria',
    'sac',
    'rendimento liquido',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 8) continue;

    const lower = line.toLowerCase();
    if (IGNORE_PATTERNS.some((p) => lower.includes(p))) {
      continue;
    }

    // Regex 1: DD/MM/YYYY or DD/MM at start of line
    // e.g. "05/10/2026 PIX RECEBIDO JOAO SILVA 2.500,00" or "10/10 IFOOD *RESTAURANTE 48,90 D"
    const match = line.match(/^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([R$\s]*\-?\d{1,3}(?:\.\d{3})*,\d{2}\s*[CDcd]?)$/);

    if (match) {
      const rawDate = match[1];
      const rawDesc = match[2].trim();
      const rawAmount = match[3].trim();

      const date = parseDateString(rawDate) || `${currentYear}-01-01`;
      const num = parseNumberString(rawAmount);

      if (num !== 0 && rawDesc.length >= 2) {
        const type: TransactionType = num > 0 ? 'income' : 'expense';
        const amount = Math.abs(num);

        parsedRows.push({
          id: `pdf-${i}-${Date.now()}`,
          date,
          description: rawDesc,
          amount,
          type,
          suggestedCategoryId: guessCategory(rawDesc, type),
          selected: true,
          rawText: line,
        });
      }
      continue;
    }

    // Regex 2: Date somewhere in line, with amount at the end
    const generalMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+)\s+([\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})/);
    if (generalMatch) {
      const rawDate = generalMatch[1];
      const rawDesc = generalMatch[2].trim();
      const rawAmount = generalMatch[3].trim();

      const date = parseDateString(rawDate);
      const num = parseNumberString(rawAmount);

      if (date && num !== 0 && rawDesc.length >= 2 && !lower.includes('saldo')) {
        const type: TransactionType = num > 0 ? 'income' : 'expense';
        parsedRows.push({
          id: `pdf-${i}-${Date.now()}`,
          date,
          description: rawDesc,
          amount: Math.abs(num),
          type,
          suggestedCategoryId: guessCategory(rawDesc, type),
          selected: true,
          rawText: line,
        });
      }
    }
  }

  return parsedRows;
}

// 3. Parse OFX files (standard Open Financial Exchange)
export async function parseOfxFile(file: File): Promise<ParsedTransactionRow[]> {
  const text = await file.text();
  const parsedRows: ParsedTransactionRow[] = [];

  const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  let index = 0;
  while ((match = stmtRegex.exec(text)) !== null) {
    const block = match[1];

    const typeMatch = /<TRNTYPE>(.*?)(\r|\n|<)/i.exec(block);
    const dateMatch = /<DTPOSTED>(\d{4})(\d{2})(\d{2})/i.exec(block);
    const amountMatch = /<TRNAMT>(.*?)(\r|\n|<)/i.exec(block);
    const memoMatch = /<MEMO>(.*?)(\r|\n|<)/i.exec(block);
    const nameMatch = /<NAME>(.*?)(\r|\n|<)/i.exec(block);

    if (dateMatch && amountMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2];
      const day = dateMatch[3];
      const date = `${year}-${month}-${day}`;

      const rawAmount = parseFloat(amountMatch[1].trim().replace(',', '.'));
      const description = (nameMatch?.[1] || memoMatch?.[1] || 'Transação OFX').trim();

      const type: TransactionType = rawAmount >= 0 ? 'income' : 'expense';
      const amount = Math.abs(rawAmount);

      parsedRows.push({
        id: `ofx-${index++}-${Date.now()}`,
        date,
        description,
        amount,
        type,
        suggestedCategoryId: guessCategory(description, type),
        selected: true,
      });
    }
  }

  return parsedRows;
}

// Main dispatcher based on file extension
export async function parseStatementFile(file: File): Promise<ParsedTransactionRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'xlsx':
    case 'xls':
    case 'csv':
    case 'tsv':
      return await parseSpreadsheetFile(file);
    case 'pdf':
      return await parsePdfStatement(file);
    case 'ofx':
      return await parseOfxFile(file);
    default:
      // Try spreadsheet parser as default fallback
      try {
        return await parseSpreadsheetFile(file);
      } catch {
        throw new Error(
          `Formato de arquivo não suportado (.${extension}). Por favor envie arquivos em Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf) ou OFX (.ofx).`
        );
      }
  }
}

// Utility to generate a sample Excel / CSV template for users
export function generateSampleCsv(): string {
  return `Data;Descricao;Valor;Tipo
05/10/2026;Salario Mensal;8500,00;Receita
08/10/2026;Supermercado Extra;620,50;Despesa
10/10/2026;Posto Shell Combustivel;210,00;Despesa
12/10/2026;Aluguel Apartamento;2400,00;Despesa
15/10/2026;Projeto Freelance;1800,00;Receita
18/10/2026;Restaurante Jantar;145,00;Despesa
20/10/2026;Farmacia Droga Raia;85,30;Despesa
22/10/2026;Assinatura Netflix;55,90;Despesa`;
}
