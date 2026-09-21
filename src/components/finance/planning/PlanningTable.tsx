import { useMemo, useState } from "react";
import { format, parseISO, startOfMonth, isSameMonth, isBefore, isAfter, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlanningCell } from "./PlanningCell";
import { TaxTooltip } from "./TaxTooltip";
import { HublaFeeTooltip } from "./HublaFeeTooltip";
import { 
  calculateTaxForMonth, 
  getMonthType, 
  formatCurrency,
  formatMonthName,
  TaxBreakdown,
  MonthData,
} from "@/lib/taxCalculations";
import type { MonthlyPlanning, MonthlyPlanningInsert } from "@/types/financial";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, Pencil } from "lucide-react";

interface PlanningTableProps {
  months: string[];
  planningData: MonthlyPlanning[] | undefined;
  isLoading: boolean;
  onUpsert: (data: MonthlyPlanningInsert) => void;
  hublaFeePercentage: number;
  onHublaFeeChange?: (newValue: number) => void;
  isUpdatingHublaFee?: boolean;
}

interface RowData {
  month: string;
  monthDate: Date;
  monthType: 'past' | 'current' | 'future';
  data: MonthlyPlanning | null;
  initialBalance: number;
  revenue: number;               // Receitas Realizadas
  plannedRevenue: number;        // Receitas Previstas (editável)
  otherRevenue: number;          // Outras Receitas
  forecastRevenue: number;       // Forecast Receitas (da meta)
  expense: number;               // Desp. Realizadas
  plannedExpense: number;        // Desp. Previstas (editável)
  otherExpense: number;
  forecastExpense: number;
  platformFee: number;
  tax: number;
  taxBreakdown: TaxBreakdown;
  totalRevenue: number;
  totalExpense: number;
  resultado: number;
  distribution: number;
  saldoFinal: number;
  ml: number;
}

export function PlanningTable({ 
  months, 
  planningData, 
  isLoading, 
  onUpsert,
  hublaFeePercentage,
  onHublaFeeChange,
  isUpdatingHublaFee,
}: PlanningTableProps) {
  const [editHublaFee, setEditHublaFee] = useState<string>("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleOpenPopover = (open: boolean) => {
    if (open) {
      setEditHublaFee(hublaFeePercentage.toString());
    }
    setPopoverOpen(open);
  };

  const handleSaveHublaFee = () => {
    const value = parseFloat(editHublaFee);
    if (!isNaN(value) && value >= 0 && value <= 100 && onHublaFeeChange) {
      onHublaFeeChange(value);
      setPopoverOpen(false);
    }
  };
  const today = new Date();

  // Preparar dados dos meses para cálculo de impostos
  // Inclui meses anteriores necessários para cálculo de impostos mensais e trimestrais
  const monthsDataForTax: MonthData[] = useMemo(() => {
    const allMonthsSet = new Set(months);
    
    // Adicionar até 3 meses anteriores ao primeiro mês para cálculos de impostos
    if (months.length > 0) {
      const firstMonth = parseISO(months[0]);
      for (let i = 1; i <= 3; i++) {
        const prevMonth = format(subMonths(firstMonth, i), 'yyyy-MM-dd');
        allMonthsSet.add(prevMonth);
      }
    }
    
    return Array.from(allMonthsSet).map(monthStr => {
      const data = planningData?.find(p => p.month === monthStr);
      return {
        month: monthStr,
        revenue: Number(data?.revenue) || 0,
        planned_revenue: Number(data?.planned_revenue) || 0,
        other_revenue: Number(data?.other_revenue) || 0,
        forecast_revenue: Number(data?.forecast_revenue) || 0,
      };
    });
  }, [months, planningData]);

  // Calcular saldo final do mês anterior ao primeiro mês do período
  const previousMonthBalance = useMemo(() => {
    if (months.length === 0 || !planningData) return 0;
    
    const firstMonth = parseISO(months[0]);
    const prevMonth = format(subMonths(firstMonth, 1), 'yyyy-MM-dd');
    
    // Buscar dados do mês anterior no planningData
    const prevMonthData = planningData.find(p => p.month === prevMonth);
    
    if (prevMonthData) {
      // Calcular o saldo final do mês anterior
      const revenue = Number(prevMonthData.revenue) || 0;
      const otherRevenue = Number(prevMonthData.other_revenue) || 0;
      const forecastRevenue = Number(prevMonthData.forecast_revenue) || 0;
      const expense = Number(prevMonthData.expense) || 0;
      const otherExpense = Number(prevMonthData.other_expense) || 0;
      const forecastExpense = Number(prevMonthData.forecast_expense) || 0;
      const tax = Number(prevMonthData.tax) || 0;
      const distribution = Number(prevMonthData.distribution) || 0;
      const initialBalance = Number(prevMonthData.initial_balance) || 0;
      
      const totalRevenue = revenue + otherRevenue + forecastRevenue;
      const totalExpense = expense + otherExpense + forecastExpense;
      const platformFee = totalRevenue * (hublaFeePercentage / 100);
      
      return initialBalance + totalRevenue - totalExpense - platformFee - tax - distribution;
    }
    
    return 0;
  }, [months, planningData, hublaFeePercentage]);

  // Calcular dados de cada linha
  const rowsData: RowData[] = useMemo(() => {
    let previousSaldoFinal = 0;

    return months.map((monthStr, index) => {
      const monthDate = parseISO(monthStr);
      const monthType = getMonthType(monthDate);
      const data = planningData?.find(p => p.month === monthStr) || null;

      // Valores do banco ou zerados
      const revenue = Number(data?.revenue) || 0;
      const plannedRevenue = Number(data?.planned_revenue) || 0;
      const otherRevenue = Number(data?.other_revenue) || 0;
      const forecastRevenue = Number(data?.forecast_revenue) || 0;
      const expense = Number(data?.expense) || 0;
      const plannedExpense = Number(data?.planned_expense) || 0;
      const otherExpense = Number(data?.other_expense) || 0;
      const forecastExpense = Number(data?.forecast_expense) || 0;

      // Saldo inicial: primeiro mês busca do banco OU do mês anterior (para continuidade entre anos)
      const isFirstMonth = index === 0;
      const initialBalance = isFirstMonth 
        ? (Number(data?.initial_balance) || previousMonthBalance)
        : previousSaldoFinal;

      // Totais - inclui todas as receitas e despesas
      const totalRevenue = revenue + plannedRevenue + otherRevenue + forecastRevenue;
      const totalExpense = expense + plannedExpense + otherExpense + forecastExpense;

      // Taxa da plataforma Hubla:
      // - Passado: usa valor do banco (já processado)
      // - Atual: calcula sobre Rec. Previstas + Forecast Rec. (receitas ainda não realizadas)
      // - Futuro: calcula sobre receita total projetada
      let platformFee: number;
      if (monthType === 'past') {
        platformFee = Number(data?.platform_fee) || 0;
} else if (monthType === 'current') {
      // Mês atual: taxa apenas sobre forecast de receitas
      platformFee = forecastRevenue * (hublaFeePercentage / 100);
      } else {
        // Futuro: taxa sobre receita total projetada
        platformFee = totalRevenue * (hublaFeePercentage / 100);
      }

      // Impostos: calculado para futuro, do banco para passado/atual
      const taxBreakdown = calculateTaxForMonth(monthDate, monthsDataForTax);
      let tax: number;
      
      if (monthType === 'future') {
        tax = taxBreakdown.total;
      } else {
        tax = Number(data?.tax) || 0;
      }

      // Resultado (antes da distribuição) - inclui taxa da plataforma como despesa
      const resultado = totalRevenue - totalExpense - platformFee - tax;

      // Distribuição: sempre do banco, preenchido manualmente
      const distribution = Number(data?.distribution) || 0;

      // Saldo Final - inclui taxa da plataforma
      const saldoFinal = initialBalance + totalRevenue - totalExpense - platformFee - tax - distribution;

      // Margem Líquida - NÃO considera distribuição (apenas receitas vs despesas operacionais)
      const ml = totalRevenue > 0 ? (resultado / totalRevenue) * 100 : 0;

      // Guardar para próxima iteração
      previousSaldoFinal = saldoFinal;

      return {
        month: monthStr,
        monthDate,
        monthType,
        data,
        initialBalance,
        revenue,
        plannedRevenue,
        otherRevenue,
        forecastRevenue,
        expense,
        plannedExpense,
        otherExpense,
        forecastExpense,
        platformFee,
        tax,
        taxBreakdown,
        totalRevenue,
        totalExpense,
        resultado,
        distribution,
        saldoFinal,
        ml,
      };
    });
  }, [months, planningData, monthsDataForTax, previousMonthBalance, hublaFeePercentage]);

  // Calcular totais
  const totals = useMemo(() => {
    return rowsData.reduce((acc, row) => ({
      revenue: acc.revenue + row.revenue,
      plannedRevenue: acc.plannedRevenue + row.plannedRevenue,
      otherRevenue: acc.otherRevenue + row.otherRevenue,
      forecastRevenue: acc.forecastRevenue + row.forecastRevenue,
      expense: acc.expense + row.expense,
      plannedExpense: acc.plannedExpense + row.plannedExpense,
      otherExpense: acc.otherExpense + row.otherExpense,
      forecastExpense: acc.forecastExpense + row.forecastExpense,
      platformFee: acc.platformFee + row.platformFee,
      tax: acc.tax + row.tax,
      totalRevenue: acc.totalRevenue + row.totalRevenue,
      totalExpense: acc.totalExpense + row.totalExpense,
      resultado: acc.resultado + row.resultado,
      distribution: acc.distribution + row.distribution,
    }), {
      revenue: 0,
      plannedRevenue: 0,
      otherRevenue: 0,
      forecastRevenue: 0,
      expense: 0,
      plannedExpense: 0,
      otherExpense: 0,
      forecastExpense: 0,
      platformFee: 0,
      tax: 0,
      totalRevenue: 0,
      totalExpense: 0,
      resultado: 0,
      distribution: 0,
    });
  }, [rowsData]);

  // ML% médio ponderado
  const avgML = totals.totalRevenue > 0 
    ? (totals.resultado / totals.totalRevenue) * 100 
    : 0;

  // Saldo final do último mês
  const lastSaldoFinal = rowsData.length > 0 ? rowsData[rowsData.length - 1].saldoFinal : 0;

  // Handler para salvar célula
  const handleCellSave = (monthStr: string, field: string, value: number) => {
    const existingData = planningData?.find(p => p.month === monthStr);
    
    const upsertData: MonthlyPlanningInsert = {
      month: monthStr,
      revenue: existingData?.revenue ?? 0,
      other_revenue: existingData?.other_revenue ?? 0,
      forecast_revenue: existingData?.forecast_revenue ?? 0,
      expense: existingData?.expense ?? 0,
      other_expense: existingData?.other_expense ?? 0,
      forecast_expense: existingData?.forecast_expense ?? 0,
      tax: existingData?.tax ?? 0,
      distribution: existingData?.distribution ?? 0,
      initial_balance: existingData?.initial_balance ?? 0,
      notes: existingData?.notes ?? null,
      [field]: value,
    };

    onUpsert(upsertData);
  };

  // Verificar editabilidade
  const isFieldEditable = (field: string, row: RowData, rowIndex: number): boolean => {
    const { monthType } = row;

    // Saldo inicial só editável no primeiro mês
    if (field === 'initial_balance') {
      return rowIndex === 0;
    }

    // Campos sempre editáveis
    if (['revenue', 'planned_revenue', 'other_revenue', 'expense', 'planned_expense', 'other_expense'].includes(field)) {
      return true;
    }

    // Forecast Despesas sempre editável para preenchimento manual
    if (field === 'forecast_expense') {
      return true;
    }
    // Forecast Receitas só editável em meses passados/atuais
    if (field === 'forecast_revenue') {
      return monthType !== 'future';
    }

    // Distribuição sempre editável
    if (field === 'distribution') {
      return true;
    }

    // Impostos e Taxa Hubla: editáveis passado/atual, bloqueados futuro
    if (['tax', 'platform_fee'].includes(field)) {
      return monthType !== 'future';
    }

    return false;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Planejamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5" />
          Planejamento Mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 bg-muted/50 min-w-[100px]">Mês</TableHead>
                <TableHead className="text-right text-blue-500 min-w-[100px]">Saldo Caixa</TableHead>
                <TableHead className="text-right text-green-500 min-w-[100px]">Rec. Realizada</TableHead>
                <TableHead className="text-right text-teal-500 min-w-[100px]">Rec. Previstas</TableHead>
                <TableHead className="text-right text-emerald-400 min-w-[90px]">Outras Rec.</TableHead>
                <TableHead className="text-right text-lime-500 min-w-[90px]">Forecast Rec.</TableHead>
                <TableHead className="text-right text-red-500 min-w-[100px]">Desp. Realizadas</TableHead>
                <TableHead className="text-right text-rose-500 min-w-[100px]">Desp. Previstas</TableHead>
                <TableHead className="text-right text-rose-400 min-w-[90px]">Outras Desp.</TableHead>
                <TableHead className="text-right text-orange-500 min-w-[90px]">Forecast Desp.</TableHead>
                <TableHead className="text-right text-fuchsia-500 min-w-[90px]">
                  <Popover open={popoverOpen} onOpenChange={handleOpenPopover}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-fuchsia-400 transition-colors cursor-pointer ml-auto">
                        <HublaFeeTooltip showIcon feePercentage={hublaFeePercentage}>
                          Taxa Hubla ({hublaFeePercentage}%)
                        </HublaFeeTooltip>
                        <Pencil className="h-3 w-3 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm">Editar Taxa Hubla</h4>
                          <p className="text-xs text-muted-foreground">
                            Percentual aplicado sobre a receita bruta
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editHublaFee}
                            onChange={(e) => setEditHublaFee(e.target.value)}
                            min={0}
                            max={100}
                            step={0.1}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <Button 
                          onClick={handleSaveHublaFee}
                          disabled={isUpdatingHublaFee || !onHublaFeeChange}
                          size="sm"
                          className="w-full"
                        >
                          {isUpdatingHublaFee ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableHead>
                <TableHead className="text-right text-amber-500 min-w-[90px]">Impostos</TableHead>
                <TableHead className="text-right text-violet-500 min-w-[90px]">Resultado</TableHead>
                <TableHead className="text-right text-primary min-w-[90px]">Distribuição</TableHead>
                <TableHead className="text-right text-blue-500 min-w-[100px]">Saldo Final</TableHead>
                <TableHead className="text-right text-pink-500 min-w-[70px]">ML %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowsData.map((row, index) => (
                <TableRow 
                  key={row.month}
                  className={cn(
                    row.monthType === 'current' && "bg-primary/5",
                    row.monthType === 'future' && "opacity-80"
                  )}
                >
                  {/* Mês */}
                  <TableCell className="sticky left-0 bg-background font-medium">
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{formatMonthName(row.month)}</span>
                      <span className={cn(
                        "text-[10px] px-1 rounded",
                        row.monthType === 'past' && "bg-muted text-muted-foreground",
                        row.monthType === 'current' && "bg-primary/20 text-primary",
                        row.monthType === 'future' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {row.monthType === 'past' ? 'real' : row.monthType === 'current' ? 'atual' : 'prev'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Saldo de Caixa */}
                  <TableCell>
                    <PlanningCell
                      value={row.initialBalance}
                      field="initial_balance"
                      monthStr={row.month}
                      isEditable={isFieldEditable('initial_balance', row, index)}
                      colorClass="text-blue-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Receitas Realizadas */}
                  <TableCell>
                    <PlanningCell
                      value={row.revenue}
                      field="revenue"
                      monthStr={row.month}
                      isEditable={isFieldEditable('revenue', row, index)}
                      colorClass="text-green-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Receitas Previstas (editável) */}
                  <TableCell>
                    <PlanningCell
                      value={row.plannedRevenue}
                      field="planned_revenue"
                      monthStr={row.month}
                      isEditable={isFieldEditable('planned_revenue', row, index)}
                      colorClass="text-teal-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Outras Receitas */}
                  <TableCell>
                    <PlanningCell
                      value={row.otherRevenue}
                      field="other_revenue"
                      monthStr={row.month}
                      isEditable={isFieldEditable('other_revenue', row, index)}
                      colorClass="text-emerald-400"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Forecast Receitas */}
                  <TableCell>
                    <PlanningCell
                      value={row.forecastRevenue}
                      field="forecast_revenue"
                      monthStr={row.month}
                      isEditable={isFieldEditable('forecast_revenue', row, index)}
                      isLocked={row.monthType === 'future'}
                      colorClass="text-lime-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Desp. Realizadas */}
                  <TableCell>
                    <PlanningCell
                      value={row.expense}
                      field="expense"
                      monthStr={row.month}
                      isEditable={isFieldEditable('expense', row, index)}
                      colorClass="text-red-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Desp. Previstas */}
                  <TableCell>
                    <PlanningCell
                      value={row.plannedExpense}
                      field="planned_expense"
                      monthStr={row.month}
                      isEditable={isFieldEditable('planned_expense', row, index)}
                      colorClass="text-rose-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Outras Despesas */}
                  <TableCell>
                    <PlanningCell
                      value={row.otherExpense}
                      field="other_expense"
                      monthStr={row.month}
                      isEditable={isFieldEditable('other_expense', row, index)}
                      colorClass="text-rose-400"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Forecast Despesas */}
                  <TableCell>
                    <PlanningCell
                      value={row.forecastExpense}
                      field="forecast_expense"
                      monthStr={row.month}
                      isEditable={isFieldEditable('forecast_expense', row, index)}
                      colorClass="text-orange-500"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Taxa Plataforma (Hubla) */}
                  <TableCell>
                    <HublaFeeTooltip
                      feePercentage={hublaFeePercentage}
                      monthDate={row.monthDate}
                      monthType={row.monthType}
                      totalRevenue={row.totalRevenue}
                      platformFee={row.platformFee}
                    >
                      <PlanningCell
                        value={row.platformFee}
                        field="platform_fee"
                        monthStr={row.month}
                        isEditable={isFieldEditable('platform_fee', row, index)}
                        isLocked={row.monthType === 'future'}
                        colorClass="text-fuchsia-500"
                        onSave={(field, value) => handleCellSave(row.month, field, value)}
                      />
                    </HublaFeeTooltip>
                  </TableCell>

                  {/* Impostos */}
                  <TableCell>
                    <TaxTooltip breakdown={row.taxBreakdown} monthDate={row.monthDate}>
                      <PlanningCell
                        value={row.tax}
                        field="tax"
                        monthStr={row.month}
                        isEditable={isFieldEditable('tax', row, index)}
                        isLocked={row.monthType === 'future'}
                        colorClass="text-amber-500"
                        onSave={(field, value) => handleCellSave(row.month, field, value)}
                      />
                    </TaxTooltip>
                  </TableCell>

                  {/* Resultado */}
                  <TableCell>
                    <div className={cn(
                      "text-right text-xs font-medium",
                      row.resultado >= 0 ? "text-violet-500" : "text-red-500"
                    )}>
                      {formatCurrency(row.resultado)}
                    </div>
                  </TableCell>

                  {/* Distribuição */}
                  <TableCell>
                    <PlanningCell
                      value={row.distribution}
                      field="distribution"
                      monthStr={row.month}
                      isEditable={isFieldEditable('distribution', row, index)}
                      colorClass="text-primary"
                      onSave={(field, value) => handleCellSave(row.month, field, value)}
                    />
                  </TableCell>

                  {/* Saldo Final */}
                  <TableCell>
                    <div className={cn(
                      "text-right text-xs font-semibold",
                      row.saldoFinal >= 0 ? "text-blue-500" : "text-red-500"
                    )}>
                      {formatCurrency(row.saldoFinal)}
                    </div>
                  </TableCell>

                  {/* ML % */}
                  <TableCell>
                    <div className={cn(
                      "text-right text-xs font-medium",
                      row.ml >= 15 ? "text-pink-500" : row.ml >= 0 ? "text-amber-500" : "text-red-500"
                    )}>
                      {row.ml.toFixed(1)}%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha de Total */}
              <TableRow className="bg-muted/80 font-semibold border-t-2">
                <TableCell className="sticky left-0 bg-muted/80 font-bold">
                  TOTAL
                </TableCell>
                <TableCell className="text-right text-blue-500 text-xs">—</TableCell>
                <TableCell className="text-right text-green-500 text-xs font-semibold">
                  {formatCurrency(totals.revenue)}
                </TableCell>
                <TableCell className="text-right text-teal-500 text-xs font-semibold">
                  {formatCurrency(totals.plannedRevenue)}
                </TableCell>
                <TableCell className="text-right text-emerald-400 text-xs font-semibold">
                  {formatCurrency(totals.otherRevenue)}
                </TableCell>
                <TableCell className="text-right text-lime-500 text-xs font-semibold">
                  {formatCurrency(totals.forecastRevenue)}
                </TableCell>
                <TableCell className="text-right text-red-500 text-xs font-semibold">
                  {formatCurrency(totals.expense)}
                </TableCell>
                <TableCell className="text-right text-rose-500 text-xs font-semibold">
                  {formatCurrency(totals.plannedExpense)}
                </TableCell>
                <TableCell className="text-right text-rose-400 text-xs font-semibold">
                  {formatCurrency(totals.otherExpense)}
                </TableCell>
                <TableCell className="text-right text-orange-500 text-xs font-semibold">
                  {formatCurrency(totals.forecastExpense)}
                </TableCell>
                <TableCell className="text-right text-fuchsia-500 text-xs font-semibold">
                  {formatCurrency(totals.platformFee)}
                </TableCell>
                <TableCell className="text-right text-amber-500 text-xs font-semibold">
                  {formatCurrency(totals.tax)}
                </TableCell>
                <TableCell className={cn(
                  "text-right text-xs font-semibold",
                  totals.resultado >= 0 ? "text-violet-500" : "text-red-500"
                )}>
                  {formatCurrency(totals.resultado)}
                </TableCell>
                <TableCell className="text-right text-primary text-xs font-semibold">
                  {formatCurrency(totals.distribution)}
                </TableCell>
                <TableCell className={cn(
                  "text-right text-xs font-semibold",
                  lastSaldoFinal >= 0 ? "text-blue-500" : "text-red-500"
                )}>
                  {formatCurrency(lastSaldoFinal)}
                </TableCell>
                <TableCell className={cn(
                  "text-right text-xs font-semibold",
                  avgML >= 15 ? "text-pink-500" : avgML >= 0 ? "text-amber-500" : "text-red-500"
                )}>
                  {avgML.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
