/**
 * Central de manipulação de moeda e formatação BRL.
 *
 * REGRA 1 E REQUISITO DO MÓDULO DE LANÇAMENTOS:
 * Todos os valores devem ser armazenados em centavos inteiros (int > 0).
 * Exemplo: R$ 1.250,50 -> Firestore: 125050.
 * Nunca armazenar ponto flutuante nem strings formatadas no banco.
 */

export function parseBRLToCents(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }

  const str = input.trim();
  if (!str) return 0;

  // Se já for apenas dígitos puros sem separadores e grande, pode ser centavos ou valor inteiro
  // Remove "R$", espaços e caracteres inválidos
  const limpo = str.replace(/[R$\s]/g, '');

  // Caso contenha vírgula como separador decimal (padrão brasileiro: "1.250,50" ou "1250,50")
  if (limpo.includes(',')) {
    const semPontos = limpo.replace(/\./g, '');
    const normalizado = semPontos.replace(',', '.');
    const num = parseFloat(normalizado);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }

  // Caso contenha ponto como separador decimal (padrão internacional: "1250.50" ou "1250.5")
  if (limpo.includes('.')) {
    const partes = limpo.split('.');
    if (partes.length === 2 && partes[1].length <= 2) {
      const num = parseFloat(limpo);
      return isNaN(num) ? 0 : Math.round(num * 100);
    }
    // Caso com múltiplos pontos de milhar sem vírgula decimal (ex: "1.250")
    const semPontos = limpo.replace(/\./g, '');
    const num = parseFloat(semPontos);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }

  // Apenas dígitos sem separador (ex: "5000" -> R$ 5.000,00 -> 500000)
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export function formatBRL(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined || isNaN(centavos)) {
    return 'R$ 0,00';
  }
  const valorReais = centavos / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorReais);
}

// Aliases para compatibilidade com código já existente
export const formatCentavosParaReal = formatBRL;
export const parseRealParaCentavos = parseBRLToCents;

export function formatMesAno(mesAnoStr: string): string {
  if (!mesAnoStr || !mesAnoStr.includes('-')) return mesAnoStr;
  const [ano, mes] = mesAnoStr.split('-');
  const date = new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, 1);
  const nomeMes = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}`;
}

export function formatDataCurta(data: Date | null | undefined): string {
  if (!data || isNaN(data.getTime())) return '';
  const dia = String(data.getDate()).padStart(2, '0');
  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mes = meses[data.getMonth()];
  return `${dia} ${mes}`;
}

export function formatDataCompleta(data: Date | null | undefined): string {
  if (!data || isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
