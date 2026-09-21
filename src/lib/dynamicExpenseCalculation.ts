import { getMonthType, calculateTaxForMonth, getTotalRevenue, type MonthData } from './taxCalculations';

interface MonthlyPlanningData {
  month: string;
  revenue?: number | null;
  planned_revenue?: number | null;
  other_revenue?: number | null;
  forecast_revenue?: number | null;
  expense?: number | null;
  planned_expense?: number | null;
  other_expense?: number | null;
  forecast_expense?: number | null;
  tax?: number | null;
  platform_fee?: number | null;
  distribution?: number | null;
}

/**
 * Calcula despesas dinâmicas (Taxa Hubla + Impostos) conforme tipo do mês.
 * Espelha a lógica do PlanningTable.
 */
export function getDynamicExpense(
  data: MonthlyPlanningData | undefined,
  hublaFeePercentage: number,
  allPlanningData: MonthlyPlanningData[] | undefined,
): { operacional: number; platformFee: number; tax: number; total: number } {
  if (!data) return { operacional: 0, platformFee: 0, tax: 0, total: 0 };

  const operacional =
    (Number(data.expense) || 0) +
    (Number(data.planned_expense) || 0) +
    (Number(data.other_expense) || 0) +
    (Number(data.forecast_expense) || 0);

  const monthDate = new Date(data.month + 'T00:00:00');
  const monthType = getMonthType(monthDate);

  let platformFee: number;
  let tax: number;

  if (monthType === 'past') {
    platformFee = Number(data.platform_fee) || 0;
    tax = Number(data.tax) || 0;
  } else if (monthType === 'current') {
    // Mês atual: Taxa Hubla sobre forecast_revenue apenas
    platformFee = (Number(data.forecast_revenue) || 0) * hublaFeePercentage / 100;
    tax = Number(data.tax) || 0;
  } else {
    // Futuro: Taxa Hubla sobre receita total, impostos dinâmicos
    const totalRevenue =
      (Number(data.revenue) || 0) +
      (Number(data.planned_revenue) || 0) +
      (Number(data.other_revenue) || 0) +
      (Number(data.forecast_revenue) || 0);
    platformFee = totalRevenue * hublaFeePercentage / 100;

    // Calcular impostos dinamicamente
    const monthsAsMonthData: MonthData[] = (allPlanningData || []).map(p => ({
      month: p.month,
      revenue: Number(p.revenue) || 0,
      planned_revenue: Number(p.planned_revenue) || 0,
      other_revenue: Number(p.other_revenue) || 0,
      forecast_revenue: Number(p.forecast_revenue) || 0,
    }));
    const taxBreakdown = calculateTaxForMonth(monthDate, monthsAsMonthData);
    tax = taxBreakdown.total;
  }

  return {
    operacional,
    platformFee,
    tax,
    total: operacional + platformFee + tax,
  };
}

/**
 * Calcula receita total de um mês (4 fluxos)
 */
export function getFullRevenue(data: MonthlyPlanningData | undefined): number {
  if (!data) return 0;
  return (Number(data.revenue) || 0) +
    (Number(data.planned_revenue) || 0) +
    (Number(data.other_revenue) || 0) +
    (Number(data.forecast_revenue) || 0);
}
