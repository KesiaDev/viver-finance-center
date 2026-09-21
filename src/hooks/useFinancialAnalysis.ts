import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDynamicExpense, getFullRevenue } from "@/lib/dynamicExpenseCalculation";

interface MonthlyPlanning {
  id: string;
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
  initial_balance?: number | null;
}

interface MonthlyTarget {
  id: string;
  month: string;
  revenue_target?: number | null;
}

interface PeriodMetrics {
  totalRevenue: number;
  totalExpense: number;
  cashGeneration: number;
  netMargin: number;
  targetAchievement: number;
  finalBalance: number;
  revenueRealizada: number;
  revenuePrevisto: number;
  expenseRealizada: number;
  expensePrevisto: number;
}

interface ComparisonResult {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  variations: {
    revenue: number;
    expense: number;
    cashGeneration: number;
    netMargin: number;
  };
}

interface TrendData {
  month: string;
  label: string;
  revenue: number;
  expense: number;
  netMargin: number;
  cashBalance: number;
}

interface MovingAverages {
  revenue3M: number;
  revenue6M: number;
  revenue12M: number;
  expense3M: number;
  expense6M: number;
  expense12M: number;
  ml3M: number;
  ml6M: number;
  ml12M: number;
}

interface ScenarioProjection {
  name: string;
  factor: number;
  data: {
    month: string;
    label: string;
    revenue: number;
    expense: number;
    cashGeneration: number;
    netMargin: number;
    balance: number;
  }[];
  totals: {
    revenue: number;
    expense: number;
    cashGeneration: number;
    netMargin: number;
  };
}

export const useFinancialAnalysis = (
  planningData: MonthlyPlanning[] | undefined,
  targets: MonthlyTarget[] | undefined,
  selectedYears: number[] = [new Date().getFullYear()],
  rangePreset?: "6m" | "12m" | "quarter" | null,
  hublaFeePercentage: number = 20
) => {
  // Helper: Get total revenue for a month
  const getMonthRevenue = (data: MonthlyPlanning | undefined) => {
    if (!data) return { realizada: 0, previsto: 0, total: 0 };
    const realizada = (Number(data.revenue) || 0) + (Number(data.other_revenue) || 0);
    const previsto = (Number(data.planned_revenue) || 0) + (Number(data.forecast_revenue) || 0);
    return { realizada, previsto, total: realizada + previsto };
  };

  // Helper: Get total expense for a month (dynamic calculation)
  const getMonthExpense = (data: MonthlyPlanning | undefined) => {
    if (!data) return { realizada: 0, previsto: 0, total: 0 };
    const dynamic = getDynamicExpense(data, hublaFeePercentage, planningData);
    const realizada = (Number(data.expense) || 0) + (Number(data.other_expense) || 0);
    const previsto = (Number(data.planned_expense) || 0) + (Number(data.forecast_expense) || 0);
    return { 
      realizada, 
      previsto, 
      total: dynamic.total,
    };
  };

  // Get metrics for a specific period (months)
  const calculatePeriodMetrics = (months: string[]): PeriodMetrics => {
    let totalRevenue = 0;
    let totalExpense = 0;
    let revenueRealizada = 0;
    let revenuePrevisto = 0;
    let expenseRealizada = 0;
    let expensePrevisto = 0;
    let targetSum = 0;

    months.forEach(month => {
      const data = planningData?.find(p => p.month === month);
      const target = targets?.find(t => t.month === month);
      
      const rev = getMonthRevenue(data);
      const exp = getMonthExpense(data);

      totalRevenue += rev.total;
      totalExpense += exp.total;
      revenueRealizada += rev.realizada;
      revenuePrevisto += rev.previsto;
      expenseRealizada += exp.realizada;
      expensePrevisto += exp.previsto;
      targetSum += Number(target?.revenue_target) || 0;
    });

    const cashGeneration = totalRevenue - totalExpense;
    const netMargin = totalRevenue > 0 ? (cashGeneration / totalRevenue) * 100 : 0;
    const targetAchievement = targetSum > 0 ? (revenueRealizada / targetSum) * 100 : 0;

    const firstMonthData = planningData?.find(p => p.month === months[0]);
    const initialBalance = Number(firstMonthData?.initial_balance) || 0;
    const finalBalance = initialBalance + cashGeneration;

    return {
      totalRevenue,
      totalExpense,
      cashGeneration,
      netMargin,
      targetAchievement,
      finalBalance,
      revenueRealizada,
      revenuePrevisto,
      expenseRealizada,
      expensePrevisto,
    };
  };

  // Compare two periods
  const comparePeriods = (currentMonths: string[], previousMonths: string[]): ComparisonResult => {
    const current = calculatePeriodMetrics(currentMonths);
    const previous = calculatePeriodMetrics(previousMonths);

    const calcVariation = (curr: number, prev: number) => 
      prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : curr > 0 ? 100 : 0;

    return {
      current,
      previous,
      variations: {
        revenue: calcVariation(current.totalRevenue, previous.totalRevenue),
        expense: calcVariation(current.totalExpense, previous.totalExpense),
        cashGeneration: calcVariation(current.cashGeneration, previous.cashGeneration),
        netMargin: current.netMargin - previous.netMargin,
      },
    };
  };

  // Calculate months to include based on range preset or selected years
  const monthsToInclude = useMemo(() => {
    if (rangePreset) {
      const today = new Date();
      const months: string[] = [];
      const monthsCount = rangePreset === "6m" ? 6 : rangePreset === "12m" ? 12 : 3;
      
      for (let i = monthsCount - 1; i >= 0; i--) {
        const date = subMonths(today, i);
        months.push(format(date, 'yyyy-MM-01'));
      }
      return months;
    }
    
    const months: string[] = [];
    const sortedYears = [...selectedYears].sort((a, b) => a - b);
    sortedYears.forEach(year => {
      for (let i = 0; i < 12; i++) {
        months.push(format(new Date(year, i, 1), 'yyyy-MM-01'));
      }
    });
    return months;
  }, [selectedYears, rangePreset]);

  // Year data for charts
  const yearData = useMemo(() => {
    if (!planningData) return [];

    const data: TrendData[] = [];
    let accumulatedBalance = 0;

    monthsToInclude.forEach(monthStr => {
      const date = new Date(monthStr);
      const planning = planningData.find(p => p.month === monthStr);

      const rev = getMonthRevenue(planning);
      const exp = getMonthExpense(planning);
      const cashGen = rev.total - exp.total;
      const ml = rev.total > 0 ? (cashGen / rev.total) * 100 : 0;

      accumulatedBalance += (Number(planning?.initial_balance) || 0) + cashGen;

      const labelFormat = rangePreset || selectedYears.length > 1 ? 'MMM/yy' : 'MMM';

      data.push({
        month: monthStr,
        label: format(date, labelFormat, { locale: ptBR }),
        revenue: rev.total,
        expense: exp.total,
        netMargin: ml,
        cashBalance: accumulatedBalance,
      });
    });

    return data;
  }, [planningData, monthsToInclude, selectedYears, rangePreset, hublaFeePercentage]);

  // Calculate moving averages
  const movingAverages = useMemo((): MovingAverages => {
    if (!planningData || planningData.length === 0) {
      return {
        revenue3M: 0, revenue6M: 0, revenue12M: 0,
        expense3M: 0, expense6M: 0, expense12M: 0,
        ml3M: 0, ml6M: 0, ml12M: 0,
      };
    }

    const today = new Date();
    const periods = [3, 6, 12];
    const results: Record<string, number> = {};

    periods.forEach(months => {
      let revSum = 0, expSum = 0, mlSum = 0, count = 0;

      for (let i = 0; i < months; i++) {
        const date = subMonths(today, i);
        const monthStr = format(date, 'yyyy-MM-01');
        const data = planningData.find(p => p.month === monthStr);

        if (data) {
          const rev = getMonthRevenue(data);
          const exp = getMonthExpense(data);
          revSum += rev.total;
          expSum += exp.total;
          const ml = rev.total > 0 ? ((rev.total - exp.total) / rev.total) * 100 : 0;
          mlSum += ml;
          count++;
        }
      }

      results[`revenue${months}M`] = count > 0 ? revSum / count : 0;
      results[`expense${months}M`] = count > 0 ? expSum / count : 0;
      results[`ml${months}M`] = count > 0 ? mlSum / count : 0;
    });

    return results as unknown as MovingAverages;
  }, [planningData, hublaFeePercentage]);

  // Revenue composition
  const revenueComposition = useMemo(() => {
    if (!planningData) return [];

    let realizada = 0, prevista = 0, outras = 0, forecast = 0;

    planningData
      .filter(p => monthsToInclude.includes(p.month))
      .forEach(p => {
        realizada += Number(p.revenue) || 0;
        prevista += Number(p.planned_revenue) || 0;
        outras += Number(p.other_revenue) || 0;
        forecast += Number(p.forecast_revenue) || 0;
      });

    return [
      { name: 'Realizada', value: realizada, fill: '#22c55e' },
      { name: 'Prevista', value: prevista, fill: '#3b82f6' },
      { name: 'Outras', value: outras, fill: '#eab308' },
      { name: 'Forecast', value: forecast, fill: '#a855f7' },
    ].filter(item => item.value > 0);
  }, [planningData, monthsToInclude]);

  // Expense composition (dynamic)
  const expenseComposition = useMemo(() => {
    if (!planningData) return [];

    let operacional = 0, taxaHubla = 0, impostos = 0;

    planningData
      .filter(p => monthsToInclude.includes(p.month))
      .forEach(p => {
        const dynamic = getDynamicExpense(p, hublaFeePercentage, planningData);
        operacional += dynamic.operacional;
        taxaHubla += dynamic.platformFee;
        impostos += dynamic.tax;
      });

    return [
      { name: 'Operacionais', value: operacional, fill: '#ef4444' },
      { name: 'Taxa Hubla', value: taxaHubla, fill: '#f97316' },
      { name: 'Impostos', value: impostos, fill: '#eab308' },
    ].filter(item => item.value > 0);
  }, [planningData, monthsToInclude, hublaFeePercentage]);

  const primaryYear = useMemo(() => {
    return selectedYears.length > 0 ? Math.max(...selectedYears) : new Date().getFullYear();
  }, [selectedYears]);

  // Scenario projections
  const scenarioProjections = useMemo((): ScenarioProjection[] => {
    if (!planningData) return [];

    const scenarios = [
      { name: 'Conservador', factor: 0.8 },
      { name: 'Base', factor: 1.0 },
      { name: 'Otimista', factor: 1.2 },
    ];

    return scenarios.map(scenario => {
      const data: ScenarioProjection['data'] = [];
      let balance = 0;
      let totalRev = 0, totalExp = 0, totalCash = 0;

      const today = new Date();
      const currentMonth = today.getMonth();

      for (let i = 0; i < 12; i++) {
        const date = new Date(primaryYear, i, 1);
        const monthStr = format(date, 'yyyy-MM-01');
        const planning = planningData.find(p => p.month === monthStr);
        const target = targets?.find(t => t.month === monthStr);

        const baseRevenue = getMonthRevenue(planning).total;
        const baseExpense = getMonthExpense(planning).total;

        const isFuture = primaryYear > today.getFullYear() || (primaryYear === today.getFullYear() && i > currentMonth);
        const projectedRevenue = isFuture 
          ? (Number(target?.revenue_target) || baseRevenue) * scenario.factor
          : baseRevenue;
        const projectedExpense = isFuture 
          ? baseExpense * (0.9 + (scenario.factor - 1) * 0.3)
          : baseExpense;

        const cashGen = projectedRevenue - projectedExpense;
        const ml = projectedRevenue > 0 ? (cashGen / projectedRevenue) * 100 : 0;
        balance += (Number(planning?.initial_balance) || 0) + cashGen;

        totalRev += projectedRevenue;
        totalExp += projectedExpense;
        totalCash += cashGen;

        data.push({
          month: monthStr,
          label: format(date, 'MMM', { locale: ptBR }),
          revenue: projectedRevenue,
          expense: projectedExpense,
          cashGeneration: cashGen,
          netMargin: ml,
          balance,
        });
      }

      return {
        name: scenario.name,
        factor: scenario.factor,
        data,
        totals: {
          revenue: totalRev,
          expense: totalExp,
          cashGeneration: totalCash,
          netMargin: totalRev > 0 ? (totalCash / totalRev) * 100 : 0,
        },
      };
    });
  }, [planningData, targets, primaryYear, hublaFeePercentage]);

  // Calculate break-even
  const calculateBreakeven = (targetML: number) => {
    if (!planningData) return { requiredRevenue: 0, currentRevenue: 0, gap: 0 };

    const filteredPlannings = planningData.filter(p => monthsToInclude.includes(p.month));
    
    let totalExpense = 0;
    let totalRevenue = 0;

    filteredPlannings.forEach(p => {
      const exp = getMonthExpense(p);
      const rev = getMonthRevenue(p);
      totalExpense += exp.total;
      totalRevenue += rev.total;
    });

    const requiredRevenue = totalExpense / (1 - targetML / 100);
    const gap = requiredRevenue - totalRevenue;

    return {
      requiredRevenue,
      currentRevenue: totalRevenue,
      gap: Math.max(0, gap),
    };
  };

  // Year KPIs
  const yearKPIs = useMemo(() => {
    return calculatePeriodMetrics(monthsToInclude);
  }, [planningData, targets, monthsToInclude, hublaFeePercentage]);

  return {
    yearData,
    yearKPIs,
    movingAverages,
    revenueComposition,
    expenseComposition,
    scenarioProjections,
    calculatePeriodMetrics,
    comparePeriods,
    calculateBreakeven,
  };
};
