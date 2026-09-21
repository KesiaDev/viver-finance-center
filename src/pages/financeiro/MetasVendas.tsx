import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Target, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  DollarSign, 
  RefreshCw, 
  Calendar,
  Percent,
  PiggyBank,
  Calculator,
  BarChart3,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialPeriods } from "@/hooks/useFinancialPeriods";
import { useMonthlyPlanning } from "@/hooks/useMonthlyPlanning";
import { useSalesTargets } from "@/hooks/useSalesTargets";
import { useTaxRules } from "@/hooks/useTaxRules";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { useAuth } from "@/contexts/AuthContext";
import { format, parse, startOfMonth, isBefore, subMonths, parseISO } from "date-fns";
import { getMonthType as getMonthTypeFromDate } from "@/lib/taxCalculations";
import { ptBR } from "date-fns/locale";
import { MonthlyTrackingTable } from "@/components/finance/sales-targets/MonthlyTrackingTable";
import { AnnualEvolutionChart } from "@/components/finance/sales-targets/AnnualEvolutionChart";
import { ScenarioSimulatorTable } from "@/components/finance/sales-targets/ScenarioSimulatorTable";
import { useFinancialConfig } from "@/hooks/useFinancialConfig";
import { cn } from "@/lib/utils";

const TAX_RATE = 0.087; // PIS 0.65% + COFINS 3% + ISS 5%

const MONTHS = [
  { value: "all", label: "Todos os Meses" },
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const YEARS = ["2025", "2026", "2027", "2028"];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 0 
  }).format(value);
};

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
};

const MetasVendas = () => {
  const { periods, activePeriod, isLoading: isLoadingPeriods, createPeriod, isCreating: isCreatingPeriod } = useFinancialPeriods();
  const { canEditFinance } = useAuth();
  
  // Month and year selection from global preferences
  const { 
    financialYear: selectedYear, 
    setFinancialYear: setSelectedYear,
    financialMonth: selectedMonth,
    setFinancialMonth: setSelectedMonth
  } = useAppPreferences();
  
  // Derive the period ID from the year (for saving sales targets)
  const selectedPeriodId = useMemo(() => {
    if (!periods) return "";
    const yearPeriod = periods.find(p => p.name.includes(selectedYear));
    return yearPeriod?.id || "";
  }, [periods, selectedYear]);
  
  const { 
    salesTargets, 
    createSalesTarget, 
    updateSalesTarget, 
    createSalesTargetAsync,
    updateSalesTargetAsync,
    upsertMonthlyData, 
    isCreating, 
    isUpdating 
  } = useSalesTargets({ 
    periodId: selectedPeriodId 
  });
  const { planningData, isLoading: isLoadingPlanning, upsertPlanningBatch, upsertPlanning, isSyncingBatch } = useMonthlyPlanning();
  
  // Get dynamic Hubla fee from financial config
  const { hublaFeePercentage: HUBLA_FEE_PERCENTAGE } = useFinancialConfig();

  // State for custom monthly targets
  const [customMonthlyTargets, setCustomMonthlyTargets] = useState<Record<string, number>>({});
  const { 
    calculateMonthlyTaxesWithRegime, 
    calculateQuarterlyTaxes, 
    isQuarterlyPaymentMonth,
    isLucroPresumido 
  } = useTaxRules();

  // Form state
  const [annualTarget, setAnnualTarget] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [cashPercentage, setCashPercentage] = useState(30);
  const recurringInstallments = 12; // Fixo em 12 parcelas
  const [targetMLPercentage, setTargetMLPercentage] = useState(15);
  const [monthForecast, setMonthForecast] = useState(0);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);

  const handleSendAnnualReport = async () => {
    setIsSendingDiscord(true);
    try {
      const { error } = await supabase.functions.invoke('discord-daily-report', {
        body: { 
          type: 'annual',
          year: selectedYear 
        }
      });
      
      if (error) throw error;
      
      toast.success(`Relatório anual de ${selectedYear} enviado para Discord!`);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast.error('Erro ao enviar relatório para o Discord');
    } finally {
      setIsSendingDiscord(false);
    }
  };

  // Check if viewing all months
  const isYearView = selectedMonth === "all";
  
  // Selected month key in format YYYY-MM-DD
  const selectedMonthKey = isYearView ? null : `${selectedYear}-${selectedMonth}-01`;

  // Load existing target data when period changes
  useEffect(() => {
    // Reset to defaults first when period changes
    if (!salesTargets || salesTargets.length === 0) {
      setAnnualTarget(0);
      setMonthlyTarget(0);
      setCashPercentage(30);
      setTargetMLPercentage(15);
      setMonthForecast(0);
      setCustomMonthlyTargets({});
      return;
    }
    
    const target = salesTargets[0];
    setAnnualTarget(Number((target as any).annual_target) || 0);
    setMonthlyTarget(Number(target.monthly_target) || 0);
    setCashPercentage(Number(target.cash_sale_percentage) || 30);
    setTargetMLPercentage(Number(target.target_ml_percentage) || 15);
    setMonthForecast(Number((target as any).month_forecast) || 0);
    
    // Load custom monthly targets from monthly_data
    const monthlyData = (target as any).monthly_data || [];
    const monthlyTargetsMap: Record<string, number> = {};
    monthlyData.forEach((m: { month: string; monthly_target: number }) => {
      if (m.monthly_target && m.monthly_target > 0) {
        monthlyTargetsMap[m.month] = Number(m.monthly_target);
      }
    });
    setCustomMonthlyTargets(monthlyTargetsMap);
  }, [salesTargets, selectedPeriodId]);

  // Derived monthly target from annual when in year view
  const derivedMonthlyTarget = annualTarget > 0 ? annualTarget / 12 : 0;
  const effectiveMonthlyTarget = isYearView ? derivedMonthlyTarget : monthlyTarget;

  // Get current month planning data
  const currentMonthPlanning = useMemo(() => {
    if (isYearView) return null;
    return planningData?.find(p => p.month === selectedMonthKey);
  }, [planningData, selectedMonthKey, isYearView]);

  // Filter planning data for selected year
  const yearPlanning = useMemo(() => {
    if (!planningData) return [];
    return planningData.filter(p => p.month.startsWith(selectedYear));
  }, [planningData, selectedYear]);

  // Get previous year planning data (needed for tax calculations in January)
  const previousYearPlanning = useMemo(() => {
    if (!planningData) return [];
    const previousYear = (parseInt(selectedYear) - 1).toString();
    return planningData.filter(p => p.month.startsWith(previousYear));
  }, [planningData, selectedYear]);

  // Calculate previous year final balance (for January's initial balance)
  const previousYearFinalBalance = useMemo(() => {
    if (!planningData) return 0;
    
    const previousYear = (parseInt(selectedYear) - 1).toString();
    const previousYearData = planningData
      .filter(p => p.month.startsWith(previousYear))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    
    if (!previousYearData.length) return 0;
    
    // Calculate final balance of previous year
    let balance = Number(previousYearData[0].initial_balance) || 0;
    previousYearData.forEach(p => {
      const revenue = (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0) + (Number(p.forecast_revenue) || 0);
      const expense = (Number(p.expense) || 0) + (Number(p.other_expense) || 0) + (Number(p.forecast_expense) || 0);
      const tax = Number(p.tax) || 0;
      balance += revenue - expense - tax;
    });
    
    return balance;
  }, [planningData, selectedYear]);

  // Calculate accumulated balances for all months (same logic as PlanningTable)
  const accumulatedBalances = useMemo(() => {
    if (!yearPlanning.length) return {};
    
    const sortedData = [...yearPlanning].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
    
    const balances: Record<string, { initialBalance: number; finalBalance: number }> = {};
    let previousFinalBalance = 0;
    
    sortedData.forEach((data, index) => {
      // First month uses initial_balance from database, others use previous final balance
      const initialBalance = index === 0 
        ? (Number(data.initial_balance) || 0)
        : previousFinalBalance;
      
      const revenue = (Number(data.revenue) || 0) + (Number(data.other_revenue) || 0) + (Number(data.forecast_revenue) || 0);
      const expense = (Number(data.expense) || 0) + (Number(data.other_expense) || 0) + (Number(data.forecast_expense) || 0);
      const tax = Number(data.tax) || 0;
      const distribution = Number(data.distribution) || 0;
      
      const finalBalance = initialBalance + revenue - expense - tax - distribution;
      
      balances[data.month] = { initialBalance, finalBalance };
      previousFinalBalance = finalBalance;
    });
    
    return balances;
  }, [yearPlanning]);

  // Filter planning data from selected month to December (for projections)
  const periodPlanning = useMemo(() => {
    if (!yearPlanning.length || isYearView) return yearPlanning;
    
    const selectedMonthNum = parseInt(selectedMonth);
    return yearPlanning.filter(p => {
      const monthNum = parseInt(p.month.split('-')[1]);
      return monthNum >= selectedMonthNum && monthNum <= 12;
    });
  }, [yearPlanning, selectedMonth, isYearView]);

  // Calculate planning totals for the year with dynamic tax calculation
  const planningTotals = useMemo(() => {
    if (yearPlanning.length === 0) return null;

    const getMonthType = (monthStr: string): 'past' | 'current' | 'future' => {
      const monthDate = startOfMonth(parse(monthStr, 'yyyy-MM-dd', new Date()));
      const currentMonthStart = startOfMonth(new Date());
      if (isBefore(monthDate, currentMonthStart)) return 'past';
      if (monthDate.getTime() === currentMonthStart.getTime()) return 'current';
      return 'future';
    };

    const getTotalRevenueForMonth = (monthStr: string): number => {
      const monthPlan = yearPlanning.find(p => p.month === monthStr);
      if (!monthPlan) return 0;
      return (Number(monthPlan.revenue) || 0) + 
             (Number(monthPlan.planned_revenue) || 0) + 
             (Number(monthPlan.other_revenue) || 0) + 
             (Number(monthPlan.forecast_revenue) || 0);
    };

    const getCalculatedTaxForMonth = (monthStr: string): number => {
      const monthDate = parse(monthStr, 'yyyy-MM-dd', new Date());
      const monthNumber = monthDate.getMonth() + 1;
      const year = monthDate.getFullYear();

      const previousMonthDate = subMonths(monthDate, 1);
      const previousMonth = format(startOfMonth(previousMonthDate), 'yyyy-MM-dd');
      const previousMonthRevenue = getTotalRevenueForMonth(previousMonth);
      
      const monthlyTaxes = calculateMonthlyTaxesWithRegime(previousMonthRevenue, year, monthNumber);
      let totalTax = monthlyTaxes.total;

      if (isQuarterlyPaymentMonth(monthNumber)) {
        const quarterMonthDates = [
          format(startOfMonth(subMonths(monthDate, 3)), 'yyyy-MM-dd'),
          format(startOfMonth(subMonths(monthDate, 2)), 'yyyy-MM-dd'),
          format(startOfMonth(subMonths(monthDate, 1)), 'yyyy-MM-dd'),
        ];
        
        const quarterlyRevenue = quarterMonthDates.reduce((sum, qMonth) => {
          const qMonthDate = parse(qMonth, 'yyyy-MM-dd', new Date());
          if (isLucroPresumido(qMonthDate.getFullYear(), qMonthDate.getMonth() + 1)) {
            return sum + getTotalRevenueForMonth(qMonth);
          }
          return sum;
        }, 0);
        
        if (quarterlyRevenue > 0 && isLucroPresumido(year, monthNumber)) {
          const quarterlyTaxes = calculateQuarterlyTaxes(quarterlyRevenue);
          totalTax += quarterlyTaxes.total;
        }
      }

      return totalTax;
    };

    // Receitas = Realizada + Prevista + Outras + Forecast
    const totalRevenue = yearPlanning.reduce((sum, p) => {
      return sum + (Number(p.revenue) || 0) + 
                   (Number(p.planned_revenue) || 0) + 
                   (Number(p.other_revenue) || 0) + 
                   (Number(p.forecast_revenue) || 0);
    }, 0);

    // Despesas Base = Realizadas + Previstas + Outras + Forecast
    const totalExpenseBase = yearPlanning.reduce((sum, p) => {
      return sum + (Number(p.expense) || 0) + 
                   (Number(p.planned_expense) || 0) + 
                   (Number(p.other_expense) || 0) + 
                   (Number(p.forecast_expense) || 0);
    }, 0);

    // Taxa Hubla: dinâmica para futuros, do banco para passados/atuais
    const totalPlatformFee = yearPlanning.reduce((sum, p) => {
      const monthType = getMonthType(p.month);
      
      if (monthType === 'future') {
        const monthRevenue = (Number(p.revenue) || 0) + 
                             (Number(p.planned_revenue) || 0) + 
                             (Number(p.other_revenue) || 0) + 
                             (Number(p.forecast_revenue) || 0);
        return sum + (monthRevenue * (HUBLA_FEE_PERCENTAGE / 100));
      }
      return sum + (Number(p.platform_fee) || 0);
    }, 0);

    const totalTax = yearPlanning.reduce((sum, p) => {
      const monthDate = parse(p.month, 'yyyy-MM-dd', new Date());
      const monthType = getMonthTypeFromDate(monthDate);
      
      // Apenas meses futuros calculam dinamicamente (igual ao Planejamento)
      if (monthType === 'future') {
        return sum + getCalculatedTaxForMonth(p.month);
      }
      return sum + (Number(p.tax) || 0);
    }, 0);

    const totalDistribution = yearPlanning.reduce((sum, p) => {
      return sum + (Number(p.distribution) || 0);
    }, 0);

    // Despesas para ML = Base + Taxa Hubla + Impostos (SEM Distribuição)
    const totalExpenseForML = totalExpenseBase + totalPlatformFee + totalTax;

    // Geração de Caixa para ML = Receitas - Despesas Operacionais
    const cashGenerationForML = totalRevenue - totalExpenseForML;
    
    // ML% = NÃO considera distribuição
    const mlPercentage = totalRevenue > 0 ? (cashGenerationForML / totalRevenue) * 100 : 0;
    
    // Use first month's initial balance from accumulated balances
    const sortedMonths = [...yearPlanning].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
    const firstMonthKey = sortedMonths[0]?.month;
    const initialBalance = accumulatedBalances[firstMonthKey]?.initialBalance || 0;
    
    // Geração de Caixa Real = inclui distribuição (para saldo)
    const cashGeneration = cashGenerationForML - totalDistribution;
    const finalBalance = initialBalance + cashGeneration;

    // Calcular ML% de cada mês individualmente para ML Médio
    const monthlyMLPercentages = yearPlanning.map(p => {
      const monthType = getMonthType(p.month);
      
      const monthRevenue = (Number(p.revenue) || 0) + 
                           (Number(p.planned_revenue) || 0) + 
                           (Number(p.other_revenue) || 0) + 
                           (Number(p.forecast_revenue) || 0);
      
      const monthExpenseBase = (Number(p.expense) || 0) + 
                               (Number(p.planned_expense) || 0) + 
                               (Number(p.other_expense) || 0) + 
                               (Number(p.forecast_expense) || 0);
      
      let monthPlatformFee: number;
      let monthTax: number;
      
      if (monthType === 'future') {
        monthPlatformFee = monthRevenue * (HUBLA_FEE_PERCENTAGE / 100);
        monthTax = getCalculatedTaxForMonth(p.month);
      } else {
        monthPlatformFee = Number(p.platform_fee) || 0;
        monthTax = Number(p.tax) || 0;
      }
      
      // ML% mensal = NÃO considera distribuição
      const monthTotalExpenseForML = monthExpenseBase + monthPlatformFee + monthTax;
      const monthCashGenerationForML = monthRevenue - monthTotalExpenseForML;
      
      return monthRevenue > 0 ? (monthCashGenerationForML / monthRevenue) * 100 : 0;
    });

    // ML Médio = média simples das ML% mensais
    const mlMedio = monthlyMLPercentages.length > 0 
      ? monthlyMLPercentages.reduce((sum, ml) => sum + ml, 0) / monthlyMLPercentages.length 
      : 0;

    return {
      totalRevenue,
      totalExpense: totalExpenseForML + totalDistribution, // Total para exibição
      cashGeneration,
      initialBalance,
      finalBalance,
      mlMedio,
      mlPercentage,
      monthCount: yearPlanning.length
    };
  }, [yearPlanning, accumulatedBalances, calculateMonthlyTaxesWithRegime, calculateQuarterlyTaxes, isQuarterlyPaymentMonth, isLucroPresumido, HUBLA_FEE_PERCENTAGE]);

  // Current month data
  const currentMonthData = useMemo(() => {
    if (!currentMonthPlanning) return null;
    
    const revenue = (Number(currentMonthPlanning.revenue) || 0) + 
                   (Number(currentMonthPlanning.other_revenue) || 0) + 
                   (Number(currentMonthPlanning.forecast_revenue) || 0);
    const expense = (Number(currentMonthPlanning.expense) || 0) + 
                   (Number(currentMonthPlanning.other_expense) || 0) + 
                   (Number(currentMonthPlanning.forecast_expense) || 0);
    const tax = Number(currentMonthPlanning.tax) || 0;
    const cashGeneration = revenue - expense - tax;
    const revenueNewSales = Number(currentMonthPlanning.revenue_new_sales) || 0;
    const revenueRecurringPrevious = Number(currentMonthPlanning.revenue_recurring_previous) || 0;
    
    // Use accumulated balance from the same calculation as PlanningTable
    const monthKey = currentMonthPlanning.month;
    const initialBalance = accumulatedBalances[monthKey]?.initialBalance || 0;
    
    return {
      revenue,
      expense,
      tax,
      cashGeneration,
      initialBalance,
      revenueNewSales,
      revenueRecurringPrevious,
    };
  }, [currentMonthPlanning, accumulatedBalances]);

  // Calculated values
  const recurringPercentage = 100 - cashPercentage;
  const cashSales = effectiveMonthlyTarget * (cashPercentage / 100);
  const recurringSales = effectiveMonthlyTarget * (recurringPercentage / 100);
  const recurringInstallment = recurringSales / recurringInstallments;
  const monthlyEntry = cashSales + recurringInstallment;
  const hublaFeeAmount = monthlyEntry * (HUBLA_FEE_PERCENTAGE / 100);
  const monthlyEntryNet = monthlyEntry - hublaFeeAmount;

  // Annual calculated values
  const annualCashSales = annualTarget * (cashPercentage / 100);
  const annualRecurringSales = annualTarget * (recurringPercentage / 100);
  const annualEntry = annualCashSales + (annualRecurringSales / 12) * 12; // First year entry

  // Monthly cash entry projection with recurring accumulation
  const monthlyEntryProjection = useMemo(() => {
    if (!annualTarget || annualTarget === 0) return [];
    
    const defaultTarget = annualTarget / 12;
    
    return Array.from({ length: 12 }, (_, index) => {
      const monthIndex = index + 1;
      const monthKey = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`;
      const monthName = format(new Date(parseInt(selectedYear), index, 1), 'MMM', { locale: ptBR });
      
      // Usar meta personalizada do Acompanhamento Mensal se existir
      const monthlyTargetValue = customMonthlyTargets[monthKey] ?? defaultTarget;
      
      // Calcular À Vista e Recorrente baseado na meta do mês
      const cashAmount = monthlyTargetValue * (cashPercentage / 100);
      const recurringAmount = monthlyTargetValue * (recurringPercentage / 100);
      const recurringInstallmentAmount = recurringAmount / recurringInstallments;
      
      // Buscar receitas do planejamento para este mês (Receitas + Previstas + Outras Rec.)
      // NÃO incluir forecast_revenue pois já está representado em À Vista + Recorrente
      const monthPlan = planningData?.find(p => p.month === monthKey);
      const planningRevenue = (Number(monthPlan?.revenue) || 0) + 
                              (Number(monthPlan?.planned_revenue) || 0) +
                              (Number(monthPlan?.other_revenue) || 0);
      
      // Recorrente acumulado: soma UMA parcela por mês de cada venda (1ª parcela entra no mês da compra)
      let recurringAccumulated = 0;
      for (let i = 0; i <= index; i++) {
        const prevMonthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}-01`;
        const prevTarget = customMonthlyTargets[prevMonthKey] ?? defaultTarget;
        const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
        const prevInstallment = prevRecurringAmount / recurringInstallments;
        
        // Qual número da parcela entra no caixa este mês?
        // Se i == index: é a 1ª parcela (mês da compra)
        // Se i < index: é a parcela número (index - i + 1)
        const installmentNumber = index - i + 1;
        
        // Só adicionar se ainda estiver dentro do período de parcelamento
        if (installmentNumber <= recurringInstallments) {
          recurringAccumulated += prevInstallment;
        }
      }
      
        // Entrada do mês = À vista + Recorrente acumulado + Receitas do Planejamento
        const entry = cashAmount + recurringAccumulated + planningRevenue;
        const hublaFee = entry * (HUBLA_FEE_PERCENTAGE / 100);
        const entryNet = entry - hublaFee;
        
        return {
          month: monthName,
          monthIndex,
          monthKey,
          monthlyTarget: monthlyTargetValue,
          cashAmount,
          recurringInstallmentAmount,
          recurringAccumulated,
          planningRevenue,
          entry,
          hublaFee,
          entryNet,
        };
      });
  }, [annualTarget, cashPercentage, recurringPercentage, recurringInstallments, selectedYear, planningData, customMonthlyTargets]);

  // Calculate months remaining from selected month to December
  const monthsRemaining = isYearView ? 12 : (12 - parseInt(selectedMonth) + 1);

  // Helper: determinar tipo do mês (passado, atual, futuro)
  const getMonthType = (monthStr: string): 'past' | 'current' | 'future' => {
    const monthDate = startOfMonth(parse(monthStr, 'yyyy-MM-dd', new Date()));
    const currentMonthStart = startOfMonth(new Date());
    
    if (isBefore(monthDate, currentMonthStart)) return 'past';
    if (monthDate.getTime() === currentMonthStart.getTime()) return 'current';
    return 'future';
  };

  // Calculate totals for the selected period (from selected month to December)
  const periodTotals = useMemo(() => {
    if (periodPlanning.length === 0) return null;

    const getTotalRevenueForMonth = (monthStr: string): number => {
      const monthPlan = yearPlanning.find(p => p.month === monthStr);
      if (!monthPlan) return 0;
      return (Number(monthPlan.revenue) || 0) + (Number(monthPlan.other_revenue) || 0) + (Number(monthPlan.forecast_revenue) || 0);
    };

    const getCalculatedTaxForMonth = (monthStr: string): number => {
      const monthDate = parse(monthStr, 'yyyy-MM-dd', new Date());
      const monthNumber = monthDate.getMonth() + 1;
      const year = monthDate.getFullYear();

      const previousMonthDate = subMonths(monthDate, 1);
      const previousMonth = format(startOfMonth(previousMonthDate), 'yyyy-MM-dd');
      const previousMonthRevenue = getTotalRevenueForMonth(previousMonth);
      
      const monthlyTaxes = calculateMonthlyTaxesWithRegime(previousMonthRevenue, year, monthNumber);
      let totalTax = monthlyTaxes.total;

      if (isQuarterlyPaymentMonth(monthNumber)) {
        const quarterMonthDates = [
          format(startOfMonth(subMonths(monthDate, 3)), 'yyyy-MM-dd'),
          format(startOfMonth(subMonths(monthDate, 2)), 'yyyy-MM-dd'),
          format(startOfMonth(subMonths(monthDate, 1)), 'yyyy-MM-dd'),
        ];
        
        const quarterlyRevenue = quarterMonthDates.reduce((sum, qMonth) => {
          const qMonthDate = parse(qMonth, 'yyyy-MM-dd', new Date());
          if (isLucroPresumido(qMonthDate.getFullYear(), qMonthDate.getMonth() + 1)) {
            return sum + getTotalRevenueForMonth(qMonth);
          }
          return sum;
        }, 0);
        
        if (quarterlyRevenue > 0 && isLucroPresumido(year, monthNumber)) {
          const quarterlyTaxes = calculateQuarterlyTaxes(quarterlyRevenue);
          totalTax += quarterlyTaxes.total;
        }
      }

      return totalTax;
    };

    // Receita base do planejamento (apenas revenue + other_revenue, SEM forecast)
    const baseRevenue = periodPlanning.reduce((sum, p) => {
      return sum + (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0);
    }, 0);

    // Receita total (inclui forecast_revenue para outras métricas)
    const totalRevenue = baseRevenue + periodPlanning.reduce((sum, p) => {
      return sum + (Number(p.forecast_revenue) || 0);
    }, 0);

    const totalExpense = periodPlanning.reduce((sum, p) => {
      return sum + (Number(p.expense) || 0) + (Number(p.other_expense) || 0) + (Number(p.forecast_expense) || 0);
    }, 0);

    // Para impostos: usar valor do banco para meses passados/atuais, calcular para futuros
    const totalTax = periodPlanning.reduce((sum, p) => {
      const monthType = getMonthType(p.month);
      
      if (monthType === 'future') {
        // Mês futuro: calcular imposto baseado na receita
        return sum + getCalculatedTaxForMonth(p.month);
      } else {
        // Mês passado/atual: usar valor real do banco
        return sum + (Number(p.tax) || 0);
      }
    }, 0);

    const totalDistribution = periodPlanning.reduce((sum, p) => {
      return sum + (Number(p.distribution) || 0);
    }, 0);

    const cashGeneration = totalRevenue - totalExpense - totalTax - totalDistribution;
    
    // Use accumulated balance from the same calculation as PlanningTable
    const sortedPeriodMonths = [...periodPlanning].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
    const firstMonthKey = sortedPeriodMonths[0]?.month;
    const initialBalance = accumulatedBalances[firstMonthKey]?.initialBalance || 0;
    const finalBalance = initialBalance + cashGeneration;
    const mlPercentage = totalRevenue > 0 ? (cashGeneration / totalRevenue) * 100 : 0;

    return {
      baseRevenue,
      totalRevenue,
      totalExpense,
      totalTax,
      totalDistribution,
      cashGeneration,
      initialBalance,
      finalBalance,
      mlPercentage,
      monthCount: periodPlanning.length
    };
  }, [periodPlanning, yearPlanning, accumulatedBalances, calculateMonthlyTaxesWithRegime, calculateQuarterlyTaxes, isQuarterlyPaymentMonth, isLucroPresumido]);

  // Calcular receita necessária para atingir o ML Alvo - BASEADO NO PERÍODO SELECIONADO
  const requiredRevenueForML = useMemo(() => {
    if (!periodTotals) return null;
    
    const { totalExpense, totalDistribution, baseRevenue, totalTax, monthCount } = periodTotals;
    
    const targetML = targetMLPercentage / 100;
    
    // Lucro Presumido: impostos são valor FIXO (pagos no mês seguinte sobre receita anterior)
    // Fórmula correta:
    // Lucro = Receita - Despesa - Imposto (fixo) - Distribuição
    // ML% = Lucro / Receita
    // targetML = (Receita - totalExpense - totalTax - totalDistribution) / Receita
    // Receita * targetML = Receita - totalExpense - totalTax - totalDistribution
    // Receita - Receita * targetML = totalExpense + totalTax + totalDistribution
    // Receita * (1 - targetML) = totalExpense + totalTax + totalDistribution
    // Receita = (totalExpense + totalTax + totalDistribution) / (1 - targetML)
    
    const denominator = 1 - targetML;
    
    // Evitar divisão por zero ou números negativos
    if (denominator <= 0) return null;
    
    const requiredRevenue = (totalExpense + totalTax + totalDistribution) / denominator;
    // Usar baseRevenue (apenas revenue + other_revenue, SEM forecast_revenue)
    const revenueGap = requiredRevenue - baseRevenue;
    
    // Para meses restantes, usar monthCount do período
    const monthsForCalc = monthCount || 1;
    const monthlyRevenueNeeded = revenueGap > 0 ? revenueGap / monthsForCalc : 0;
    
    return {
      requiredRevenue,
      currentRevenue: baseRevenue, // Apenas revenue + other_revenue, SEM forecast_revenue
      revenueGap,
      monthlyRevenueNeeded,
      isAchievable: denominator > 0,
    };
  }, [periodTotals, targetMLPercentage]);

  // Projections based on selected month through December
  const projections = useMemo(() => {
    if (!periodTotals || effectiveMonthlyTarget <= 0) return null;

    const { totalRevenue, totalExpense, totalTax, initialBalance, finalBalance } = periodTotals;
    
    // Receita Total: usar dados reais do planejamento (consistente com Acumulado Ano)
    const projectedTotalRevenue = totalRevenue;
    
    // Impostos: seguindo lógica do Lucro Presumido, o imposto é pago no mês seguinte
    // Portanto, o imposto do período atual é fixo (já calculado sobre receita anterior)
    // A receita projetada só geraria imposto adicional no mês seguinte
    const projectedTotalTax = totalTax;
    
    const projectedTotalExpense = totalExpense; // Expense doesn't change
    const projectedProfit = projectedTotalRevenue - projectedTotalExpense - projectedTotalTax;
    const projectedFinalBalance = initialBalance + projectedProfit;
    const projectedML = projectedTotalRevenue > 0 ? (projectedProfit / projectedTotalRevenue) * 100 : 0;
    const balanceImprovement = projectedFinalBalance - finalBalance;

    // Cálculo de vendas faltantes para o mês selecionado
    // Novas vendas já realizadas no mês
    const newSalesRealized = currentMonthPlanning ? (Number(currentMonthPlanning.revenue_new_sales) || 0) : 0;
    // Vendas que ainda faltam fazer para atingir a meta de entrada mensal
    const salesNeeded = Math.max(0, monthlyEntry - newSalesRealized);

    return {
      projectedTotalRevenue,
      projectedTotalTax,
      projectedTotalExpense,
      projectedProfit,
      projectedFinalBalance,
      projectedML,
      balanceImprovement,
      monthsRemaining,
      newSalesRealized,
      salesNeeded,
    };
  }, [periodTotals, effectiveMonthlyTarget, monthlyEntry, monthsRemaining, currentMonthPlanning, monthForecast, isYearView, annualEntry]);

  // Função para sincronizar forecast_revenue com os valores de À Vista + Recorrente
  // IMPORTANTE: Apenas atualiza mês atual e meses futuros para preservar dados históricos
  const syncForecastToPlanning = useCallback(async () => {
    if (!annualTarget || annualTarget === 0) return;
    
    const defaultTarget = annualTarget / 12;
    const planningUpdates: { month: string; forecast_revenue: number }[] = [];
    
    // Determinar o início do mês atual para comparação
    const currentMonthStart = startOfMonth(new Date());
    
    for (let index = 0; index < 12; index++) {
      const monthKey = `${selectedYear}-${String(index + 1).padStart(2, '0')}-01`;
      const monthDate = parse(monthKey, 'yyyy-MM-dd', new Date());
      
      // Pular meses passados - não atualizar forecast_revenue de meses anteriores ao atual
      if (isBefore(monthDate, currentMonthStart)) {
        continue;
      }
      
      const monthlyTargetValue = customMonthlyTargets[monthKey] ?? defaultTarget;
      
      // Calcular À Vista
      const cashAmount = monthlyTargetValue * (cashPercentage / 100);
      
      // Calcular Recorrente acumulado - excluindo parcelas de meses passados
      // (parcelas de meses passados já estão lançadas como planned_revenue)
      let recurringAccumulated = 0;
      for (let i = 0; i <= index; i++) {
        const prevMonthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}-01`;
        const prevMonthDate = parse(prevMonthKey, 'yyyy-MM-dd', new Date());
        
        // Pular meses passados - suas parcelas já estão em planned_revenue
        if (isBefore(prevMonthDate, currentMonthStart)) continue;
        
        const prevTarget = customMonthlyTargets[prevMonthKey] ?? defaultTarget;
        const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
        const prevInstallment = prevRecurringAmount / recurringInstallments;
        const installmentNumber = index - i + 1;
        if (installmentNumber <= recurringInstallments) {
          recurringAccumulated += prevInstallment;
        }
      }
      
      // Total = À Vista + Recorrente (já sem duplicação pois meses passados foram excluídos)
      const forecastRevenue = cashAmount + recurringAccumulated;
      
      planningUpdates.push({
        month: monthKey,
        forecast_revenue: forecastRevenue,
      });
    }
    
    // Atualizar apenas meses atuais e futuros
    await upsertPlanningBatch(planningUpdates);
  }, [annualTarget, cashPercentage, recurringPercentage, recurringInstallments, selectedYear, customMonthlyTargets, upsertPlanningBatch]);

  const handleSave = async () => {
    let periodId = selectedPeriodId;
    
    // If no period exists for this year, create one automatically
    if (!periodId) {
      toast.info(`Criando período "Ano ${selectedYear}"...`);
      createPeriod({
        name: `Ano ${selectedYear}`,
        start_date: `${selectedYear}-01-01`,
        end_date: `${selectedYear}-12-31`,
        status: 'open',
        initial_cash_balance: previousYearFinalBalance
      }, {
        onSuccess: async (newPeriod: any) => {
          // Save target with new period ID
          const targetData = {
            period_id: newPeriod.id,
            annual_target: annualTarget,
            monthly_target: monthlyTarget,
            cash_sale_percentage: cashPercentage,
            recurring_sale_percentage: recurringPercentage,
            recurring_installments: 12,
            target_ml_percentage: targetMLPercentage,
            month_forecast: monthForecast,
          };
          await createSalesTargetAsync(targetData);
          
          // Sincronizar com planejamento após salvar (agora garante que o target foi salvo)
          await syncForecastToPlanning();
        }
      });
      return;
    }

    const targetData = {
      period_id: periodId,
      annual_target: annualTarget,
      monthly_target: monthlyTarget,
      cash_sale_percentage: cashPercentage,
      recurring_sale_percentage: recurringPercentage,
      recurring_installments: 12,
      target_ml_percentage: targetMLPercentage,
      month_forecast: monthForecast,
    };

    try {
      if (salesTargets && salesTargets.length > 0) {
        await updateSalesTargetAsync({ id: salesTargets[0].id, ...targetData });
      } else {
        await createSalesTargetAsync(targetData);
      }
      
      // Sincronizar com planejamento após salvar (agora garante que o target foi salvo)
      await syncForecastToPlanning();
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
    }
  };

  // Auto-sync forecast_revenue when sales target data is loaded and planning has zeros
  useEffect(() => {
    if (annualTarget > 0 && yearPlanning.length > 0 && !isSyncingBatch) {
      const allForecastZero = yearPlanning.every(p => (Number(p.forecast_revenue) || 0) === 0);
      if (allForecastZero) {
        syncForecastToPlanning();
      }
    }
  }, [annualTarget, yearPlanning.length, selectedYear]);

  // Handle monthly target change from the table
  const handleMonthlyTargetChange = (month: string, value: number) => {
    if (!salesTargets || salesTargets.length === 0) {
      toast.error("Salve a configuração primeiro antes de personalizar metas mensais");
      return;
    }

    const salesTargetId = salesTargets[0].id;
    
    // Update local state immediately
    setCustomMonthlyTargets(prev => ({
      ...prev,
      [month]: value
    }));

    // Save to database
    upsertMonthlyData({
      sales_target_id: salesTargetId,
      month: month,
      monthly_target: value,
    });
  };

  const isSaving = isCreating || isUpdating || isCreatingPeriod || isSyncingBatch;

  // Get formatted month name
  const selectedMonthLabel = isYearView ? `Ano ${selectedYear}` : (MONTHS.find(m => m.value === selectedMonth)?.label || "");

  if (isLoadingPeriods) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Metas de Vendas
          </h1>
          <p className="text-muted-foreground">
            Configure e acompanhe as metas do time comercial
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline"
            onClick={handleSendAnnualReport}
            disabled={isSendingDiscord}
          >
            {isSendingDiscord ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Relatório
          </Button>
        </div>
      </div>

      {/* Configuração da Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {isYearView ? "Configuração da Meta Anual" : "Configuração da Meta Mensal"}
          </CardTitle>
          <CardDescription>
            {isYearView 
              ? "Defina a meta anual de vendas e a distribuição entre vendas à vista e recorrentes"
              : "Defina a meta de vendas e a distribuição entre vendas à vista e recorrentes"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Linha 1: Meta Anual/Mensal e Previsto */}
          <div className={`grid gap-6 ${isYearView ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
            {isYearView ? (
              <>
                {/* Meta Anual */}
                <div className="space-y-2 text-center">
                  <Label className="flex items-center gap-2 justify-center">
                    <Target className="w-4 h-4" />
                    Meta Anual de Vendas
                  </Label>
                  <Input
                    type="number"
                    value={annualTarget}
                    onChange={(e) => setAnnualTarget(Number(e.target.value))}
                    placeholder="0"
                    disabled={!canEditFinance}
                    className={cn(
                      "text-lg font-semibold text-center",
                      !canEditFinance && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(annualTarget)}
                  </p>
                </div>

              </>
            ) : (
              <>
                {/* Meta Mensal */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Meta
                  </Label>
                  <Input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                    placeholder="0"
                    disabled={!canEditFinance}
                    className={cn(
                      "text-lg font-semibold",
                      !canEditFinance && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(monthlyTarget)}
                  </p>
                </div>

                {/* Previsto do Mês */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Previsto do Mês
                  </Label>
                  <Input
                    type="number"
                    value={monthForecast}
                    onChange={(e) => setMonthForecast(Number(e.target.value))}
                    placeholder="0"
                    disabled={!canEditFinance}
                    className={cn(
                      "text-lg font-semibold",
                      !canEditFinance && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(monthForecast)} - Receita já prevista no início do mês
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Linha 2: % Vendas e ML Alvo lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* % Vendas */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                % Vendas
              </Label>
              <div className="pt-2">
                <Slider
                  value={[cashPercentage]}
                  onValueChange={(value) => setCashPercentage(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!canEditFinance}
                  className={cn(!canEditFinance && "opacity-60")}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">À Vista: {cashPercentage}%</span>
                <span className="font-bold text-lg text-muted-foreground">Recorrente: {recurringPercentage}%</span>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5">
                {isYearView ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendas À Vista (ano):</span>
                      <span className="font-semibold text-green-500">
                        {formatCurrency(annualCashSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendas Recorrentes (ano):</span>
                      <span className="font-semibold text-violet-500">
                        {formatCurrency(annualRecurringSales)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5">
                      <span className="text-muted-foreground font-medium">Entrada Anual:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(annualEntry)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendas À Vista:</span>
                      <span className="font-semibold text-green-500">
                        {formatCurrency(cashSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendas Recorrentes:</span>
                      <span className="font-semibold text-violet-500">
                        {formatCurrency(recurringSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parcela Mensal (÷{recurringInstallments}):</span>
                      <span className="font-semibold text-purple-500">
                        {formatCurrency(recurringInstallment)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5">
                      <span className="text-muted-foreground font-medium">Entrada do Mês:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(cashSales + recurringInstallment)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ML Alvo */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                ML Alvo (%)
              </Label>
              <div className="pt-2">
                <Slider
                  value={[targetMLPercentage]}
                  onValueChange={(value) => setTargetMLPercentage(value[0])}
                  min={0}
                  max={50}
                  step={1}
                  disabled={!canEditFinance}
                  className={cn(!canEditFinance && "opacity-60")}
                />
              </div>
              <span className="font-bold text-lg">{targetMLPercentage}%</span>
              
              {requiredRevenueForML && (
                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receita Necessária:</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(requiredRevenueForML.requiredRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receita Atual:</span>
                    <span>{formatCurrency(requiredRevenueForML.currentRevenue)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span className="text-muted-foreground">Gap de Receita:</span>
                    <span className={requiredRevenueForML.revenueGap > 0 ? "text-amber-500 font-semibold" : "text-green-500 font-semibold"}>
                      {requiredRevenueForML.revenueGap > 0 ? '+' : ''}{formatCurrency(requiredRevenueForML.revenueGap)}
                    </span>
                  </div>
                  {requiredRevenueForML.revenueGap > 0 && periodTotals && periodTotals.monthCount > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receita Adicional/Mês:</span>
                      <span className="font-semibold text-violet-500">
                        {formatCurrency(requiredRevenueForML.monthlyRevenueNeeded)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Resumo da Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vendas à Vista ({isYearView ? "anual" : "mensal"})
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(isYearView ? annualCashSales : cashSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-violet-500/10 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <RefreshCw className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vendas Recorrentes ({isYearView ? "anual" : "mensal"})
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(isYearView ? annualRecurringSales : recurringSales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <PiggyBank className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isYearView ? "Entrada Total Anual" : `Parcela Recorrente (÷${recurringInstallments})`}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(isYearView ? annualEntry : recurringInstallment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita no Caixa - apenas para visão mensal */}
      {!isYearView && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5" />
              Receita que Entra no Caixa (Mês 1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Linha 1: Vendas à Vista + 1ª Parcela = Subtotal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Vendas à Vista</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(cashSales)}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg flex items-center justify-center gap-2">
                <span className="text-2xl text-muted-foreground">+</span>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">1ª Parcela Recorrente</p>
                  <p className="text-xl font-bold text-violet-500">{formatCurrency(recurringInstallment)}</p>
                </div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">= Subtotal Bruto</p>
                <p className="text-xl font-bold">{formatCurrency(monthlyEntry)}</p>
              </div>
            </div>
            
            {/* Linha 2: Taxa Hubla */}
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-destructive">Taxa Hubla ({HUBLA_FEE_PERCENTAGE}%)</p>
                  <p className="text-xs text-muted-foreground">Taxa da plataforma de vendas</p>
                </div>
                <p className="text-xl font-bold text-destructive">- {formatCurrency(hublaFeeAmount)}</p>
              </div>
            </div>
            
            {/* Linha 3: Total Líquido */}
            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-primary">= TOTAL ENTRADA LÍQUIDA</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyEntryNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visão Anual: Tabela Unificada de Metas e Cenário */}

      {/* Visão Anual: Simulador de Cenário */}
      {isYearView && (
        <>
          <ScenarioSimulatorTable 
            yearPlanning={yearPlanning}
            annualTarget={annualTarget}
            targetMLPercentage={targetMLPercentage}
            hublaFeePercentage={HUBLA_FEE_PERCENTAGE}
            customMonthlyTargets={customMonthlyTargets}
            previousYearFinalBalance={previousYearFinalBalance}
            selectedYear={selectedYear}
            isLoading={isLoadingPlanning}
            cashPercentage={cashPercentage}
            recurringInstallments={recurringInstallments}
            canEdit={canEditFinance}
            onMonthlyTargetChange={(month, value) => {
              setCustomMonthlyTargets(prev => ({
                ...prev,
                [month]: value
              }));
              // Persist to database if we have a sales target
              if (salesTargets && salesTargets.length > 0) {
                upsertMonthlyData({
                  sales_target_id: salesTargets[0].id,
                  month,
                  monthly_target: value
                });
              }
              toast.success(`Meta de ${format(parse(month, 'yyyy-MM-dd', new Date()), 'MMMM', { locale: ptBR })} atualizada`);
            }}
            onSalesAchievedChange={(month, value) => {
              // Salvar valor de vendas manuais no campo revenue_new_sales do planejamento
              upsertPlanning({ 
                month, 
                revenue_new_sales: value 
              });
              toast.success(`Vendas de ${format(parse(month, 'yyyy-MM-dd', new Date()), 'MMMM', { locale: ptBR })} atualizado para ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`);
            }}
          />
          
          <AnnualEvolutionChart
            yearPlanning={yearPlanning}
            targetMLPercentage={targetMLPercentage}
            hublaFeePercentage={HUBLA_FEE_PERCENTAGE}
            isLoading={isLoadingPlanning}
          />
        </>
      )}

      {/* Dados do Mês Selecionado */}
      {isLoadingPlanning ? (
        <Card>
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : currentMonthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Dados do Planejamento - {selectedMonthLabel}/{selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard 
                label="Receitas" 
                value={currentMonthData.revenue} 
                color="green" 
              />
              <MetricCard 
                label="Despesas" 
                value={currentMonthData.expense} 
                color="red" 
              />
              <MetricCard 
                label="Impostos" 
                value={currentMonthData.tax} 
                color="amber" 
              />
              <MetricCard 
                label="Geração Caixa" 
                value={currentMonthData.cashGeneration} 
                color={currentMonthData.cashGeneration >= 0 ? "emerald" : "red"} 
              />
              <MetricCard 
                label="Saldo Inicial" 
                value={currentMonthData.initialBalance} 
                color="blue" 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Ano */}
      {planningTotals && (
        <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Resumo do Ano Previsão {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <MetricCard 
                label="Receitas Totais" 
                value={planningTotals.totalRevenue} 
                color="green" 
              />
              <MetricCard 
                label="Despesas Totais" 
                value={planningTotals.totalExpense} 
                color="red" 
              />
              <MetricCard 
                label="Geração de Caixa" 
                value={planningTotals.cashGeneration} 
                color={planningTotals.cashGeneration >= 0 ? "emerald" : "red"} 
              />
              <MetricCard 
                label="Saldo Inicial" 
                value={planningTotals.initialBalance} 
                color="blue" 
              />
              <MetricCard 
                label="Saldo Final" 
                value={planningTotals.finalBalance} 
                color={planningTotals.finalBalance >= 0 ? "indigo" : "red"} 
              />
              <MetricCard 
                label="ML Médio" 
                value={planningTotals.mlMedio} 
                color={planningTotals.mlMedio >= targetMLPercentage ? "cyan" : "amber"} 
                isPercentage 
              />
              <MetricCard 
                label="ML Previsto" 
                value={planningTotals.mlPercentage} 
                color={planningTotals.mlPercentage >= targetMLPercentage ? "teal" : "amber"} 
                isPercentage 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Salvar */}
      {canEditFinance && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para métricas do planejamento
interface MetricCardProps {
  label: string;
  value: number;
  color: "green" | "red" | "amber" | "emerald" | "blue" | "indigo" | "cyan" | "teal";
  isPercentage?: boolean;
}

const MetricCard = ({ label, value, color, isPercentage }: MetricCardProps) => {
  const colorClasses: Record<string, string> = {
    green: "text-green-500",
    red: "text-red-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    indigo: "text-indigo-500",
    cyan: "text-cyan-500",
    teal: "text-teal-500",
  };

  return (
    <div className="text-center p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorClasses[color]}`}>
        {isPercentage ? `${value.toFixed(1)}%` : formatCompact(value)}
      </p>
    </div>
  );
};

// Componente auxiliar para métricas projetadas
interface ProjectedMetricCardProps {
  label: string;
  value: number;
  delta?: number;
  subtitle?: string;
  color: "green" | "red" | "amber" | "emerald" | "blue" | "indigo" | "cyan" | "teal";
  isPercentage?: boolean;
}

const ProjectedMetricCard = ({ label, value, delta, subtitle, color, isPercentage }: ProjectedMetricCardProps) => {
  const colorClasses: Record<string, string> = {
    green: "text-green-500",
    red: "text-red-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    indigo: "text-indigo-500",
    cyan: "text-cyan-500",
    teal: "text-teal-500",
  };

  return (
    <div className="text-center p-2 bg-background/50 rounded-lg border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-bold ${colorClasses[color]}`}>
        {isPercentage ? `${value.toFixed(1)}%` : formatCompact(value)}
      </p>
      {delta !== undefined && delta !== 0 && (
        <p className="text-xs text-green-500">+{formatCompact(delta)}</p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};

export default MetasVendas;
