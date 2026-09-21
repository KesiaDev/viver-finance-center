import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { format, parse, startOfMonth, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { calculateTaxForMonth, MonthData as TaxMonthData } from "@/lib/taxCalculations";

const PLATFORM_FEE_PERCENTAGE = 5.79;
interface MonthData {
  month: string;
  monthIndex: number;
  initialBalance: number;
  target: number;
  revenue: number;
  expense: number;
  cashGeneration: number;
  finalBalance: number;
  mlPercentage: number;
  type: 'past' | 'current' | 'future';
}

interface MonthlyPlanningData {
  month: string;
  revenue?: number | null;
  planned_revenue?: number | null;
  other_revenue?: number | null;
  forecast_revenue?: number | null;
  expense?: number | null;
  other_expense?: number | null;
  forecast_expense?: number | null;
  tax?: number | null;
  distribution?: number | null;
  initial_balance?: number | null;
  platform_fee?: number | null;
}

interface MonthlyTrackingTableProps {
  yearPlanning: MonthlyPlanningData[];
  previousYearPlanning?: MonthlyPlanningData[]; // Dados do ano anterior para cálculo de impostos
  targetMLPercentage: number;
  previousYearFinalBalance?: number;
  isLoading?: boolean;
  defaultMonthlyTarget?: number;
  cashPercentage?: number;
  recurringInstallments?: number;
  monthlyTargets?: Record<string, number>;
  onMonthlyTargetChange?: (month: string, value: number) => void;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 0 
  }).format(value);
};

const getMonthType = (monthStr: string): 'past' | 'current' | 'future' => {
  const monthDate = startOfMonth(parse(monthStr, 'yyyy-MM-dd', new Date()));
  const currentMonthStart = startOfMonth(new Date());
  
  if (isBefore(monthDate, currentMonthStart)) return 'past';
  if (monthDate.getTime() === currentMonthStart.getTime()) return 'current';
  return 'future';
};

export const MonthlyTrackingTable = ({ 
  yearPlanning, 
  previousYearPlanning,
  targetMLPercentage,
  previousYearFinalBalance = 0,
  isLoading,
  defaultMonthlyTarget = 0,
  cashPercentage = 30,
  recurringInstallments = 12,
  monthlyTargets = {},
  onMonthlyTargetChange
}: MonthlyTrackingTableProps) => {
  const monthsData: MonthData[] = useMemo(() => {
    if (!yearPlanning.length) return [];

    const sortedData = [...yearPlanning].sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    // Preparar dados para cálculo de impostos (combinar ano anterior + ano atual)
    // Isso garante que Janeiro tenha acesso aos dados de Dezembro do ano anterior
    const allMonthsForTax: TaxMonthData[] = [
      // Dados do ano anterior (se disponível)
      ...(previousYearPlanning || []).map(p => ({
        month: p.month,
        revenue: Number(p.revenue) || 0,
        planned_revenue: Number(p.planned_revenue) || 0,
        other_revenue: Number(p.other_revenue) || 0,
        forecast_revenue: Number(p.forecast_revenue) || 0,
      })),
      // Dados do ano atual
      ...sortedData.map(p => ({
        month: p.month,
        revenue: Number(p.revenue) || 0,
        planned_revenue: Number(p.planned_revenue) || 0,
        other_revenue: Number(p.other_revenue) || 0,
        forecast_revenue: Number(p.forecast_revenue) || 0,
      })),
    ];

    let previousFinalBalance = previousYearFinalBalance;

    return sortedData.map((p, index) => {
      const monthIndex = index + 1; // 1-12
      const monthType = getMonthType(p.month);

      // Meta do mês: usar meta personalizada se existir, senão usar padrão
      const target = monthlyTargets[p.month] ?? defaultMonthlyTarget;

      // Receita Mês (projetada com acumulação de recorrentes)
      // Fórmula correta: À Vista do mês + soma das parcelas recorrentes de meses anteriores
      const recurringPercentage = 100 - cashPercentage;
      const cashRevenue = target * (cashPercentage / 100);
      
      // Calcular recorrente acumulado corretamente (como em MetasVendas.tsx)
      let recurringAccumulated = 0;
      for (let i = 0; i <= index; i++) {
        const prevMonthKey = sortedData[i].month;
        const prevTarget = monthlyTargets[prevMonthKey] ?? defaultMonthlyTarget;
        const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
        const prevInstallment = prevRecurringAmount / recurringInstallments;
        const installmentNumber = index - i + 1;
        // Só acumula se ainda está dentro do período de parcelas
        if (installmentNumber <= recurringInstallments) {
          recurringAccumulated += prevInstallment;
        }
      }
      const projectedRevenue = cashRevenue + recurringAccumulated;

      // Receitas base do planejamento (sem forecast, que já está representado na projeção)
      const basePlanningRevenue = (Number(p.revenue) || 0) + (Number(p.planned_revenue) || 0) + (Number(p.other_revenue) || 0);
      
      // Receitas completas do planejamento (para meses passados/atual - valores reais)
      const realPlanningRevenue = basePlanningRevenue + (Number(p.forecast_revenue) || 0);
      
      // Para meses futuros: projeção (À Vista + Rec.) + receitas base do planejamento
      // Para meses passados/atual: valores reais do planejamento
      const totalRevenue = monthType === 'future' 
        ? projectedRevenue + basePlanningRevenue 
        : realPlanningRevenue;
      
      // Despesas base (expense + other_expense + forecast_expense)
      const baseExpense = (Number(p.expense) || 0) + 
                         (Number(p.other_expense) || 0) + 
                         (Number(p.forecast_expense) || 0);
      
      // Para meses futuros: calcular Taxa Hubla, Impostos e Distribuição baseado na receita TOTAL do planejamento
      // (mesma lógica do PlanningTable - incluindo forecast_revenue)
      let platformFee: number;
      let tax: number;
      let distribution: number;
      
      // Receita TOTAL do planejamento (incluindo forecast_revenue) - igual ao PlanningTable
      const totalPlanningRevenue = basePlanningRevenue + (Number(p.forecast_revenue) || 0);
      
      if (monthType === 'future') {
        // Taxa Hubla = 5.79% da receita TOTAL do planejamento (incluindo forecast)
        platformFee = totalPlanningRevenue * (PLATFORM_FEE_PERCENTAGE / 100);
        
        // Calcular impostos baseado na receita do planejamento
        const monthDate = parse(p.month, 'yyyy-MM-dd', new Date());
        const taxBreakdown = calculateTaxForMonth(monthDate, allMonthsForTax);
        tax = taxBreakdown.total;
        
        // Distribuição: SEMPRE do banco de dados, igual ao PlanningTable
        distribution = Number(p.distribution) || 0;
      } else {
        // Para meses passados/atual: usar valores do banco
        platformFee = Number(p.platform_fee) || 0;
        tax = Number(p.tax) || 0;
        distribution = Number(p.distribution) || 0;
      }
      
      // Despesa para ML = base + Taxa Hubla + Impostos (SEM distribuição)
      const totalExpenseForML = baseExpense + platformFee + tax;
      
      // Geração de Caixa para ML = Receitas - Despesas Operacionais
      const cashGenerationForML = totalRevenue - totalExpenseForML;
      
      // ML% = (Geração de Caixa / Receitas Totais) × 100 - NÃO considera distribuição
      const mlPercentage = totalRevenue > 0 ? (cashGenerationForML / totalRevenue) * 100 : 0;
      
      // Saldo Inicial: primeiro mês usa saldo final do ano anterior
      const initialBalance = index === 0 
        ? (previousYearFinalBalance > 0 ? previousYearFinalBalance : (Number(p.initial_balance) || 0))
        : previousFinalBalance;
      
      // Geração de Caixa Real = Receitas - Despesas - Distribuição (para saldo)
      const cashGeneration = totalRevenue - totalExpenseForML - distribution;
      
      // Saldo Final = Saldo Inicial + Geração de Caixa Real
      const finalBalance = initialBalance + cashGeneration;

      // Atualizar saldo final para próximo mês
      previousFinalBalance = finalBalance;

      return {
        month: p.month,
        monthIndex,
        initialBalance,
        target,
        revenue: totalRevenue,
        expense: totalExpenseForML + distribution, // Total despesa para exibição
        cashGeneration,
        finalBalance,
        mlPercentage,
        type: monthType,
      };
    });
  }, [yearPlanning, previousYearFinalBalance, defaultMonthlyTarget, cashPercentage, recurringInstallments, monthlyTargets]);

  const totals = useMemo(() => {
    if (!monthsData.length) return null;
    
    const totalTarget = monthsData.reduce((acc, m) => acc + m.target, 0);
    const totalRevenue = monthsData.reduce((acc, m) => acc + m.revenue, 0);
    const totalExpense = monthsData.reduce((acc, m) => acc + m.expense, 0);
    const totalCashGeneration = monthsData.reduce((acc, m) => acc + m.cashGeneration, 0);
    const initialBalance = monthsData[0]?.initialBalance || 0;
    const finalBalance = monthsData[monthsData.length - 1]?.finalBalance || 0;
    const mlPercentage = totalRevenue > 0 ? (totalCashGeneration / totalRevenue) * 100 : 0;
    
    return {
      target: totalTarget,
      revenue: totalRevenue,
      expense: totalExpense,
      cashGeneration: totalCashGeneration,
      initialBalance,
      finalBalance,
      mlPercentage,
    };
  }, [monthsData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Acompanhamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!monthsData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Acompanhamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado de planejamento encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Acompanhamento Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Mês</TableHead>
                <TableHead className="text-right text-blue-500">Saldo Ini.</TableHead>
                <TableHead className="text-right text-green-500">Receitas</TableHead>
                <TableHead className="text-right text-red-500">Despesas</TableHead>
                <TableHead className="text-right text-cyan-500">Ger. Caixa</TableHead>
                <TableHead className="text-right text-blue-500">Saldo Fin.</TableHead>
                <TableHead className="text-right text-amber-500">ML%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthsData.map((m) => (
                <TableRow 
                  key={m.month}
                  className={cn(
                    m.type === 'current' && 'bg-primary/5',
                    m.type === 'future' && 'opacity-70'
                  )}
                >
                  <TableCell className="font-medium">
                    {format(parse(m.month, 'yyyy-MM-dd', new Date()), 'MMM', { locale: ptBR })}
                    {m.type === 'current' && (
                      <span className="text-xs text-primary ml-1">(atual)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-blue-500 font-medium">
                    {formatCurrency(m.initialBalance)}
                  </TableCell>
                  <TableCell className="text-right text-green-500 font-medium">
                    {formatCurrency(m.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-red-500 font-medium">
                    {formatCurrency(m.expense)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    m.cashGeneration >= 0 ? "text-cyan-500" : "text-red-500"
                  )}>
                    {formatCurrency(m.cashGeneration)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    m.finalBalance >= 0 ? "text-blue-500" : "text-red-500"
                  )}>
                    {formatCurrency(m.finalBalance)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    m.mlPercentage >= targetMLPercentage ? "text-green-500" : "text-amber-500"
                  )}>
                    {m.mlPercentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              {totals && (
                <TableRow className="border-t-2 bg-muted/50 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right text-blue-500">
                    {formatCurrency(totals.initialBalance)}
                  </TableCell>
                  <TableCell className="text-right text-green-500">
                    {formatCurrency(totals.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-red-500">
                    {formatCurrency(totals.expense)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    totals.cashGeneration >= 0 ? "text-cyan-500" : "text-red-500"
                  )}>
                    {formatCurrency(totals.cashGeneration)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    totals.finalBalance >= 0 ? "text-blue-500" : "text-red-500"
                  )}>
                    {formatCurrency(totals.finalBalance)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right",
                    totals.mlPercentage >= targetMLPercentage ? "text-green-500" : "text-amber-500"
                  )}>
                    {totals.mlPercentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTrackingTable;
