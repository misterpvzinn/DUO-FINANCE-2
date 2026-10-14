import { RecurrenceFrequency, RecorrenciaFinanceira } from '../types/recurrence';

/**
 * Retorna uma string "YYYY-MM-DD" para um objeto Date local.
 */
export function formatDateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte "YYYY-MM-DD" para Date local seguro (meio-dia para evitar shifts de timezone).
 */
export function parseStringToDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Calcula a próxima ocorrência semanal (Regra 6).
 * diaSemana: 0 = domingo, 1 = segunda, ..., 6 = sábado.
 */
export function getNextWeeklyOccurrence(
  baseDateStr: string,
  diaSemana: number
): string {
  const date = parseStringToDate(baseDateStr);
  // Avança pelo menos 1 dia
  date.setDate(date.getDate() + 1);

  while (date.getDay() !== diaSemana) {
    date.setDate(date.getDate() + 1);
  }

  return formatDateToString(date);
}

/**
 * Calcula a próxima ocorrência quinzenal (Regra 7).
 * Soma exatamente 15 dias à ocorrência anterior.
 */
export function getNextBiweeklyOccurrence(baseDateStr: string): string {
  const date = parseStringToDate(baseDateStr);
  date.setDate(date.getDate() + 15);
  return formatDateToString(date);
}

/**
 * Calcula a próxima ocorrência mensal (Regra 8).
 * Trata meses menores (ex: dia 31 em fevereiro ou abril vira o último dia do mês).
 */
export function getNextMonthlyOccurrence(
  baseDateStr: string,
  diaExecucao: number
): string {
  const baseDate = parseStringToDate(baseDateStr);
  let nextYear = baseDate.getFullYear();
  let nextMonth = baseDate.getMonth() + 1; // Avança 1 mês (0 a 11)

  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  // Último dia válido do mês seguinte
  const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const validDay = Math.min(Math.max(1, diaExecucao), lastDayOfNextMonth);

  const nextDate = new Date(nextYear, nextMonth, validDay, 12, 0, 0);
  return formatDateToString(nextDate);
}

/**
 * Calcula a próxima ocorrência anual (Regra 9).
 * mesExecucao: 1 a 12.
 */
export function getNextAnnualOccurrence(
  baseDateStr: string,
  diaExecucao: number,
  mesExecucao: number
): string {
  const baseDate = parseStringToDate(baseDateStr);
  const nextYear = baseDate.getFullYear() + 1;
  const targetMonthIndex = Math.min(11, Math.max(0, mesExecucao - 1));

  const lastDay = new Date(nextYear, targetMonthIndex + 1, 0).getDate();
  const validDay = Math.min(Math.max(1, diaExecucao), lastDay);

  const nextDate = new Date(nextYear, targetMonthIndex, validDay, 12, 0, 0);
  return formatDateToString(nextDate);
}

/**
 * Retorna a próxima data a partir de uma data base para qualquer frequência suportada.
 */
export function getNextOccurrence(
  recorrencia: {
    frequencia: RecurrenceFrequency;
    diaExecucao?: number;
    diaSemana?: number;
    mesExecucao?: number;
  },
  baseDateStr: string
): string {
  switch (recorrencia.frequencia) {
    case 'semanal': {
      const diaSemana = recorrencia.diaSemana !== undefined ? recorrencia.diaSemana : 1;
      return getNextWeeklyOccurrence(baseDateStr, diaSemana);
    }
    case 'quinzenal': {
      return getNextBiweeklyOccurrence(baseDateStr);
    }
    case 'anual': {
      const dia = recorrencia.diaExecucao || 1;
      const mes = recorrencia.mesExecucao || 1;
      return getNextAnnualOccurrence(baseDateStr, dia, mes);
    }
    case 'mensal':
    default: {
      const dia = recorrencia.diaExecucao || 1;
      return getNextMonthlyOccurrence(baseDateStr, dia);
    }
  }
}

/**
 * Determina a primeira ocorrência da recorrência com base na data de início (Regra 10 e 12).
 * Garante que a primeira execução seja >= dataInicio.
 */
export function calculateInitialOccurrence(recorrencia: {
  frequencia: RecurrenceFrequency;
  diaExecucao?: number;
  diaSemana?: number;
  mesExecucao?: number;
  dataInicio: string;
}): string {
  const startDate = parseStringToDate(recorrencia.dataInicio);
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth(); // 0..11
  const startDay = startDate.getDate();

  switch (recorrencia.frequencia) {
    case 'semanal': {
      const targetDiaSemana = recorrencia.diaSemana !== undefined ? recorrencia.diaSemana : 1;
      const curr = new Date(startDate);
      while (curr.getDay() !== targetDiaSemana) {
        curr.setDate(curr.getDate() + 1);
      }
      return formatDateToString(curr);
    }
    case 'quinzenal': {
      return recorrencia.dataInicio;
    }
    case 'mensal': {
      const targetDia = recorrencia.diaExecucao || 1;
      const lastDayCurrentMonth = new Date(startYear, startMonth + 1, 0).getDate();
      const validDayCurrent = Math.min(targetDia, lastDayCurrentMonth);

      // Se o dia ainda não passou no mês de início, executa neste mês
      if (validDayCurrent >= startDay) {
        const d = new Date(startYear, startMonth, validDayCurrent, 12, 0, 0);
        return formatDateToString(d);
      }
      // Caso contrário, vai para o próximo mês
      return getNextMonthlyOccurrence(recorrencia.dataInicio, targetDia);
    }
    case 'anual': {
      const targetDia = recorrencia.diaExecucao || 1;
      const targetMes = (recorrencia.mesExecucao || 1) - 1; // 0..11

      const lastDayThisYear = new Date(startYear, targetMes + 1, 0).getDate();
      const validDayThisYear = Math.min(targetDia, lastDayThisYear);
      const candDate = new Date(startYear, targetMes, validDayThisYear, 12, 0, 0);

      if (formatDateToString(candDate) >= recorrencia.dataInicio) {
        return formatDateToString(candDate);
      }
      return getNextAnnualOccurrence(recorrencia.dataInicio, targetDia, recorrencia.mesExecucao || 1);
    }
  }
}
