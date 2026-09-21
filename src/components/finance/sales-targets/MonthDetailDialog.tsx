import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Percent,
  CheckCircle2,
  Clock,
  Send,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/taxCalculations";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RevenueBreakdown {
  revenue: number;
  plannedRevenue: number;
  otherRevenue: number;
  forecastRevenue: number;
}

interface ExpenseBreakdown {
  expense: number;
  plannedExpense: number;
  otherExpense: number;
  forecastExpense: number;
  platformFee: number;
  tax: number;
  distribution: number;
}

interface MonthRowData {
  month: string;
  monthLabel: string;
  type: 'past' | 'current' | 'future';
  target: number;
  cashAmount: number;
  recurringAccumulated: number;
  planningRevenue: number;
  totalEntry: number;
  netEntry: number;
  totalRevenue: number;
  totalExpenses: number;
  cashGeneration: number;
  initialBalance: number;
  finalBalance: number;
  mlPercentage: number;
  revenueBreakdown: RevenueBreakdown;
  expenseBreakdown: ExpenseBreakdown;
}

interface MonthDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthData: MonthRowData | null;
  monthLabel: string;
}

const MetricCard = ({ 
  label, 
  value, 
  tooltipContent,
  icon: Icon,
  colorClass = "text-foreground",
  bgClass = "bg-muted/30"
}: { 
  label: string; 
  value: string; 
  tooltipContent?: React.ReactNode;
  icon?: React.ElementType;
  colorClass?: string;
  bgClass?: string;
}) => {
  const cardContent = (
    <Card className={cn("border-0 shadow-sm", tooltipContent && "cursor-help", bgClass)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className={cn("h-4 w-4", colorClass)} />}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={cn("text-lg font-bold", colorClass)}>{value}</p>
      </CardContent>
    </Card>
  );

  if (!tooltipContent) {
    return cardContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {cardContent}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};

export const MonthDetailDialog = ({
  open,
  onOpenChange,
  monthData,
  monthLabel,
}: MonthDetailDialogProps) => {
  const [isSendingReport, setIsSendingReport] = useState(false);

  const handleSendMonthlyReport = async () => {
    if (!monthData) return;
    
    setIsSendingReport(true);
    try {
      const { error } = await supabase.functions.invoke('discord-daily-report', {
        body: { 
          type: 'monthly',
          month: monthData.month 
        }
      });
      
      if (error) throw error;
      
      toast.success(`Relatório de ${monthLabel} enviado para Discord!`);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast.error('Erro ao enviar relatório para o Discord');
    } finally {
      setIsSendingReport(false);
    }
  };

  if (!monthData) return null;

  const { revenueBreakdown, expenseBreakdown } = monthData;

  // === REALIZADO (apenas campos preenchidos como "realizados" no Planejamento) ===
  const revenueRealizada = revenueBreakdown.revenue;
  const expenseRealizada = expenseBreakdown.expense;
  // Resultado Atual = Receitas Realizadas - Despesas Realizadas
  const resultadoAtual = revenueRealizada - expenseRealizada;

  // === PREVISTO (TOTAL de todas as receitas e despesas) ===
  const revenuePrevisto = revenueBreakdown.revenue 
    + revenueBreakdown.plannedRevenue 
    + revenueBreakdown.otherRevenue 
    + revenueBreakdown.forecastRevenue;
  const expensePrevista = expenseBreakdown.expense 
    + expenseBreakdown.plannedExpense 
    + expenseBreakdown.otherExpense 
    + expenseBreakdown.forecastExpense
    + expenseBreakdown.platformFee
    + expenseBreakdown.tax;
  const resultadoPrevisto = revenuePrevisto - expensePrevista;

  // === TOTAL ===
  const expenseTotal = monthData.totalExpenses;
  const cashGeneration = monthData.cashGeneration;
  const mlTotal = monthData.mlPercentage;

  const hasPrevistoData = revenuePrevisto > 0 || expensePrevista > 0 || expenseBreakdown.plannedExpense > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl capitalize">
              <Wallet className="h-5 w-5 text-primary" />
              Detalhes do Mês - {monthLabel}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSendMonthlyReport}
              disabled={isSendingReport}
            >
              {isSendingReport ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogTitle>
        </DialogHeader>

        <TooltipProvider>
          <div className="space-y-6 mt-4">
            {/* SEÇÃO REALIZADO */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <h3 className="text-sm font-semibold text-green-500">Realizado</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard 
                  label="Receita Realizada"
                  value={formatCurrency(revenueRealizada)}
                  tooltipContent="Campo 'Rec. Realizada' do Planejamento"
                  icon={DollarSign}
                  colorClass="text-green-500"
                  bgClass="bg-green-500/10"
                />
                <MetricCard 
                  label="Despesa Realizada"
                  value={formatCurrency(expenseRealizada)}
                  tooltipContent="Campo 'Desp. Realizadas' do Planejamento"
                  icon={TrendingDown}
                  colorClass="text-red-500"
                  bgClass="bg-red-500/10"
                />
                <MetricCard 
                  label="Resultado Atual"
                  value={formatCurrency(resultadoAtual)}
                  tooltipContent={
                    <div className="space-y-1">
                      <p className="font-medium">Fórmula:</p>
                      <p>Rec. Realizada - Desp. Realizada</p>
                      <div className="border-t pt-1 mt-1">
                        <p>{formatCurrency(revenueRealizada)} - {formatCurrency(expenseRealizada)}</p>
                      </div>
                    </div>
                  }
                  icon={TrendingUp}
                  colorClass={resultadoAtual >= 0 ? "text-blue-500" : "text-red-500"}
                  bgClass={resultadoAtual >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}
                />
              </div>
            </div>

            {/* SEÇÃO PREVISTO (condicional) */}
            {hasPrevistoData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-amber-500">
                    Previsto <span className="text-xs font-normal">(Total Receitas e Despesas)</span>
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard 
                    label="Receita Prevista"
                    value={formatCurrency(revenuePrevisto)}
                    tooltipContent={
                      <div className="space-y-1">
                        <p>Rec. Realizada: {formatCurrency(revenueBreakdown.revenue)}</p>
                        <p>Rec. Previstas: {formatCurrency(revenueBreakdown.plannedRevenue)}</p>
                        <p>Outras Rec.: {formatCurrency(revenueBreakdown.otherRevenue)}</p>
                        <p>Forecast Rec.: {formatCurrency(revenueBreakdown.forecastRevenue)}</p>
                      </div>
                    }
                    icon={DollarSign}
                    colorClass="text-amber-500"
                    bgClass="bg-amber-500/10"
                  />
                  <MetricCard 
                    label="Despesa Prevista"
                    value={formatCurrency(expensePrevista)}
                    tooltipContent={
                      <div className="space-y-1">
                        <p>Desp. Realizadas: {formatCurrency(expenseBreakdown.expense)}</p>
                        <p>Desp. Previstas: {formatCurrency(expenseBreakdown.plannedExpense)}</p>
                        <p>Outras Desp.: {formatCurrency(expenseBreakdown.otherExpense)}</p>
                        <p>Forecast Desp.: {formatCurrency(expenseBreakdown.forecastExpense)}</p>
                        <p>Taxa Hubla: {formatCurrency(expenseBreakdown.platformFee)}</p>
                        <p>Impostos: {formatCurrency(expenseBreakdown.tax)}</p>
                      </div>
                    }
                    icon={TrendingDown}
                    colorClass="text-orange-500"
                    bgClass="bg-orange-500/10"
                  />
                  <MetricCard 
                    label="Resultado Previsto"
                    value={formatCurrency(resultadoPrevisto)}
                    tooltipContent="Receita Prevista - Despesa Prevista"
                    icon={TrendingUp}
                    colorClass={resultadoPrevisto >= 0 ? "text-amber-500" : "text-red-500"}
                    bgClass={resultadoPrevisto >= 0 ? "bg-amber-500/10" : "bg-red-500/10"}
                  />
                </div>
              </div>
            )}

            {/* SEÇÃO TOTAL */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary">
                  Total {hasPrevistoData && "(Realizado + Previsto)"}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard 
                  label="Total Entrada"
                  value={formatCurrency(monthData.totalEntry)}
                  tooltipContent="Soma de todas as receitas do mês (realizadas + previstas + outras + forecast)"
                  icon={DollarSign}
                  colorClass="text-green-500"
                  bgClass="bg-green-500/10"
                />
                <MetricCard 
                  label="Total Despesas"
                  value={formatCurrency(expenseTotal)}
                  tooltipContent={
                    <div className="space-y-1">
                      <p>Despesas Operacionais: {formatCurrency(expenseBreakdown.expense + expenseBreakdown.plannedExpense + expenseBreakdown.otherExpense + expenseBreakdown.forecastExpense)}</p>
                      <p>Taxa Hubla: {formatCurrency(expenseBreakdown.platformFee)}</p>
                      <p>Impostos: {formatCurrency(expenseBreakdown.tax)}</p>
                      <p>Distribuição: {formatCurrency(expenseBreakdown.distribution)}</p>
                    </div>
                  }
                  icon={TrendingDown}
                  colorClass="text-red-500"
                  bgClass="bg-red-500/10"
                />
                <MetricCard 
                  label="Geração de Caixa"
                  value={formatCurrency(cashGeneration)}
                  tooltipContent="Total Receitas - Total Despesas (do Planejamento)"
                  icon={TrendingUp}
                  colorClass={cashGeneration >= 0 ? "text-cyan-500" : "text-red-500"}
                  bgClass={cashGeneration >= 0 ? "bg-cyan-500/10" : "bg-red-500/10"}
                />
                <MetricCard 
                  label="ML%"
                  value={`${mlTotal.toFixed(1)}%`}
                  tooltipContent="(Geração de Caixa / Total Receitas) × 100"
                  icon={Percent}
                  colorClass={mlTotal >= 0 ? "text-primary" : "text-red-500"}
                  bgClass="bg-primary/10"
                />
              </div>
            </div>

            {/* SALDO FINAL */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">Saldo Final do Mês</span>
                </div>
                <span className={cn(
                  "text-2xl font-bold",
                  monthData.finalBalance >= 0 ? "text-blue-500" : "text-red-500"
                )}>
                  {formatCurrency(monthData.finalBalance)}
                </span>
              </div>
              {monthData.initialBalance > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Saldo Inicial: {formatCurrency(monthData.initialBalance)} + Geração: {formatCurrency(cashGeneration)}
                </p>
              )}
            </div>

            {/* DETALHES DA META */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Meta do Mês</span>
                <span className="text-sm font-bold text-purple-500">
                  {formatCurrency(monthData.target)}
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>À Vista: {formatCurrency(monthData.cashAmount)}</span>
                <span>Recorrente: {formatCurrency(monthData.recurringAccumulated)}</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default MonthDetailDialog;
