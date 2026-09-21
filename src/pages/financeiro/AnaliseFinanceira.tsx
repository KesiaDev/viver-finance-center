import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDynamicExpense, getFullRevenue } from "@/lib/dynamicExpenseCalculation";
import { BarChart3, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMonthlyPlanning } from "@/hooks/useMonthlyPlanning";
import { useMonthlyTargets } from "@/hooks/useMonthlyTargets";
import { useFinancialAnalysis } from "@/hooks/useFinancialAnalysis";
import { useFinancialPeriods } from "@/hooks/useFinancialPeriods";
import { useSalesTargets } from "@/hooks/useSalesTargets";
import { useFinancialConfig } from "@/hooks/useFinancialConfig";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

// Analysis Components
import { CurrentMonthCard } from "@/components/finance/analysis/CurrentMonthCard";
import { MonthlyDetailTable } from "@/components/finance/analysis/MonthlyDetailTable";
import { FinancialKPICards } from "@/components/finance/analysis/FinancialKPICards";
import { RevenueBreakdownPie } from "@/components/finance/analysis/RevenueBreakdownPie";
import { ExpenseBreakdownPie } from "@/components/finance/analysis/ExpenseBreakdownPie";
import { TrendLineChart } from "@/components/finance/analysis/TrendLineChart";
import { MovingAveragesCard } from "@/components/finance/analysis/MovingAveragesCard";
import { ScenarioProjectionChart } from "@/components/finance/analysis/ScenarioProjectionChart";
import { BreakevenCalculator } from "@/components/finance/analysis/BreakevenCalculator";
import { AnnualEvolutionChart } from "@/components/finance/sales-targets/AnnualEvolutionChart";
import { PeriodSelector } from "@/components/finance/analysis/PeriodSelector";
import { MonthlyComparisonChart } from "@/components/finance/monthly-analysis/MonthlyComparisonChart";
import { MonthPicker } from "@/components/ui/month-picker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const AnaliseFinanceira = () => {
  const {
    analysisYear: selectedYear,
    analysisPeriodType: periodType,
    setAnalysisPeriodType: setPeriodType,
    analysisSelectedYears: selectedYears,
    setAnalysisSelectedYears: setSelectedYears,
    analysisRangePreset: rangePreset,
    setAnalysisRangePreset: setRangePreset,
    analysisMonth,
    setAnalysisMonth,
    analysisShowTarget: showTarget,
    setAnalysisShowTarget: setShowTarget,
  } = useAppPreferences();

  // Convert analysisMonth (yyyy-MM-01) to MonthPicker format (yyyy-MM)
  const currentRealMonth = format(new Date(), 'yyyy-MM');
  const monthPickerValue = analysisMonth ? analysisMonth.substring(0, 7) : currentRealMonth;
  const isDefaultMonth = monthPickerValue === currentRealMonth;

  // The selected month to pass to CurrentMonthCard (yyyy-MM format, undefined = current month)
  const selectedMonthForCard = isDefaultMonth ? undefined : monthPickerValue;

  const handleMonthChange = (value: string) => {
    setAnalysisMonth(`${value}-01`);
  };

  const handleClearMonth = () => {
    setAnalysisMonth(format(new Date(), 'yyyy-MM-01'));
  };

  const { planningData, isLoading: planningLoading } = useMonthlyPlanning();
  const { targets, getTargetByMonth } = useMonthlyTargets();
  const { hublaFeePercentage } = useFinancialConfig();

  // Sales Targets para o gráfico comparativo
  const { periods } = useFinancialPeriods();
  const { salesTargets } = useSalesTargets({});

  const {
    yearData,
    yearKPIs,
    movingAverages,
    revenueComposition,
    expenseComposition,
    scenarioProjections,
    calculateBreakeven,
  } = useFinancialAnalysis(planningData, targets, selectedYears, rangePreset, hublaFeePercentage);

  // Months included for the table
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

  // Period label for KPIs
  const periodLabel = useMemo(() => {
    if (rangePreset === '6m') return 'Últimos 6 meses';
    if (rangePreset === '12m') return 'Últimos 12 meses';
    if (rangePreset === 'quarter') return 'Último trimestre';
    if (selectedYears.length === 1) return `Acumulado ${selectedYears[0]}`;
    if (selectedYears.length > 1) return `${selectedYears.sort().join(' + ')}`;
    return '';
  }, [selectedYears, rangePreset]);

  // Helper: calcular meta de vendas para um mês específico
  const getSalesTargetForMonth = (date: Date) => {
    const year = date.getFullYear();
    const period = periods?.find(p => p.start_date?.startsWith(year.toString()));
    if (!period) return 0;
    const st = salesTargets?.find(s => s.period_id === period.id);
    if (!st) return 0;

    const annualTarget = Number(st.annual_target) || 0;
    const cashPct = Number(st.cash_sale_percentage) || 50;
    const recurringPct = 100 - cashPct;
    const recurringInst = Number(st.recurring_installments) || 12;
    const defaultMonthly = annualTarget > 0 ? annualTarget / 12 : 0;

    const monthlyData = st.monthly_data || [];
    const customTargets: Record<string, number> = {};
    monthlyData.forEach(m => {
      if (m.monthly_target != null) customTargets[m.month] = Number(m.monthly_target);
    });

    const monthStr = format(date, 'yyyy-MM-01');
    const monthIndex = date.getMonth();
    const currentTarget = customTargets[monthStr] ?? defaultMonthly;
    const cashAmount = currentTarget * (cashPct / 100);

    let recurringAccumulated = 0;
    for (let i = 0; i <= monthIndex; i++) {
      const prevDate = new Date(year, i, 1);
      const prevKey = format(prevDate, 'yyyy-MM-01');
      const prevTarget = customTargets[prevKey] ?? defaultMonthly;
      const prevRecurring = prevTarget * (recurringPct / 100);
      const installment = prevRecurring / recurringInst;
      const installmentNumber = monthIndex - i + 1;
      if (installmentNumber <= recurringInst) {
        recurringAccumulated += installment;
      }
    }

    return cashAmount + recurringAccumulated;
  };

  // Data for comparison chart (last 6 months)
  const comparisonChartData = useMemo(() => {
    if (!planningData) return [];
    const today = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthStr = format(date, 'yyyy-MM-01');
      const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
      const planning = planningData.find(p => p.month === monthStr);
      const revenue = getFullRevenue(planning);
      const expenseDynamic = getDynamicExpense(planning, hublaFeePercentage, planningData);
      const expense = expenseDynamic.total;
      data.push({
        month: monthLabel,
        revenue,
        target: getSalesTargetForMonth(date),
        expense,
      });
    }
    return data;
  }, [planningData, periods, salesTargets, hublaFeePercentage]);

  // Target data map for detail table
  const targetByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    monthsToInclude.forEach(m => {
      const date = new Date(m + 'T00:00:00');
      map[m] = getSalesTargetForMonth(date);
    });
    return map;
  }, [monthsToInclude, periods, salesTargets]);

  // Trend data for line charts
  const trendData = useMemo(() => ({
    revenue: yearData.map(d => ({ label: d.label, value: d.revenue })),
    netMargin: yearData.map(d => ({ label: d.label, value: d.netMargin })),
    cashBalance: yearData.map(d => ({ label: d.label, value: d.cashBalance })),
  }), [yearData]);

  // Year planning for AnnualEvolutionChart
  const yearPlanning = useMemo(() => {
    if (!planningData) return [];
    const targetYear = selectedYears.length > 0 ? Math.max(...selectedYears) : selectedYear;
    if (targetYear < 2025) return [];
    return planningData.filter(p => p.month.startsWith(targetYear.toString()));
  }, [planningData, selectedYears, selectedYear]);

  const targetMLPercentage = 15;
  const primaryYear = selectedYears.length > 0 ? Math.max(...selectedYears) : selectedYear;

  if (planningLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Análise Financeira</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Switch checked={showTarget} onCheckedChange={setShowTarget} id="show-target" />
            <label htmlFor="show-target" className="text-sm text-muted-foreground cursor-pointer">Com Meta</label>
          </div>
          <div className="relative">
            <MonthPicker
              value={monthPickerValue}
              onChange={handleMonthChange}
              placeholder="Mês"
              className="w-[180px]"
            />
            {!isDefaultMonth && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={(e) => { e.stopPropagation(); handleClearMonth(); }}
                title="Voltar ao mês atual"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <PeriodSelector
            periodType={periodType}
            selectedYears={selectedYears}
            rangePreset={rangePreset}
            onPeriodTypeChange={setPeriodType}
            onSelectedYearsChange={setSelectedYears}
            onRangePresetChange={setRangePreset}
          />
        </div>
      </div>

      {/* Tabs - 2 abas */}
      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
        </TabsList>

        {/* Visão Geral Tab */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* 1. Card do Mês Atual */}
          <CurrentMonthCard planningData={planningData} targets={targets} selectedMonth={selectedMonthForCard} hublaFeePercentage={hublaFeePercentage} showTarget={showTarget} />

          {/* 2. KPIs do Período */}
          <FinancialKPICards data={yearKPIs} periodLabel={periodLabel} />

          {/* 3. Tabela Mensal Detalhada */}
          <MonthlyDetailTable planningData={planningData} months={monthsToInclude} hublaFeePercentage={hublaFeePercentage} showTarget={showTarget} targetData={targetByMonth} />

          {/* 4. Gráfico Comparativo */}
          <MonthlyComparisonChart
            data={comparisonChartData}
            title={showTarget ? "📊 Receita vs Meta vs Despesa (últimos 6 meses)" : "📊 Receita vs Despesa (últimos 6 meses)"}
            showTarget={showTarget}
          />

          {/* 5. Composição lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueBreakdownPie data={revenueComposition} />
            <ExpenseBreakdownPie data={expenseComposition} />
          </div>

          {/* 6. Gráficos de Evolução */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendLineChart
              data={trendData.revenue}
              title="📈 Evolução da Receita"
              color="hsl(142 76% 36%)"
              format="currency"
              showArea
            />
            <TrendLineChart
              data={trendData.netMargin}
              title="📊 Evolução da Margem Líquida"
              color="hsl(var(--primary))"
              format="percent"
              showTarget
              targetValue={15}
            />
          </div>

          <TrendLineChart
            data={trendData.cashBalance}
            title="💰 Evolução do Saldo de Caixa"
            color="hsl(199 89% 48%)"
            format="currency"
            showArea
          />

          {/* 7. Evolução Anual */}
          {primaryYear >= 2025 && (
            <AnnualEvolutionChart
              yearPlanning={yearPlanning}
              targetMLPercentage={targetMLPercentage}
              hublaFeePercentage={hublaFeePercentage}
              isLoading={planningLoading}
            />
          )}

          {/* 8. Médias Móveis */}
          <MovingAveragesCard data={movingAverages} />
        </TabsContent>

        {/* Projeções Tab */}
        <TabsContent value="projecoes" className="space-y-6">
          <ScenarioProjectionChart projections={scenarioProjections} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakevenCalculator calculateBreakeven={calculateBreakeven} />
            <div className="space-y-4">
              {scenarioProjections.map((scenario) => (
                <div
                  key={scenario.name}
                  className={`p-4 rounded-lg border ${
                    scenario.name === 'Base' ? 'bg-primary/5 border-primary/30' :
                    scenario.name === 'Otimista' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                    'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{scenario.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {(scenario.factor * 100).toFixed(0)}% da meta
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Receita Projetada</p>
                      <p className="font-semibold text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(scenario.totals.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Geração de Caixa</p>
                      <p className={`font-semibold ${scenario.totals.cashGeneration >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(scenario.totals.cashGeneration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Despesa Projetada</p>
                      <p className="font-semibold text-red-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(scenario.totals.expense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margem Líquida</p>
                      <p className={`font-semibold ${scenario.totals.netMargin >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                        {scenario.totals.netMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnaliseFinanceira;
