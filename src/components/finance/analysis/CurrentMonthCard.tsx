import { useMemo } from "react";
import { format, subMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Target, Scale } from "lucide-react";
import { getDynamicExpense, getFullRevenue } from "@/lib/dynamicExpenseCalculation";
import { useFinancialPeriods } from "@/hooks/useFinancialPeriods";
import { useSalesTargets } from "@/hooks/useSalesTargets";

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
  revenue_new_sales?: number | null;
}

interface MonthlyTarget {
  id: string;
  month: string;
  revenue_target?: number | null;
}

interface CurrentMonthCardProps {
  planningData: MonthlyPlanning[] | undefined;
  targets: MonthlyTarget[] | undefined;
  selectedMonth?: string; // yyyy-MM format
  hublaFeePercentage: number;
  showTarget?: boolean;
}

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const CurrentMonthCard = ({ planningData, targets, selectedMonth, hublaFeePercentage, showTarget = true }: CurrentMonthCardProps) => {
  // Buscar dados de Metas de Vendas
  const { periods } = useFinancialPeriods();
  
  const selectedPeriodId = useMemo(() => {
    if (!periods?.length) return undefined;
    const year = selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear().toString();
    const period = periods.find(p => p.start_date?.startsWith(year));
    return period?.id;
  }, [periods, selectedMonth]);

  const { salesTargets } = useSalesTargets({ periodId: selectedPeriodId });

  const data = useMemo(() => {
    const referenceDate = selectedMonth
      ? new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1, 1)
      : new Date();
    const currentMonthStr = format(referenceDate, 'yyyy-MM-01');
    const prevMonthStr = format(subMonths(referenceDate, 1), 'yyyy-MM-01');

    const currentPlanning = planningData?.find(p => p.month === currentMonthStr);
    const prevPlanning = planningData?.find(p => p.month === prevMonthStr);

    const curRevenue = getFullRevenue(currentPlanning);
    const curExpenseDynamic = getDynamicExpense(currentPlanning, hublaFeePercentage, planningData);
    const curExpense = curExpenseDynamic.total;
    const curCashGen = curRevenue - curExpense;
    const curML = curRevenue > 0 ? (curCashGen / curRevenue) * 100 : 0;

    // === Meta de Vendas (mesma lógica do GoalGapCard/ScenarioSimulatorTable) ===
    const salesTarget = salesTargets?.[0];
    const annualTarget = Number(salesTarget?.annual_target) || 0;
    const cashPercentage = Number(salesTarget?.cash_sale_percentage) || 50;
    const recurringPercentage = 100 - cashPercentage;
    const recurringInstallments = Number(salesTarget?.recurring_installments) || 12;
    const defaultMonthlyTarget = annualTarget > 0 ? annualTarget / 12 : 0;

    // Obter metas mensais customizadas
    const monthlyData = salesTarget?.monthly_data || [];
    const customMonthlyTargets: Record<string, number> = {};
    monthlyData.forEach(m => {
      if (m.monthly_target != null) {
        customMonthlyTargets[m.month] = Number(m.monthly_target);
      }
    });

    // Calcular o índice do mês atual no ano (0 = jan, 11 = dez)
    const year = referenceDate.getFullYear();
    const monthIndex = referenceDate.getMonth(); // 0-based

    // À Vista do mês selecionado
    const currentTarget = customMonthlyTargets[currentMonthStr] ?? defaultMonthlyTarget;
    const cashAmount = currentTarget * (cashPercentage / 100);

    // Recorrente acumulado (mesma lógica do ScenarioSimulatorTable)
    let recurringAccumulated = 0;
    for (let i = 0; i <= monthIndex; i++) {
      const prevMonthDate = new Date(year, i, 1);
      const prevMonthKey = format(prevMonthDate, 'yyyy-MM-01');
      const prevTarget = customMonthlyTargets[prevMonthKey] ?? defaultMonthlyTarget;
      const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
      const prevInstallment = prevRecurringAmount / recurringInstallments;
      const installmentNumber = monthIndex - i + 1;
      if (installmentNumber <= recurringInstallments) {
        recurringAccumulated += prevInstallment;
      }
    }

    // Meta = À Vista + Recorrente Acumulado
    const targetValue = cashAmount + recurringAccumulated;

    // Atingido = revenue_new_sales (vendas manuais) ou revenue (fallback)
    const curRevenueReal = Number(currentPlanning?.revenue) || 0;
    const curSalesAchieved = (currentPlanning?.revenue_new_sales != null && Number(currentPlanning.revenue_new_sales) > 0)
      ? Number(currentPlanning.revenue_new_sales)
      : curRevenueReal;

    const curTargetAchievement = targetValue > 0 ? (curSalesAchieved / targetValue) * 100 : 0;
    const faltaMeta = Math.max(0, targetValue - curSalesAchieved);
    const faltaZeroAZero = Math.max(0, curExpense - curRevenueReal);

    const prevRevenue = getFullRevenue(prevPlanning);
    const prevExpenseDynamic = getDynamicExpense(prevPlanning, hublaFeePercentage, planningData);
    const prevExpense = prevExpenseDynamic.total;
    const prevCashGen = prevRevenue - prevExpense;
    const prevML = prevRevenue > 0 ? (prevCashGen / prevRevenue) * 100 : 0;

    const calcVar = (curr: number, prev: number) =>
      prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : curr > 0 ? 100 : 0;

    return {
      monthLabel: format(referenceDate, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()),
      prevMonthLabel: format(subMonths(referenceDate, 1), "MMM/yy", { locale: ptBR }),
      revenue: curRevenue,
      revenueRealizada: curRevenueReal,
      salesAchieved: curSalesAchieved,
      expense: curExpense,
      cashGeneration: curCashGen,
      netMargin: curML,
      targetValue,
      targetAchievement: curTargetAchievement,
      faltaMeta,
      faltaZeroAZero,
      variations: {
        revenue: calcVar(curRevenue, prevRevenue),
        expense: calcVar(curExpense, prevExpense),
        ml: curML - prevML,
      },
    };
  }, [planningData, targets, selectedMonth, hublaFeePercentage, salesTargets]);

  const VariationBadge = ({ value, suffix = '%', inverse = false }: { value: number; suffix?: string; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = Math.abs(value) < 0.1;
    const color = isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;

    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {value >= 0 ? '+' : ''}{value.toFixed(1)}{suffix}
      </span>
    );
  };

  const metrics = [
    { label: 'Receita Total', value: formatCurrencyFull(data.revenue), color: 'text-green-600' },
    { label: 'Receita Realizada', value: formatCurrencyFull(data.revenueRealizada), color: 'text-green-600' },
    { label: 'Despesa Total', value: formatCurrencyFull(data.expense), color: 'text-red-600' },
    { label: 'Ger. Caixa', value: formatCurrencyFull(data.cashGeneration), color: data.cashGeneration >= 0 ? 'text-green-600' : 'text-red-600' },
    { label: 'ML%', value: `${data.netMargin.toFixed(1)}%`, color: data.netMargin >= 0 ? 'text-cyan-600' : 'text-red-600' },
  ];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-bold uppercase tracking-wide text-primary">
            {data.monthLabel}
          </h2>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-xs text-muted-foreground font-medium mb-1">{m.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${m.color} tabular-nums`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Cards de ação: Meta e Zero a Zero */}
        <div className={`grid grid-cols-1 ${showTarget ? 'sm:grid-cols-2' : ''} gap-3 mb-5`}>
          {/* Meta */}
          {showTarget && <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Meta do Mês - Vendas</span>
              <span className={`ml-auto text-xs font-bold ${data.targetAchievement >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                {data.targetAchievement.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Meta</p>
                <p className="text-sm font-bold tabular-nums">{formatCurrencyFull(data.targetValue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Atingido</p>
                <p className="text-sm font-bold text-green-600 tabular-nums">{formatCurrencyFull(data.salesAchieved)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Falta vender</p>
                <p className={`text-sm font-bold tabular-nums ${data.faltaMeta > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatCurrencyFull(data.faltaMeta)}
                </p>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-amber-200/50 dark:bg-amber-900/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${data.targetAchievement >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, data.targetAchievement)}%` }}
              />
            </div>
          </div>}

          {/* Zero a Zero */}
          <div className="rounded-lg border border-cyan-300/50 bg-cyan-50/50 dark:bg-cyan-950/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase">Zero a Zero</span>
              <span className={`ml-auto text-xs font-bold ${data.faltaZeroAZero <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.faltaZeroAZero <= 0 ? '✅ Coberto' : '⚠️ Falta'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Despesa Total</p>
                <p className="text-sm font-bold text-red-600 tabular-nums">{formatCurrencyFull(data.expense)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Atingido</p>
                <p className="text-sm font-bold text-green-600 tabular-nums">{formatCurrencyFull(data.revenueRealizada)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Falta p/ empatar</p>
                <p className={`text-sm font-bold tabular-nums ${data.faltaZeroAZero > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrencyFull(data.faltaZeroAZero)}
                </p>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-cyan-200/50 dark:bg-cyan-900/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${data.expense > 0 && data.revenueRealizada >= data.expense ? 'bg-green-500' : 'bg-cyan-500'}`}
                style={{ width: `${data.expense > 0 ? Math.min(100, (data.revenueRealizada / data.expense) * 100) : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Variações vs mês anterior */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-3 border-t border-primary/20">
          <span className="text-xs text-muted-foreground">vs {data.prevMonthLabel}:</span>
          <span className="text-xs text-muted-foreground">
            Receita <VariationBadge value={data.variations.revenue} />
          </span>
          <span className="text-xs text-muted-foreground">
            Despesa <VariationBadge value={data.variations.expense} inverse />
          </span>
          <span className="text-xs text-muted-foreground">
            ML <VariationBadge value={data.variations.ml} suffix="pp" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
