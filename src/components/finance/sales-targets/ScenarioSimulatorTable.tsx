import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, CheckCircle2, AlertCircle, Eye, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { format, parse, startOfMonth, isBefore, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MonthDetailDialog } from "./MonthDetailDialog";
import { calculateTaxForMonth, MonthData, formatCurrency } from "@/lib/taxCalculations";
import { GoalGapCard } from "./GoalGapCard";

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
  distribution?: number | null;
  initial_balance?: number | null;
  platform_fee?: number | null;
  revenue_new_sales?: number | null; // Vendas manuais do mês
}

interface ScenarioSimulatorTableProps {
  yearPlanning: MonthlyPlanningData[];
  annualTarget: number;
  targetMLPercentage: number;
  hublaFeePercentage: number;
  customMonthlyTargets: Record<string, number>;
  onMonthlyTargetChange: (month: string, value: number) => void;
  previousYearFinalBalance?: number;
  selectedYear: string;
  isLoading?: boolean;
  // Novos props para previsão de entrada
  cashPercentage: number;
  recurringInstallments: number;
  // Callback para salvar vendas manuais
  onSalesAchievedChange?: (month: string, value: number) => void;
  // Prop para controle de edição
  canEdit?: boolean;
}

interface RecurringContribution {
  monthLabel: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
}

interface MonthRowData {
  month: string;
  monthLabel: string;
  type: 'past' | 'current' | 'future';
  // Meta editável
  target: number;
  // Previsão de entrada (calculados)
  cashAmount: number;
  recurringAccumulated: number;
  recurringBreakdown: RecurringContribution[];
  planningRevenue: number;
  totalEntry: number;
  netEntry: number;
  // Do Planejamento (fonte única)
  totalRevenue: number;
  totalExpenses: number;
  // Calculados finais
  cashGeneration: number;
  initialBalance: number;
  finalBalance: number;
  mlPercentage: number;
  // Receita efetivamente realizada (para GoalGapCard)
  achievedRevenue: number;
  // Vendas manuais do mês (para GoalGapCard)
  salesAchieved?: number;
  // Detalhes para tooltip
  revenueBreakdown: {
    revenue: number;
    plannedRevenue: number;
    otherRevenue: number;
    forecastRevenue: number;
  };
  expenseBreakdown: {
    expense: number;
    plannedExpense: number;
    otherExpense: number;
    forecastExpense: number;
    platformFee: number;
    tax: number;
    distribution: number;
  };
}

// formatCurrency importado de @/lib/taxCalculations

const getMonthType = (monthStr: string): 'past' | 'current' | 'future' => {
  const monthDate = startOfMonth(parse(monthStr, 'yyyy-MM-dd', new Date()));
  const currentMonthStart = startOfMonth(new Date());
  
  if (isBefore(monthDate, currentMonthStart)) return 'past';
  if (monthDate.getTime() === currentMonthStart.getTime()) return 'current';
  return 'future';
};

export const ScenarioSimulatorTable = ({
  yearPlanning,
  annualTarget,
  targetMLPercentage,
  hublaFeePercentage,
  customMonthlyTargets,
  onMonthlyTargetChange,
  previousYearFinalBalance = 0,
  selectedYear,
  isLoading,
  cashPercentage,
  recurringInstallments,
  onSalesAchievedChange,
  canEdit = true,
}: ScenarioSimulatorTableProps) => {
  const defaultMonthlyTarget = annualTarget > 0 ? annualTarget / 12 : 0;
  const recurringPercentage = 100 - cashPercentage;

  // State para edição inline das metas
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // State para o dialog de detalhes do mês
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<typeof monthsData[number] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // State para controlar expansão dos trimestres
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(
    new Set(["Q1", "Q2", "Q3", "Q4"]) // Todos expandidos por padrão
  );

  const toggleQuarter = (quarter: string) => {
    setExpandedQuarters((prev) => {
      const next = new Set(prev);
      if (next.has(quarter)) {
        next.delete(quarter);
      } else {
        next.add(quarter);
      }
      return next;
    });
  };

  const toggleAllQuarters = () => {
    if (expandedQuarters.size === 4) {
      setExpandedQuarters(new Set());
    } else {
      setExpandedQuarters(new Set(["Q1", "Q2", "Q3", "Q4"]));
    }
  };

  // Preparar dados para cálculo de impostos (igual ao PlanningTable)
  const monthsDataForTax: MonthData[] = useMemo(() => {
    if (!yearPlanning.length) return [];

    const sortedData = [...yearPlanning].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    const allMonthsSet = new Set(sortedData.map(p => p.month));
    
    if (sortedData.length > 0) {
      const firstMonth = parse(sortedData[0].month, 'yyyy-MM-dd', new Date());
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

  const monthsData: MonthRowData[] = useMemo(() => {
    if (!yearPlanning.length) return [];

    const sortedData = [...yearPlanning].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    let previousFinalBalance = previousYearFinalBalance;

    return sortedData.map((p, index) => {
      const monthType = getMonthType(p.month);
      const monthDate = parse(p.month, 'yyyy-MM-dd', new Date());

      // Meta do mês (editável)
      const target = customMonthlyTargets[p.month] ?? defaultMonthlyTarget;

      // === PREVISÃO DE ENTRADA ===
      // À Vista
      const cashAmount = target * (cashPercentage / 100);
      
      // Recorrente acumulado com breakdown detalhado
      const currentMonthStart = startOfMonth(new Date());
      const isTargetMonthCurrentOrFuture = !isBefore(monthDate, currentMonthStart);
      let recurringAccumulated = 0;
      const recurringBreakdown: RecurringContribution[] = [];
      for (let i = 0; i <= index; i++) {
        const prevMonthKey = sortedData[i]?.month;
        const prevMonthDate = parse(prevMonthKey, 'yyyy-MM-dd', new Date());
        
        // Para meses atuais/futuros, pular parcelas de meses passados (já em planned_revenue)
        if (isTargetMonthCurrentOrFuture && isBefore(prevMonthDate, currentMonthStart)) continue;
        
        const prevTarget = customMonthlyTargets[prevMonthKey] ?? defaultMonthlyTarget;
        const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
        const prevInstallment = prevRecurringAmount / recurringInstallments;
        const installmentNumber = index - i + 1;
        if (installmentNumber <= recurringInstallments) {
          recurringAccumulated += prevInstallment;
          recurringBreakdown.push({
            monthLabel: format(parse(prevMonthKey, 'yyyy-MM-dd', new Date()), 'MMM', { locale: ptBR }),
            installmentNumber,
            totalInstallments: recurringInstallments,
            amount: prevInstallment,
          });
        }
      }

      // === RECEITAS DO PLANEJAMENTO ===
      const revenue = Number(p.revenue) || 0;
      const plannedRevenue = Number(p.planned_revenue) || 0;
      const otherRevenue = Number(p.other_revenue) || 0;
      const forecastRevenue = Number(p.forecast_revenue) || 0;
      
      // Total Entrada = soma de todas as receitas do Planejamento
      const totalRevenue = revenue + plannedRevenue + otherRevenue + forecastRevenue;
      const totalEntry = totalRevenue;
      
      // Receitas Previstas (para exibição na coluna Rec.Prev.)
      const planningRevenue = plannedRevenue;

      // Despesas do Planejamento
      const expense = Number(p.expense) || 0;
      const plannedExpense = Number(p.planned_expense) || 0;
      const otherExpense = Number(p.other_expense) || 0;
      const forecastExpense = Number(p.forecast_expense) || 0;
      const distribution = Number(p.distribution) || 0;
      
      // Taxa da plataforma: 
      // - Passado: usa valor do banco
      // - Atual: calcula apenas sobre Forecast Rec. (igual ao Planejamento)
      // - Futuro: calcula sobre Total Entrada
      let platformFee: number;
      if (monthType === 'past') {
        platformFee = Number(p.platform_fee) || 0;
      } else if (monthType === 'current') {
        // Mês atual: taxa apenas sobre forecast de receitas (igual ao Planejamento)
        platformFee = forecastRevenue * (hublaFeePercentage / 100);
      } else {
        // Futuro: taxa sobre total de entrada projetada
        platformFee = totalEntry * (hublaFeePercentage / 100);
      }

      // Impostos
      const taxBreakdown = calculateTaxForMonth(monthDate, monthsDataForTax);
      const tax = monthType === 'future' ? taxBreakdown.total : (Number(p.tax) || 0);

      // Total de Despesas = Despesas Operacionais + Taxa da plataforma + Impostos
      const totalExpense = expense + plannedExpense + otherExpense + forecastExpense + platformFee + tax;

      // Líquido = Total Entrada - Taxa da plataforma
      const netEntry = totalEntry - platformFee;

      // Saldo Inicial - usar sempre initial_balance do Planejamento para o primeiro mês
      const initialBalance = index === 0 
        ? (Number(p.initial_balance) || 0)
        : previousFinalBalance;

      // ML% = (Total Receitas - Despesas) / Total Receitas
      // NÃO considera distribuição (igual ao Planejamento)
      const mlPercentage = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0;

      // Geração de Caixa = Total Receitas - Despesas - Distribuição
      const cashGeneration = totalRevenue - totalExpense - distribution;

      // Saldo Final (igual ao Planejamento)
      const finalBalance = initialBalance + cashGeneration;
      previousFinalBalance = finalBalance;

      // Receita efetivamente realizada (apenas do campo revenue do banco)
      // Para meses futuros, não há receita realizada
      const achievedRevenue = monthType === 'future' ? 0 : (Number(p.revenue) || 0);
      
      // Vendas manuais do mês (se preenchido)
      const salesAchieved = p.revenue_new_sales != null ? Number(p.revenue_new_sales) : undefined;

      return {
        month: p.month,
        monthLabel: format(parse(p.month, 'yyyy-MM-dd', new Date()), 'MMM', { locale: ptBR }),
        type: monthType,
        target,
        cashAmount,
        recurringAccumulated,
        recurringBreakdown,
        planningRevenue,
        totalEntry,
        netEntry,
        totalRevenue,
        totalExpenses: totalExpense, // Total despesas operacionais (igual ao Planejamento)
        cashGeneration,
        initialBalance,
        finalBalance,
        mlPercentage,
        achievedRevenue,
        salesAchieved, // Vendas manuais do mês
        revenueBreakdown: {
          revenue,
          plannedRevenue,
          otherRevenue,
          forecastRevenue,
        },
        expenseBreakdown: {
          expense,
          plannedExpense,
          otherExpense,
          forecastExpense,
          platformFee,
          tax,
          distribution,
        },
      };
    });
  }, [yearPlanning, customMonthlyTargets, defaultMonthlyTarget, hublaFeePercentage, previousYearFinalBalance, cashPercentage, recurringPercentage, recurringInstallments, monthsDataForTax]);

  const totals = useMemo(() => {
    if (!monthsData.length) return null;

    const totalTarget = monthsData.reduce((acc, m) => acc + m.target, 0);
    const totalCashAmount = monthsData.reduce((acc, m) => acc + m.cashAmount, 0);
    const totalRecurring = monthsData.reduce((acc, m) => acc + m.recurringAccumulated, 0);
    const totalPlanningRevenue = monthsData.reduce((acc, m) => acc + m.planningRevenue, 0);
    const totalEntry = monthsData.reduce((acc, m) => acc + m.totalEntry, 0);
    const totalNetEntry = monthsData.reduce((acc, m) => acc + m.netEntry, 0);
    const totalPlatformFee = monthsData.reduce((acc, m) => acc + m.expenseBreakdown.platformFee, 0);
    const totalRevenue = monthsData.reduce((acc, m) => acc + m.totalRevenue, 0);
    const totalExpenses = monthsData.reduce((acc, m) => acc + m.totalExpenses, 0);
    const cashGeneration = monthsData.reduce((acc, m) => acc + m.cashGeneration, 0);

    return {
      target: totalTarget,
      cashAmount: totalCashAmount,
      recurringAccumulated: totalRecurring,
      planningRevenue: totalPlanningRevenue,
      totalEntry,
      netEntry: totalNetEntry,
      platformFee: totalPlatformFee,
      totalRevenue,
      totalExpenses,
      cashGeneration,
      finalBalance: monthsData[monthsData.length - 1]?.finalBalance || 0,
      // Usar resultado operacional (sem distribuição) para alinhar com Planejamento
      mlPercentage: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
    };
  }, [monthsData]);

  // Estatísticas resumidas
  const summary = useMemo(() => {
    if (!monthsData.length) return null;

    const monthsAboveTarget = monthsData.filter(m => m.mlPercentage >= targetMLPercentage).length;
    const avgML = monthsData.reduce((acc, m) => acc + m.mlPercentage, 0) / monthsData.length;

    return {
      monthsAboveTarget,
      totalMonths: monthsData.length,
      avgML,
    };
  }, [monthsData, targetMLPercentage]);

  // Dados agrupados por trimestre
  const quarterlyData = useMemo(() => {
    const quarterConfig = [
      { id: 'Q1', label: '1° Trimestre', months: ['01', '02', '03'] },
      { id: 'Q2', label: '2° Trimestre', months: ['04', '05', '06'] },
      { id: 'Q3', label: '3° Trimestre', months: ['07', '08', '09'] },
      { id: 'Q4', label: '4° Trimestre', months: ['10', '11', '12'] },
    ];

    return quarterConfig.map(q => {
      const quarterMonths = monthsData.filter(m => 
        q.months.includes(m.month.split('-')[1])
      );
      
      if (!quarterMonths.length) return { ...q, months: [], totals: null };

      const totals = {
        target: quarterMonths.reduce((acc, m) => acc + m.target, 0),
        cashAmount: quarterMonths.reduce((acc, m) => acc + m.cashAmount, 0),
        recurringAccumulated: quarterMonths.reduce((acc, m) => acc + m.recurringAccumulated, 0),
        planningRevenue: quarterMonths.reduce((acc, m) => acc + m.planningRevenue, 0),
        totalEntry: quarterMonths.reduce((acc, m) => acc + m.totalEntry, 0),
        totalRevenue: quarterMonths.reduce((acc, m) => acc + m.totalRevenue, 0),
        totalExpenses: quarterMonths.reduce((acc, m) => acc + m.totalExpenses, 0),
        cashGeneration: quarterMonths.reduce((acc, m) => acc + m.cashGeneration, 0),
        finalBalance: quarterMonths[quarterMonths.length - 1]?.finalBalance || 0,
        mlPercentage: (() => {
          const totalRev = quarterMonths.reduce((acc, m) => acc + m.totalRevenue, 0);
          const totalGen = quarterMonths.reduce((acc, m) => acc + m.cashGeneration, 0);
          return totalRev > 0 ? (totalGen / totalRev) * 100 : 0;
        })(),
      };

      return {
        ...q,
        months: quarterMonths,
        totals,
      };
    });
  }, [monthsData]);

  // Handlers para edição inline
  const handleStartEdit = (month: string, currentValue: number) => {
    setEditingMonth(month);
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = (month: string) => {
    const numericValue = Number(editValue.replace(/\D/g, '')) || 0;
    onMonthlyTargetChange(month, numericValue);
    setEditingMonth(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, month: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(month);
    } else if (e.key === 'Escape') {
      setEditingMonth(null);
      setEditValue("");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Metas e Cenário Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!monthsData.length || annualTarget === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Metas e Cenário Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">Configure a Meta Anual para visualizar o cenário</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Card de Quanto Falta para a Meta */}
      <GoalGapCard 
        monthsData={monthsData} 
        selectedYear={selectedYear} 
        onSalesAchievedChange={canEdit ? onSalesAchievedChange : undefined}
        canEdit={canEdit}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Metas e Cenário Mensal - {selectedYear}
              </CardTitle>
              <CardDescription className="mt-1">
                Meta Anual: {formatCurrency(annualTarget)} | Taxa da plataforma: {hublaFeePercentage}% | ML Alvo: {targetMLPercentage}% | À Vista: {cashPercentage}%
              </CardDescription>
            </div>

            {/* Cards de resumo */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllQuarters}
                className="h-8"
              >
                <ChevronsUpDown className="w-4 h-4 mr-1" />
                {expandedQuarters.size === 4 ? "Recolher" : "Expandir"} Todos
              </Button>
              {summary && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {summary.monthsAboveTarget}/{summary.totalMonths} meses ≥ ML Alvo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      ML Médio: {summary.avgML.toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px] sticky left-0 bg-muted/50 z-10">Período</TableHead>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead className="text-right text-purple-500 min-w-[90px]">Meta</TableHead>
                  <TableHead className="text-right text-emerald-500 min-w-[70px]">À Vista</TableHead>
                  <TableHead className="text-right text-violet-500 min-w-[70px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          Recorr.
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p className="font-semibold">Receita Recorrente Acumulada</p>
                          <p className="text-muted-foreground mt-1">
                            Soma das parcelas recebidas no mês.
                            Vendas de Jan recebem 12 parcelas no ano,
                            Fev recebe 11, Mar recebe 10... 
                            Dez recebe apenas 1 parcela.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right text-blue-400 min-w-[70px]">Rec.Prev.</TableHead>
                  <TableHead className="text-right text-green-500 min-w-[80px]">Tot.Entrada</TableHead>
                  
                  <TableHead className="text-right text-red-500 min-w-[80px]">Despesas</TableHead>
                  <TableHead className="text-right text-cyan-500 min-w-[80px]">Ger.Caixa</TableHead>
                  <TableHead className="text-right text-blue-500 min-w-[80px]">Saldo</TableHead>
                  <TableHead className="text-right min-w-[100px]">ML%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarterlyData.map((quarter) => {
                  const isExpanded = expandedQuarters.has(quarter.id);
                  const qTotals = quarter.totals;
                  
                  if (!qTotals) return null;
                  
                  const qMlProgress = Math.min((qTotals.mlPercentage / targetMLPercentage) * 100, 100);
                  const qIsAboveTarget = qTotals.mlPercentage >= targetMLPercentage;

                  return (
                    <>
                      {/* Linha do Trimestre */}
                      <TableRow 
                        key={quarter.id}
                        className="bg-primary/10 font-semibold cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => toggleQuarter(quarter.id)}
                      >
                        <TableCell className="sticky left-0 bg-primary/10 z-10">
                          <div className="flex items-center gap-2">
                            <button className="p-0.5 hover:bg-muted rounded">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <span>{quarter.label}</span>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-purple-500 text-xs">
                          {formatCurrency(qTotals.target)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-500 text-xs">
                          {formatCurrency(qTotals.cashAmount)}
                        </TableCell>
                        <TableCell className="text-right text-violet-500 text-xs">
                          {formatCurrency(qTotals.recurringAccumulated)}
                        </TableCell>
                        <TableCell className="text-right text-blue-400 text-xs">
                          {formatCurrency(qTotals.planningRevenue)}
                        </TableCell>
                        <TableCell className="text-right text-green-500 text-xs">
                          {formatCurrency(qTotals.totalEntry)}
                        </TableCell>
                        <TableCell className="text-right text-red-500 text-xs">
                          {formatCurrency(qTotals.totalExpenses)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right text-xs",
                          qTotals.cashGeneration >= 0 ? "text-cyan-500" : "text-red-500"
                        )}>
                          {formatCurrency(qTotals.cashGeneration)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right text-xs",
                          qTotals.finalBalance >= 0 ? "text-blue-500" : "text-red-500"
                        )}>
                          {formatCurrency(qTotals.finalBalance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex items-center gap-1">
                              {qIsAboveTarget ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                              )}
                              <span className={cn(
                                "text-xs font-bold",
                                qIsAboveTarget ? "text-green-500" : "text-amber-500"
                              )}>
                                {qTotals.mlPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={qMlProgress} 
                              className={cn(
                                "h-1 w-16",
                                qIsAboveTarget ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"
                              )}
                            />
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Linhas dos Meses (condicionais) */}
                      {isExpanded && quarter.months.map((m) => {
                        const mlProgress = Math.min((m.mlPercentage / targetMLPercentage) * 100, 100);
                        const isAboveTarget = m.mlPercentage >= targetMLPercentage;
                        const isEditing = editingMonth === m.month;

                        return (
                          <TableRow 
                            key={m.month}
                            className={cn(
                              "bg-background",
                              m.type === 'current' && 'bg-primary/5',
                              m.type === 'future' && 'opacity-80',
                              isAboveTarget && 'bg-green-500/5'
                            )}
                          >
                            <TableCell className="font-medium sticky left-0 bg-background z-10 pl-8">
                              <span className="capitalize">{m.monthLabel}</span>
                              {m.type === 'current' && (
                                <span className="text-[10px] text-primary ml-1">(atual)</span>
                              )}
                            </TableCell>

                            {/* Botão de visualização detalhada */}
                            <TableCell className="px-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMonthDetail(m);
                                  setDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TableCell>
                            
                            {/* Meta - Editável (apenas se canEdit) */}
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {isEditing && canEdit ? (
                                <Input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleSaveEdit(m.month)}
                                  onKeyDown={(e) => handleKeyDown(e, m.month)}
                                  className="h-6 text-right text-xs font-bold p-1 w-20"
                                  autoFocus
                                />
                              ) : canEdit ? (
                                <button
                                  onClick={() => handleStartEdit(m.month, m.target)}
                                  className="text-purple-500 font-bold text-xs hover:bg-purple-500/10 px-1 py-0.5 rounded cursor-pointer"
                                >
                                  {formatCurrency(m.target)}
                                </button>
                              ) : (
                                <span className="text-purple-500 font-bold text-xs">
                                  {formatCurrency(m.target)}
                                </span>
                              )}
                            </TableCell>

                            {/* À Vista */}
                            <TableCell className="text-right text-emerald-500 text-xs">
                              {formatCurrency(m.cashAmount)}
                            </TableCell>

                            {/* Recorrente com Tooltip Detalhado */}
                            <TableCell className="text-right text-violet-500 text-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    {formatCurrency(m.recurringAccumulated)}
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs max-w-xs">
                                    <p className="font-semibold mb-1">Composição do Recorrente:</p>
                                    {m.recurringBreakdown.length > 0 ? (
                                      <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                        {m.recurringBreakdown.map((r, idx) => (
                                          <p key={idx} className="capitalize">
                                            Venda {r.monthLabel}: Parc. {r.installmentNumber}/{r.totalInstallments} = {formatCurrency(r.amount)}
                                          </p>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">Nenhuma parcela neste mês</p>
                                    )}
                                    <p className="font-semibold mt-2 pt-1 border-t">
                                      Total: {formatCurrency(m.recurringAccumulated)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>

                            {/* Plan. (receitas do planejamento) */}
                            <TableCell className="text-right text-blue-400 text-xs">
                              {formatCurrency(m.planningRevenue)}
                            </TableCell>

                            {/* Total Entrada */}
                            <TableCell className="text-right text-green-500 font-medium text-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    {formatCurrency(m.totalEntry)}
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    <div className="space-y-1">
                                      <p className="font-semibold">Composição da Entrada (Planejamento):</p>
                                      <p>Rec. Realizadas: {formatCurrency(m.revenueBreakdown.revenue)}</p>
                                      <p>Rec. Previstas: {formatCurrency(m.revenueBreakdown.plannedRevenue)}</p>
                                      <p>Outras Rec.: {formatCurrency(m.revenueBreakdown.otherRevenue)}</p>
                                      <p>Forecast Rec.: {formatCurrency(m.revenueBreakdown.forecastRevenue)}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>

                            
                            {/* Despesas com Tooltip */}
                            <TableCell className="text-right text-red-500 font-medium text-xs">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help">
                                    {formatCurrency(m.totalExpenses)}
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    <div className="space-y-1">
                                      <p className="font-semibold">Detalhamento Despesas:</p>
                                      <p>Desp. Realizadas: {formatCurrency(m.expenseBreakdown.expense)}</p>
                                      <p>Desp. Previstas: {formatCurrency(m.expenseBreakdown.plannedExpense)}</p>
                                      <p>Outras Despesas: {formatCurrency(m.expenseBreakdown.otherExpense)}</p>
                                      <p>Forecast Despesas: {formatCurrency(m.expenseBreakdown.forecastExpense)}</p>
                                      <p>Taxa da plataforma: {formatCurrency(m.expenseBreakdown.platformFee)}</p>
                                      <p>Impostos: {formatCurrency(m.expenseBreakdown.tax)}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            
                            <TableCell className={cn(
                              "text-right font-bold text-xs",
                              m.cashGeneration >= 0 ? "text-cyan-500" : "text-red-500"
                            )}>
                              {formatCurrency(m.cashGeneration)}
                            </TableCell>
                            
                            <TableCell className={cn(
                              "text-right font-medium text-xs",
                              m.finalBalance >= 0 ? "text-blue-500" : "text-red-500"
                            )}>
                              {formatCurrency(m.finalBalance)}
                            </TableCell>
                            
                            {/* ML% com barra de progresso */}
                            <TableCell className="text-right">
                              <div className="flex flex-col gap-1 items-end">
                                <div className="flex items-center gap-1">
                                  {isAboveTarget ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                  )}
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isAboveTarget ? "text-green-500" : "text-amber-500"
                                  )}>
                                    {m.mlPercentage.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={mlProgress} 
                                  className={cn(
                                    "h-1 w-16",
                                    isAboveTarget ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"
                                  )}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  );
                })}

                {/* Linha de Total */}
                {totals && (
                  <TableRow className="border-t-2 bg-muted/50 font-bold">
                    <TableCell className="sticky left-0 bg-muted/50 z-10">TOTAL ANUAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right text-purple-500 text-xs">
                      {formatCurrency(totals.target)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-500 text-xs">
                      {formatCurrency(totals.cashAmount)}
                    </TableCell>
                    <TableCell className="text-right text-violet-500 text-xs">
                      {formatCurrency(totals.recurringAccumulated)}
                    </TableCell>
                    <TableCell className="text-right text-blue-400 text-xs">
                      {formatCurrency(totals.planningRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-green-500 text-xs">
                      {formatCurrency(totals.totalEntry)}
                    </TableCell>
                    <TableCell className="text-right text-red-500 text-xs">
                      {formatCurrency(totals.totalExpenses)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right text-xs",
                      totals.cashGeneration >= 0 ? "text-cyan-500" : "text-red-500"
                    )}>
                      {formatCurrency(totals.cashGeneration)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right text-xs",
                      totals.finalBalance >= 0 ? "text-blue-500" : "text-red-500"
                    )}>
                      {formatCurrency(totals.finalBalance)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right",
                      totals.mlPercentage >= targetMLPercentage ? "text-green-500" : "text-amber-500"
                    )}>
                      <span className="text-xs font-bold">{totals.mlPercentage.toFixed(1)}%</span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Soma das Metas para conferência */}
          {totals && (
            <div className="mt-4 p-3 bg-purple-500/10 rounded-lg flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Soma das Metas:</span>
                  <span className="text-lg font-bold text-purple-500 ml-2">
                    {formatCurrency(totals.target)}
                  </span>
                </div>
                {annualTarget > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Meta Anual: {formatCurrency(annualTarget)}
                  </div>
                )}
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entrada Bruta: </span>
                  <span className="font-semibold">{formatCurrency(totals.totalEntry)}</span>
                </div>
                <div className="text-orange-500">
                  Taxa da plataforma: -{formatCurrency(totals.platformFee)}
                </div>
                <div className="text-teal-500 font-bold">
                  Líquido: {formatCurrency(totals.netEntry)}
                </div>
              </div>
            </div>
          )}

          {/* Dialog de detalhes do mês */}
          <MonthDetailDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            monthData={selectedMonthDetail}
            monthLabel={selectedMonthDetail 
              ? format(parse(selectedMonthDetail.month, 'yyyy-MM-dd', new Date()), 'MMMM yyyy', { locale: ptBR }) 
              : ''}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default ScenarioSimulatorTable;
