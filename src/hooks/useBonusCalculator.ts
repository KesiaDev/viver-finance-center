import { useMemo } from "react";
import { useMonthlyPlanning } from "./useMonthlyPlanning";
import { useSalesTargets } from "./useSalesTargets";
import { useFinancialPeriods } from "./useFinancialPeriods";
import { useFinancialConfig } from "./useFinancialConfig";
import { parse, format, startOfMonth, isBefore, subMonths } from "date-fns";
import { calculateTaxForMonth, MonthData } from "@/lib/taxCalculations";

// Estrutura fixa de bônus dos diretores
export interface DirectorBonus {
  id: string;
  name: string;
  quarterly: number;
}

// Base Anual é sempre calculada como Trimestral × 4
export const DIRECTOR_BONUSES: readonly DirectorBonus[] = [
  { id: "vendas", name: "Vendas", quarterly: 137500 },
  { id: "marketing", name: "Marketing", quarterly: 146000 },
  { id: "educacao", name: "Educação", quarterly: 50000 },
  { id: "financeiro", name: "Financeiro", quarterly: 15000 },
  { id: "operacao", name: "Operação", quarterly: 16500 },
] as const;

export const ML_TARGET = 30; // Meta de ML base: 30%

export interface QuarterData {
  quarter: 1 | 2 | 3 | 4;
  months: string[];
  // Realizado (apenas dados pagos/efetivados)
  revenue: number;
  expense: number;
  tax: number;
  ml: number;
  // Cenário (igual à tela de Metas - inclui projeções completas)
  totalRevenueCenario: number;
  totalExpenseCenario: number;
  cashGeneration: number;
  mlCenario: number;
  // Meta de Vendas em R$
  salesTarget: number;
  salesAchieved: number;
  // Status
  isComplete: boolean;
  isCurrent: boolean;
}

export interface QuarterBonusData {
  ml: number;
  bonus: number;
  mlForecast: number;
  bonusForecast: number;
  isComplete: boolean;
  cashGeneration: number; // Geração de caixa do trimestre para cálculo de % do caixa
}

export interface DirectorBonusData {
  directorId: string;
  directorName: string;
  quarterlyBase: number;
  annualBase: number;
  quarters: {
    q1: QuarterBonusData;
    q2: QuarterBonusData;
    q3: QuarterBonusData;
    q4: QuarterBonusData;
  };
  totalPaid: number;
  totalPaidForecast: number;
  retroactive: number;
  retroactiveForecast: number;
}

export interface BonusSummary {
  totalQuarterlyBase: number;
  totalAnnualBase: number;
  totalPaid: number;
  totalPaidForecast: number;
  totalRetroactive: number;
  totalRetroactiveForecast: number;
  annualML: number;
  annualMLForecast: number;
  isRetroactiveEligible: boolean;
  isRetroactiveEligibleForecast: boolean;
}

// Helpers para identificar meses do trimestre
function getQuarterMonths(year: number, quarter: 1 | 2 | 3 | 4): string[] {
  const startMonth = (quarter - 1) * 3;
  return [0, 1, 2].map((offset) => {
    const month = startMonth + offset + 1;
    return `${year}-${String(month).padStart(2, "0")}-01`;
  });
}

function getCurrentQuarter(): 1 | 2 | 3 | 4 {
  const month = new Date().getMonth();
  return (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
}

const getMonthType = (monthStr: string): 'past' | 'current' | 'future' => {
  const monthDate = startOfMonth(parse(monthStr, 'yyyy-MM-dd', new Date()));
  const currentMonthStart = startOfMonth(new Date());
  
  if (isBefore(monthDate, currentMonthStart)) return 'past';
  if (monthDate.getTime() === currentMonthStart.getTime()) return 'current';
  return 'future';
};

export const useBonusCalculator = (selectedYear: number) => {
  const { planningData, isLoading: isLoadingPlanning } = useMonthlyPlanning();
  const { periods } = useFinancialPeriods();
  const { hublaFeePercentage } = useFinancialConfig();
  
  // Buscar configurações de metas do ano selecionado
  const selectedPeriodId = useMemo(() => {
    if (!periods) return "";
    const yearPeriod = periods.find(p => p.name.includes(String(selectedYear)));
    return yearPeriod?.id || "";
  }, [periods, selectedYear]);
  
  const { salesTargets, isLoading: isLoadingSalesTargets } = useSalesTargets({ 
    periodId: selectedPeriodId 
  });
  
  const isLoading = isLoadingPlanning || isLoadingSalesTargets;
  
  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();

  // Extrair configurações de metas
  const targetConfig = useMemo(() => {
    if (!salesTargets || salesTargets.length === 0) {
      return {
        annualTarget: 0,
        cashPercentage: 30,
        recurringInstallments: 12,
        customMonthlyTargets: {} as Record<string, number>,
      };
    }
    
    const target = salesTargets[0];
    const monthlyData = (target as any).monthly_data || [];
    const monthlyTargetsMap: Record<string, number> = {};
    
    monthlyData.forEach((m: { month: string; monthly_target: number }) => {
      if (m.monthly_target && m.monthly_target > 0) {
        monthlyTargetsMap[m.month] = Number(m.monthly_target);
      }
    });
    
    return {
      annualTarget: Number((target as any).annual_target) || 0,
      cashPercentage: Number(target.cash_sale_percentage) || 30,
      recurringInstallments: 12,
      customMonthlyTargets: monthlyTargetsMap,
    };
  }, [salesTargets]);

  // Filtrar planning data do ano selecionado
  const yearPlanning = useMemo(() => {
    if (!planningData) return [];
    return planningData
      .filter(p => p.month.startsWith(`${selectedYear}-`))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [planningData, selectedYear]);

  // Preparar dados para cálculo de impostos
  const monthsDataForTax: MonthData[] = useMemo(() => {
    if (!yearPlanning.length) return [];

    const allMonthsSet = new Set(yearPlanning.map(p => p.month));
    
    if (yearPlanning.length > 0) {
      const firstMonth = parse(yearPlanning[0].month, 'yyyy-MM-dd', new Date());
      for (let i = 1; i <= 3; i++) {
        const prevMonth = format(subMonths(firstMonth, i), 'yyyy-MM-dd');
        allMonthsSet.add(prevMonth);
      }
    }

    return Array.from(allMonthsSet).map(monthStr => {
      const data = yearPlanning.find(p => p.month === monthStr);
      return {
        month: monthStr,
        revenue: Number(data?.revenue) || 0,
        planned_revenue: Number(data?.planned_revenue) || 0,
        other_revenue: Number(data?.other_revenue) || 0,
        forecast_revenue: Number(data?.forecast_revenue) || 0,
      };
    });
  }, [yearPlanning]);

  // Calcular dados por trimestre usando a lógica do ScenarioSimulatorTable
  const quarterlyData = useMemo<QuarterData[]>(() => {
    if (!planningData) return [];

    const { annualTarget, cashPercentage, recurringInstallments, customMonthlyTargets } = targetConfig;
    const defaultMonthlyTarget = annualTarget > 0 ? annualTarget / 12 : 0;
    const recurringPercentage = 100 - cashPercentage;

    const quarters: QuarterData[] = [];

    for (let q = 1; q <= 4; q++) {
      const quarter = q as 1 | 2 | 3 | 4;
      const months = getQuarterMonths(selectedYear, quarter);

      // Dados de planejamento do trimestre
      const quarterPlannings = yearPlanning.filter(p => 
        months.some(m => p.month.startsWith(m.slice(0, 7)))
      );

      // === ML REALIZADO (apenas meses passados ou atual) ===
      // Filtrar apenas meses que já passaram ou o mês atual
      const realizedMonths = quarterPlannings.filter(p => {
        const monthType = getMonthType(p.month);
        return monthType === 'past' || monthType === 'current';
      });

      // Se não há meses realizados neste trimestre, ML = 0
      let ml = 0;
      let realizedRevenue = 0;
      let realizedExpense = 0;
      let realizedTax = 0;

      if (realizedMonths.length > 0) {
        realizedRevenue = realizedMonths.reduce(
          (sum, p) => sum + (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0),
          0
        );

        realizedExpense = realizedMonths.reduce(
          (sum, p) => sum + (Number(p.expense) || 0) + (Number(p.other_expense) || 0),
          0
        );

      // Para ML Realizado, não subtrair impostos - apenas Receita vs Despesa
      // Os impostos já estão refletidos nos pagamentos realizados
      ml = realizedRevenue > 0 
        ? ((realizedRevenue - realizedExpense) / realizedRevenue) * 100 
        : 0;
      }

      // === ML CENÁRIO (igual à tela de Metas) ===
      let totalRevenueCenario = 0;
      let totalExpenseCenario = 0;
      
      // === META DE VENDAS EM R$ ===
      let quarterSalesTarget = 0;
      let quarterSalesAchieved = 0;

      // Calcular para cada mês do trimestre
      quarterPlannings.forEach((p, monthIndex) => {
        const monthType = getMonthType(p.month);
        
        // Encontrar índice global do mês no ano
        const globalIndex = yearPlanning.findIndex(yp => yp.month === p.month);
        
        // Meta do mês
        const target = customMonthlyTargets[p.month] ?? defaultMonthlyTarget;
        
        // À Vista
        const cashAmount = target * (cashPercentage / 100);
        
        // Recorrente acumulado
        let recurringAccumulated = 0;
        for (let i = 0; i <= globalIndex; i++) {
          const prevMonthKey = yearPlanning[i]?.month;
          if (!prevMonthKey) continue;
          const prevTarget = customMonthlyTargets[prevMonthKey] ?? defaultMonthlyTarget;
          const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
          const prevInstallment = prevRecurringAmount / recurringInstallments;
          const installmentNumber = globalIndex - i + 1;
          if (installmentNumber <= recurringInstallments) {
            recurringAccumulated += prevInstallment;
          }
        }
        
        // Acumular Meta de Vendas do trimestre (À Vista + Recorrente)
        quarterSalesTarget += cashAmount + recurringAccumulated;
        
        // Atingido = revenue_new_sales (manual) ou revenue (se não houver manual)
        const monthSalesAchieved = Number(p.revenue_new_sales) || Number(p.revenue) || 0;
        quarterSalesAchieved += monthSalesAchieved;

        // Receitas do planejamento
        const revenue = Number(p.revenue) || 0;
        const plannedRevenue = Number(p.planned_revenue) || 0;
        const otherRevenue = Number(p.other_revenue) || 0;
        const forecastRevenue = Number(p.forecast_revenue) || 0;
        const planningRevenue = revenue + plannedRevenue + otherRevenue;
        
        // Total Entrada = À Vista + Recorrente + Plan
        const totalEntry = cashAmount + recurringAccumulated + planningRevenue;
        
        // Receita total do cenário
        const monthRevenue = revenue + plannedRevenue + otherRevenue + forecastRevenue;
        totalRevenueCenario += monthRevenue;

        // Despesas
        const expense = Number(p.expense) || 0;
        const plannedExpense = Number(p.planned_expense) || 0;
        const otherExpense = Number(p.other_expense) || 0;
        const forecastExpense = Number(p.forecast_expense) || 0;
        const distribution = Number(p.distribution) || 0;
        
        // Taxa Hubla
        let platformFee: number;
        if (monthType === 'past') {
          platformFee = Number(p.platform_fee) || 0;
        } else if (monthType === 'current') {
          platformFee = (plannedRevenue + forecastRevenue) * (hublaFeePercentage / 100);
        } else {
          platformFee = totalEntry * (hublaFeePercentage / 100);
        }

        // Impostos
        const monthDate = parse(p.month, 'yyyy-MM-dd', new Date());
        const taxBreakdown = calculateTaxForMonth(monthDate, monthsDataForTax);
        const tax = monthType === 'future' ? taxBreakdown.total : (Number(p.tax) || 0);

        // Total de despesas para ML (SEM distribuição)
        const monthExpenses = expense + plannedExpense + otherExpense + forecastExpense + platformFee + tax;
        totalExpenseCenario += monthExpenses;
      });

      // Geração de Caixa
      const cashGeneration = totalRevenueCenario - totalExpenseCenario;

      // ML Cenário
      const mlCenario = totalRevenueCenario > 0 
        ? (cashGeneration / totalRevenueCenario) * 100 
        : 0;

      // Status do trimestre
      const isComplete =
        selectedYear < currentYear ||
        (selectedYear === currentYear && quarter < currentQuarter);

      const isCurrent =
        selectedYear === currentYear && quarter === currentQuarter;

      quarters.push({
        quarter,
        months,
        revenue: realizedRevenue,
        expense: realizedExpense,
        tax: realizedTax,
        ml: Math.round(ml * 100) / 100,
        totalRevenueCenario,
        totalExpenseCenario,
        cashGeneration,
        mlCenario: Math.round(mlCenario * 100) / 100,
        salesTarget: quarterSalesTarget,
        salesAchieved: quarterSalesAchieved,
        isComplete,
        isCurrent,
      });
    }

    return quarters;
  }, [planningData, yearPlanning, selectedYear, currentYear, currentQuarter, targetConfig, hublaFeePercentage, monthsDataForTax]);

  // Calcular ML anual (realizado e previsto)
  const annualTotals = useMemo(() => {
    // Para ML Realizado: filtrar apenas meses passados/atual de todo o ano
    const realizedMonths = yearPlanning.filter(p => {
      const monthType = getMonthType(p.month);
      return monthType === 'past' || monthType === 'current';
    });

    // Calcular totais realizados apenas com meses que já passaram
    const realizedTotals = realizedMonths.reduce(
      (acc, p) => ({
        revenue: acc.revenue + (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0),
        expense: acc.expense + (Number(p.expense) || 0) + (Number(p.other_expense) || 0),
        tax: acc.tax + (Number(p.tax) || 0),
      }),
      { revenue: 0, expense: 0, tax: 0 }
    );

    // Para ML Realizado anual, não subtrair impostos - apenas Receita vs Despesa
    const annualML = realizedTotals.revenue > 0
      ? ((realizedTotals.revenue - realizedTotals.expense) / realizedTotals.revenue) * 100
      : 0;

    // Para ML Previsto: usar totais dos cenários (todos os trimestres)
    const forecastTotals = quarterlyData.reduce(
      (acc, q) => ({
        totalRevenueCenario: acc.totalRevenueCenario + q.totalRevenueCenario,
        totalExpenseCenario: acc.totalExpenseCenario + q.totalExpenseCenario,
      }),
      { totalRevenueCenario: 0, totalExpenseCenario: 0 }
    );

    const cashGeneration = forecastTotals.totalRevenueCenario - forecastTotals.totalExpenseCenario;
    const annualMLCenario = forecastTotals.totalRevenueCenario > 0
      ? (cashGeneration / forecastTotals.totalRevenueCenario) * 100
      : 0;

    return {
      revenue: realizedTotals.revenue,
      expense: realizedTotals.expense,
      tax: realizedTotals.tax,
      totalRevenueCenario: forecastTotals.totalRevenueCenario,
      totalExpenseCenario: forecastTotals.totalExpenseCenario,
      annualML: Math.round(annualML * 100) / 100,
      annualMLForecast: Math.round(annualMLCenario * 100) / 100,
    };
  }, [quarterlyData, yearPlanning]);

  // Calcular bônus por diretor
  const directorsData = useMemo<DirectorBonusData[]>(() => {
    return DIRECTOR_BONUSES.map((director) => {
      const q1Data = quarterlyData.find((q) => q.quarter === 1);
      const q2Data = quarterlyData.find((q) => q.quarter === 2);
      const q3Data = quarterlyData.find((q) => q.quarter === 3);
      const q4Data = quarterlyData.find((q) => q.quarter === 4);

      const quarters = {
        q1: calculateQuarterBonus(q1Data, director.quarterly),
        q2: calculateQuarterBonus(q2Data, director.quarterly),
        q3: calculateQuarterBonus(q3Data, director.quarterly),
        q4: calculateQuarterBonus(q4Data, director.quarterly),
      };

      const totalPaid =
        quarters.q1.bonus +
        quarters.q2.bonus +
        quarters.q3.bonus +
        quarters.q4.bonus;

      const totalPaidForecast =
        quarters.q1.bonusForecast +
        quarters.q2.bonusForecast +
        quarters.q3.bonusForecast +
        quarters.q4.bonusForecast;

      // Base anual calculada dinamicamente
      const annualBase = director.quarterly * 4;

      // Retroativo realizado: se ML anual >= 30%, paga a diferença
      const retroactive =
        annualTotals.annualML >= ML_TARGET ? annualBase - totalPaid : 0;

      // Retroativo cenário: se ML anual cenário >= 30%, paga a diferença
      const retroactiveForecast =
        annualTotals.annualMLForecast >= ML_TARGET ? annualBase - totalPaidForecast : 0;

      return {
        directorId: director.id,
        directorName: director.name,
        quarterlyBase: director.quarterly,
        annualBase,
        quarters,
        totalPaid,
        totalPaidForecast,
        retroactive: Math.max(0, retroactive),
        retroactiveForecast: Math.max(0, retroactiveForecast),
      };
    });
  }, [quarterlyData, annualTotals]);

  // Resumo geral
  const summary = useMemo<BonusSummary>(() => {
    const totalQuarterlyBase = DIRECTOR_BONUSES.reduce(
      (sum, d) => sum + d.quarterly,
      0
    );
    // Base anual calculada dinamicamente: quarterly * 4
    const totalAnnualBase = DIRECTOR_BONUSES.reduce(
      (sum, d) => sum + d.quarterly * 4,
      0
    );
    const totalPaid = directorsData.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalPaidForecast = directorsData.reduce((sum, d) => sum + d.totalPaidForecast, 0);
    const totalRetroactive = directorsData.reduce(
      (sum, d) => sum + d.retroactive,
      0
    );
    const totalRetroactiveForecast = directorsData.reduce(
      (sum, d) => sum + d.retroactiveForecast,
      0
    );

    return {
      totalQuarterlyBase,
      totalAnnualBase,
      totalPaid,
      totalPaidForecast,
      totalRetroactive,
      totalRetroactiveForecast,
      annualML: annualTotals.annualML,
      annualMLForecast: annualTotals.annualMLForecast,
      isRetroactiveEligible: annualTotals.annualML >= ML_TARGET,
      isRetroactiveEligibleForecast: annualTotals.annualMLForecast >= ML_TARGET,
    };
  }, [directorsData, annualTotals]);

  return {
    quarterlyData,
    directorsData,
    summary,
    isLoading,
  };
};

/**
 * Calcula a porcentagem de bônus baseada nas faixas:
 * < 80% da meta → 0%
 * 80-89% da meta → 25%
 * 90-99% da meta → 50%
 * >= 100% da meta → 100% (teto máximo)
 */
export function getBonusPercentage(mlPercentage: number): number {
  const percentOfTarget = (mlPercentage / ML_TARGET) * 100; // % da meta de 30%
  
  if (percentOfTarget < 80) return 0;       // < 80% → sem bônus
  if (percentOfTarget < 90) return 0.25;    // 80-89% → 25%
  if (percentOfTarget < 100) return 0.50;   // 90-99% → 50%
  return 1.0;                                // >= 100% → 100% (teto)
}

function calculateQuarterBonus(
  quarter: QuarterData | undefined,
  baseBonus: number
): QuarterBonusData {
  if (!quarter) {
    return { ml: 0, bonus: 0, mlForecast: 0, bonusForecast: 0, isComplete: false, cashGeneration: 0 };
  }

  // Bônus por faixas (realizado)
  const bonusPercentage = getBonusPercentage(quarter.ml);
  const bonus = baseBonus * bonusPercentage;

  // Bônus por faixas (cenário/previsto)
  const bonusPercentageForecast = getBonusPercentage(quarter.mlCenario);
  const bonusForecast = baseBonus * bonusPercentageForecast;

  return {
    ml: quarter.ml,
    bonus: Math.round(bonus * 100) / 100,
    mlForecast: quarter.mlCenario,
    bonusForecast: Math.round(bonusForecast * 100) / 100,
    isComplete: quarter.isComplete,
    cashGeneration: quarter.cashGeneration,
  };
}
