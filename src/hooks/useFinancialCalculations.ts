import type { 
  Transaction,
  TransactionWithCategory,
  FinancialSummary,
  MonthlyFinancialData,
  Goal,
  GoalProgress,
  TaxRegime
} from "@/types/financial";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

// Taxa de imposto padrão: PIS (0.65%) + COFINS (3%) + ISS (5.05%) = 8.7%
export const TAX_RATE = 0.087;

/**
 * Calcula imposto com efeito de defasagem temporal
 */
export function calculateTaxWithLag(revenue: number, monthCount: number): number {
  const effectiveMonths = Math.max(1, monthCount);
  const taxLagFactor = (effectiveMonths - 1) / effectiveMonths;
  return revenue * TAX_RATE * taxLagFactor;
}

/**
 * Calcula margem líquida (ML) considerando tax lag
 */
export function calculateML(revenue: number, expense: number, monthCount: number): number {
  if (revenue <= 0) return 0;
  const effectiveMonths = Math.max(1, monthCount);
  const taxLagFactor = (effectiveMonths - 1) / effectiveMonths;
  const tax = revenue * TAX_RATE * taxLagFactor;
  const profit = revenue - expense - tax;
  return (profit / revenue) * 100;
}

/**
 * Calcula receita necessária para atingir margem alvo
 */
export function calculateRequiredRevenue(expense: number, targetMargin: number, monthCount: number): number {
  const margin = targetMargin / 100;
  const effectiveMonths = Math.max(1, monthCount);
  const taxLagFactor = (effectiveMonths - 1) / effectiveMonths;
  const effectiveTaxRate = TAX_RATE * taxLagFactor;
  const denominator = 1 - effectiveTaxRate - margin;
  if (denominator <= 0) return expense * 10;
  return expense / denominator;
}

/**
 * Calcula o resumo financeiro a partir de transações
 */
export function calcularResumoFinanceiro(
  transactions: Transaction[],
  initialBalance: number = 0
): FinancialSummary {
  const totals = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount) || 0;
      switch (t.type) {
        case 'revenue':
          acc.revenue += amount;
          break;
        case 'expense':
          acc.expense += amount;
          break;
        case 'tax':
          acc.tax += amount;
          break;
      }
      return acc;
    },
    { revenue: 0, expense: 0, tax: 0 }
  );

  const netMargin = totals.revenue - totals.expense - totals.tax;
  const netMarginPercentage = totals.revenue > 0 
    ? (netMargin / totals.revenue) * 100 
    : 0;
  const cashBalance = initialBalance + netMargin;

  return {
    totalRevenue: totals.revenue,
    totalExpenses: totals.expense,
    totalTaxes: totals.tax,
    netMargin,
    netMarginPercentage,
    cashBalance,
  };
}

/**
 * Agrupa transações por mês e calcula totais mensais
 */
export function calcularDadosMensais(
  transactions: Transaction[],
  startDate?: Date,
  endDate?: Date
): MonthlyFinancialData[] {
  if (!transactions.length) return [];

  // Determinar intervalo de datas
  const dates = transactions.map(t => parseISO(t.date));
  const minDate = startDate || new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = endDate || new Date(Math.max(...dates.map(d => d.getTime())));

  // Gerar todos os meses no intervalo
  const months = eachMonthOfInterval({ start: minDate, end: maxDate });

  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const totals = monthTransactions.reduce(
      (acc, t) => {
        const amount = Number(t.amount) || 0;
        switch (t.type) {
          case 'revenue':
            acc.revenue += amount;
            break;
          case 'expense':
            acc.expenses += amount;
            break;
          case 'tax':
            acc.taxes += amount;
            break;
        }
        return acc;
      },
      { revenue: 0, expenses: 0, taxes: 0 }
    );

    return {
      month: format(month, "MMM/yy", { locale: ptBR }),
      revenue: totals.revenue,
      expenses: totals.expenses,
      taxes: totals.taxes,
      netMargin: totals.revenue - totals.expenses - totals.taxes,
    };
  });
}

/**
 * Calcula o progresso de uma meta
 */
export function calcularProgressoMeta(goal: Goal, valorAtual?: number): GoalProgress {
  const achieved = valorAtual ?? (Number(goal.achieved_value) || 0);
  const target = Number(goal.target_value) || 1;
  const percentage = Math.min((achieved / target) * 100, 100);
  const remaining = Math.max(target - achieved, 0);

  return {
    goal,
    percentage,
    remaining,
  };
}

/**
 * Calcula imposto estimado baseado na receita e regime tributário
 */
export function calcularImpostos(
  receita: number,
  regime: TaxRegime,
  aliquotaCustom?: number
): number {
  // Alíquotas aproximadas por regime (valores simplificados)
  const aliquotasPadrao: Record<TaxRegime, number> = {
    simples_nacional: 6, // 6% inicial, varia por faixa
    lucro_presumido: 11.33, // aproximado
    lucro_real: 15, // IRPJ + CSLL básico
  };

  const aliquota = aliquotaCustom ?? aliquotasPadrao[regime];
  return receita * (aliquota / 100);
}

/**
 * Calcula margem líquida
 */
export function calcularMargemLiquida(
  receitas: number,
  despesas: number,
  impostos: number
): { valor: number; percentual: number } {
  const valor = receitas - despesas - impostos;
  const percentual = receitas > 0 ? (valor / receitas) * 100 : 0;

  return { valor, percentual };
}

/**
 * Calcula projeção de fluxo de caixa
 */
export function projetarFluxoCaixa(
  saldoInicial: number,
  receitasMensais: number,
  despesasMensais: number,
  impostosMensais: number,
  meses: number
): { mes: number; saldo: number }[] {
  const projecao: { mes: number; saldo: number }[] = [];
  let saldoAtual = saldoInicial;

  for (let i = 1; i <= meses; i++) {
    saldoAtual += receitasMensais - despesasMensais - impostosMensais;
    projecao.push({ mes: i, saldo: saldoAtual });
  }

  return projecao;
}

/**
 * Formata valor monetário em BRL
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata percentual
 */
export function formatarPercentual(valor: number, casasDecimais: number = 1): string {
  return `${valor.toFixed(casasDecimais)}%`;
}

/**
 * Hook wrapper para usar as funções de cálculo
 */
export const useFinancialCalculations = () => {
  return {
    TAX_RATE,
    calculateTaxWithLag,
    calculateML,
    calculateRequiredRevenue,
    calcularResumoFinanceiro,
    calcularDadosMensais,
    calcularProgressoMeta,
    calcularImpostos,
    calcularMargemLiquida,
    projetarFluxoCaixa,
    formatarMoeda,
    formatarPercentual,
  };
};
