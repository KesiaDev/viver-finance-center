import { format, startOfQuarter, subMonths, subQuarters, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ========== CONSTANTES ==========
export const TAX_TRANSITION_DATE = new Date(2025, 10, 1); // Novembro/2025
export const LUCRO_PRESUMIDO_START = new Date(2025, 10, 1);

// Alíquotas Lucro Presumido
export const LP_RATES = {
  PIS: 0.0065,       // 0,65%
  COFINS: 0.03,      // 3%
  ISS: 0.05,         // 5%
  IRPJ: 0.15,        // 15%
  IRPJ_ADICIONAL: 0.10, // 10% sobre excedente
  CSLL: 0.09,        // 9%
  BASE_PRESUMIDA: 0.32, // 32% para serviços
  IRPJ_LIMITE_MENSAL: 20000, // R$ 20.000/mês
};

// Configuração exportável para uso nos componentes
export const TAX_CONFIG = {
  presumption_rate: 0.32, // 32% para serviços
  
  // Impostos mensais (sobre receita bruta do mês anterior)
  monthly: {
    pis: 0.0065,      // 0,65%
    cofins: 0.03,     // 3%
    iss: 0.05,        // 5%
  },
  
  // Impostos trimestrais (sobre base presumida)
  quarterly: {
    irpj: 0.15,           // 15%
    irpj_additional: 0.10, // 10% sobre excedente
    irpj_threshold: 20000, // Limite para adicional (R$ 20.000/mês)
    csll: 0.09,           // 9%
  },
  
  // Transição de regime fiscal
  regime_change: {
    cutoff_year: 2025,
    cutoff_month: 10, // Outubro (último mês do Simples Nacional)
  },
};

export interface TaxBreakdown {
  regime: 'simples_nacional' | 'lucro_presumido';
  baseRevenue: number;
  monthly: {
    pis: number;
    cofins: number;
    iss: number;
    total: number;
  };
  quarterly: {
    isQuarterlyMonth: boolean;
    quarterRevenue: number;
    basePresumida: number;
    irpj: number;
    irpjAdicional: number;
    csll: number;
    total: number;
  };
  total: number;
}

export interface MonthData {
  month: string;
  revenue: number;
  planned_revenue: number;
  other_revenue: number;
  forecast_revenue: number;
}

// Meses de pagamento trimestral (Jan, Abr, Jul, Out)
const QUARTERLY_PAYMENT_MONTHS = [0, 3, 6, 9]; // Janeiro, Abril, Julho, Outubro

/**
 * Verifica se está no regime Lucro Presumido
 */
export function isLucroPresumido(monthDate: Date): boolean {
  return monthDate >= LUCRO_PRESUMIDO_START;
}

/**
 * Verifica se é um mês de pagamento trimestral
 */
export function isQuarterlyPaymentMonth(monthDate: Date): boolean {
  return QUARTERLY_PAYMENT_MONTHS.includes(monthDate.getMonth());
}

/**
 * Calcula a receita total de um mês
 */
export function getTotalRevenue(data: MonthData): number {
  return (Number(data.revenue) || 0) + 
         (Number(data.planned_revenue) || 0) +
         (Number(data.other_revenue) || 0) + 
         (Number(data.forecast_revenue) || 0);
}

/**
 * Calcula impostos mensais (PIS, COFINS, ISS)
 * Base: receita do mês ANTERIOR
 */
export function calculateMonthlyTaxes(previousMonthRevenue: number): {
  pis: number;
  cofins: number;
  iss: number;
  total: number;
} {
  const pis = previousMonthRevenue * LP_RATES.PIS;
  const cofins = previousMonthRevenue * LP_RATES.COFINS;
  const iss = previousMonthRevenue * LP_RATES.ISS;
  
  return {
    pis,
    cofins,
    iss,
    total: pis + cofins + iss,
  };
}

/**
 * Calcula impostos trimestrais (IRPJ, CSLL)
 * Base: receita do trimestre ANTERIOR
 */
export function calculateQuarterlyTaxes(previousQuarterRevenue: number): {
  basePresumida: number;
  irpj: number;
  irpjAdicional: number;
  csll: number;
  total: number;
} {
  const basePresumida = previousQuarterRevenue * LP_RATES.BASE_PRESUMIDA;
  const irpj = basePresumida * LP_RATES.IRPJ;
  
  // IRPJ Adicional: 10% sobre excedente de R$ 60.000/trimestre (R$ 20.000 × 3 meses)
  const limiteTrimestrall = LP_RATES.IRPJ_LIMITE_MENSAL * 3;
  const irpjAdicional = basePresumida > limiteTrimestrall 
    ? (basePresumida - limiteTrimestrall) * LP_RATES.IRPJ_ADICIONAL 
    : 0;
  
  const csll = basePresumida * LP_RATES.CSLL;
  
  return {
    basePresumida,
    irpj,
    irpjAdicional,
    csll,
    total: irpj + irpjAdicional + csll,
  };
}

/**
 * Calcula o imposto total para um mês específico
 */
export function calculateTaxForMonth(
  monthDate: Date,
  allMonthsData: MonthData[]
): TaxBreakdown {
  // Se antes de Nov/2025, retorna Simples Nacional (sem cálculo automático)
  if (!isLucroPresumido(monthDate)) {
    return {
      regime: 'simples_nacional',
      baseRevenue: 0,
      monthly: { pis: 0, cofins: 0, iss: 0, total: 0 },
      quarterly: { 
        isQuarterlyMonth: false, 
        quarterRevenue: 0, 
        basePresumida: 0, 
        irpj: 0, 
        irpjAdicional: 0, 
        csll: 0, 
        total: 0 
      },
      total: 0,
    };
  }

  // Buscar receita do mês anterior
  const previousMonth = subMonths(monthDate, 1);
  const previousMonthStr = format(previousMonth, 'yyyy-MM-dd');
  const previousMonthData = allMonthsData.find(m => m.month === previousMonthStr);
  const previousMonthRevenue = previousMonthData ? getTotalRevenue(previousMonthData) : 0;

  // Calcular impostos mensais
  const monthlyTaxes = calculateMonthlyTaxes(previousMonthRevenue);

  // Calcular impostos trimestrais se for mês de pagamento
  let quarterlyTaxes = {
    isQuarterlyMonth: false,
    quarterRevenue: 0,
    basePresumida: 0,
    irpj: 0,
    irpjAdicional: 0,
    csll: 0,
    total: 0,
  };

  if (isQuarterlyPaymentMonth(monthDate)) {
    // Buscar receita do trimestre anterior
    const previousQuarter = subQuarters(monthDate, 1);
    const quarterStart = startOfQuarter(previousQuarter);
    
    let quarterRevenue = 0;
    for (let i = 0; i < 3; i++) {
      const monthInQuarter = new Date(quarterStart);
      monthInQuarter.setMonth(quarterStart.getMonth() + i);
      
      // Só considerar meses que já estavam no Lucro Presumido
      // Ignora meses que ainda estavam no Simples Nacional
      if (!isLucroPresumido(monthInQuarter)) {
        continue;
      }
      
      const monthStr = format(monthInQuarter, 'yyyy-MM-dd');
      const monthData = allMonthsData.find(m => m.month === monthStr);
      if (monthData) {
        quarterRevenue += getTotalRevenue(monthData);
      }
    }

    const calculated = calculateQuarterlyTaxes(quarterRevenue);
    quarterlyTaxes = {
      isQuarterlyMonth: true,
      quarterRevenue,
      ...calculated,
    };
  }

  return {
    regime: 'lucro_presumido',
    baseRevenue: previousMonthRevenue,
    monthly: monthlyTaxes,
    quarterly: quarterlyTaxes,
    total: monthlyTaxes.total + quarterlyTaxes.total,
  };
}

/**
 * Formata valor em moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Gera array de meses para um período
 */
export function generateMonthsForPeriod(
  period: '2025' | '2026' | 'last12' | 'last6' | 'last3'
): string[] {
  const today = new Date();
  const months: string[] = [];

  switch (period) {
    case '2025':
      for (let i = 0; i < 12; i++) {
        months.push(format(new Date(2025, i, 1), 'yyyy-MM-dd'));
      }
      break;
    case '2026':
      for (let i = 0; i < 12; i++) {
        months.push(format(new Date(2026, i, 1), 'yyyy-MM-dd'));
      }
      break;
    case 'last12':
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(today, i);
        months.push(format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'));
      }
      break;
    case 'last6':
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(today, i);
        months.push(format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'));
      }
      break;
    case 'last3':
      for (let i = 2; i >= 0; i--) {
        const date = subMonths(today, i);
        months.push(format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'));
      }
      break;
  }

  return months;
}

/**
 * Verifica o tipo de mês (passado, atual, futuro)
 */
export function getMonthType(monthDate: Date): 'past' | 'current' | 'future' {
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

  if (monthStart < currentMonthStart) return 'past';
  if (monthStart.getTime() === currentMonthStart.getTime()) return 'current';
  return 'future';
}

/**
 * Formata nome do mês
 */
export function formatMonthName(monthStr: string): string {
  const date = new Date(monthStr + 'T00:00:00');
  return format(date, 'MMM/yy', { locale: ptBR });
}

/**
 * Retorna o nome do trimestre anterior
 */
export function getPreviousQuarterName(monthDate: Date): string {
  const prevQuarter = subQuarters(monthDate, 1);
  const quarterNum = Math.floor(prevQuarter.getMonth() / 3) + 1;
  return `Q${quarterNum}/${prevQuarter.getFullYear()}`;
}

/**
 * Converte string de moeda para número
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  // Remove tudo exceto números, vírgula e ponto
  const cleaned = value.replace(/[^\d,.-]/g, '');
  // Trata formato brasileiro (1.234,56) ou americano (1,234.56)
  const hasCommaDecimal = /,\d{2}$/.test(cleaned);
  if (hasCommaDecimal) {
    // Formato brasileiro
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  // Formato americano ou número puro
  const normalized = cleaned.replace(/,/g, '');
  return parseFloat(normalized) || 0;
}
