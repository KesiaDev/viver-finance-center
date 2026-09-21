import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Target, DollarSign } from "lucide-react";
import type { QuarterData } from "@/hooks/useBonusCalculator";
import { formatCurrency } from "@/lib/taxCalculations";
import { cn } from "@/lib/utils";
interface QuarterlyMLCardProps {
  quarter: QuarterData;
  mlTarget: number;
}

const getStatusIcon = (quarter: QuarterData) => {
  if (quarter.isComplete) {
    return quarter.ml >= 30 ? (
      <CheckCircle2 className="w-4 h-4 text-success" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-warning" />
    );
  }
  if (quarter.isCurrent) {
    return <Clock className="w-4 h-4 text-primary animate-pulse" />;
  }
  return <Clock className="w-4 h-4 text-muted-foreground" />;
};

const getStatusText = (quarter: QuarterData) => {
  if (quarter.isComplete) return "Fechado";
  if (quarter.isCurrent) return "Em andamento";
  return "Futuro";
};

const getMLColor = (ml: number, target: number) => {
  if (ml >= target) return "text-success";
  if (ml >= target * 0.7) return "text-warning";
  return "text-destructive";
};

const QuarterlyMLCard = ({ quarter, mlTarget }: QuarterlyMLCardProps) => {
  const progressReal = Math.min((quarter.ml / mlTarget) * 100, 100);
  const progressCenario = Math.min((quarter.mlCenario / mlTarget) * 100, 100);
  const hasCenario = quarter.mlCenario > 0 && quarter.mlCenario !== quarter.ml;

  // Trend indicator based on cenário vs real
  const trend = quarter.mlCenario - quarter.ml;

  return (
    <TooltipProvider>
      <Card className={quarter.isCurrent ? "border-primary/50 bg-primary/5" : ""}>
        <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Q{quarter.quarter}</span>
            {getStatusIcon(quarter)}
          </div>
          <Badge
            variant="outline"
            className={
              quarter.isComplete
                ? quarter.ml >= mlTarget
                  ? "border-success text-success"
                  : "border-warning text-warning"
                : quarter.isCurrent
                ? "border-primary text-primary"
                : "border-muted-foreground text-muted-foreground"
            }
          >
            {getStatusText(quarter)}
          </Badge>
        </div>

        {/* ML Values */}
        <div className="space-y-3">
          {/* Realizado */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Realizado</span>
              <span className={`font-bold ${getMLColor(quarter.ml, mlTarget)}`}>
                {quarter.ml.toFixed(1)}%
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Progress value={progressReal} className="h-2" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Realizado: {quarter.ml.toFixed(1)}% / Meta: {mlTarget}%</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Previsto */}
          {hasCenario && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">Previsto</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`font-bold ${getMLColor(quarter.mlCenario, mlTarget)}`}>
                    {quarter.mlCenario.toFixed(1)}%
                  </span>
                  {trend > 0 ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : trend < 0 ? (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  ) : null}
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Progress 
                      value={progressCenario} 
                      className="h-2 [&>div]:bg-primary/60" 
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previsto: {quarter.mlCenario.toFixed(1)}% / Meta: {mlTarget}%</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Progresso do Realizado vs Previsto */}
          {hasCenario && (
            <div className="space-y-1 pt-1 border-t border-dashed">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Progresso da Meta</span>
                </div>
                {(() => {
                  const progressPercent = quarter.mlCenario > 0 ? Math.max(0, (quarter.ml / quarter.mlCenario) * 100) : 0;
                  const falta = quarter.mlCenario - quarter.ml;
                  const revenueGap = quarter.totalRevenueCenario - quarter.revenue;
                  
                  if (quarter.ml >= quarter.mlCenario) {
                    return (
                      <span className="font-medium text-xs text-success">
                        100% (+{(quarter.ml - quarter.mlCenario).toFixed(1)}p.p.)
                      </span>
                    );
                  }
                  
                  return (
                    <div className={`font-medium text-xs text-right ${
                      progressPercent >= 70 ? 'text-warning' : 'text-destructive'
                    }`}>
                      <div>{progressPercent.toFixed(0)}% - Faltam {falta.toFixed(1)}p.p.</div>
                      {revenueGap > 0 && (
                        <div className="text-[10px] font-medium opacity-80">
                          {formatCurrency(revenueGap)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Progress 
                      value={quarter.mlCenario > 0 ? Math.max(0, Math.min((quarter.ml / quarter.mlCenario) * 100, 100)) : 0} 
                      className={`h-1.5 ${
                        quarter.ml >= quarter.mlCenario 
                          ? '[&>div]:bg-success bg-success/20' 
                          : (quarter.mlCenario > 0 && (quarter.ml / quarter.mlCenario) >= 0.7)
                            ? '[&>div]:bg-warning bg-warning/20' 
                            : '[&>div]:bg-destructive bg-destructive/20'
                      }`}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Realizado: {quarter.ml.toFixed(1)}% / Previsto: {quarter.mlCenario.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {quarter.mlCenario > 0 
                      ? quarter.ml < 0
                        ? 'ML negativo - sem progresso'
                        : `${((quarter.ml / quarter.mlCenario) * 100).toFixed(0)}% da previsão atingida`
                      : 'Sem previsão'
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t pt-3 space-y-2">
          {/* Realizado Values */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Rec. Realizada</span>
              <p className="font-medium">{formatCurrency(quarter.revenue)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Desp. Realizada</span>
              <p className="font-medium">{formatCurrency(quarter.expense)}</p>
            </div>
          </div>

          {/* Valores Previstos */}
          {hasCenario && (
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-dashed">
              <div>
                <span className="text-primary text-[10px]">Rec. Prevista</span>
                <p className="font-medium text-primary">{formatCurrency(quarter.totalRevenueCenario)}</p>
              </div>
              <div>
                <span className="text-primary text-[10px]">Desp. Prevista</span>
                <p className="font-medium text-primary">{formatCurrency(quarter.totalExpenseCenario)}</p>
              </div>
            </div>
          )}

          {/* Tax (always from realized) */}
          <div className="text-xs">
            <span className="text-muted-foreground">Impostos</span>
            <p className="font-medium">{formatCurrency(quarter.tax)}</p>
          </div>
        </div>

        {/* Meta de Vendas em R$ */}
        {quarter.salesTarget > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <DollarSign className="w-3 h-3" />
              <span className="font-medium">Progresso Meta Vendas</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground text-[10px]">Meta</span>
                <p className="font-medium">{formatCurrency(quarter.salesTarget)}</p>
              </div>
              <div>
                <span className={cn(
                  "text-[10px]",
                  quarter.salesAchieved >= quarter.salesTarget ? "text-success" : "text-amber-500"
                )}>
                  Atingido
                </span>
                <p className={cn(
                  "font-medium",
                  quarter.salesAchieved >= quarter.salesTarget ? "text-success" : "text-amber-500"
                )}>
                  {formatCurrency(quarter.salesAchieved)}
                </p>
              </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="space-y-1">
              <Progress 
                value={Math.min((quarter.salesAchieved / quarter.salesTarget) * 100, 100)}
                className={cn(
                  "h-1.5",
                  quarter.salesAchieved >= quarter.salesTarget 
                    ? "[&>div]:bg-success" 
                    : "[&>div]:bg-amber-500"
                )}
              />
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">
                  {((quarter.salesAchieved / quarter.salesTarget) * 100).toFixed(0)}% atingido
                </span>
                {quarter.salesAchieved < quarter.salesTarget && (
                  <span className="text-amber-500 font-medium">
                    Falta: {formatCurrency(quarter.salesTarget - quarter.salesAchieved)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Target indicator */}
        <div className="flex items-center justify-center pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Meta: <span className="font-medium">{mlTarget}%</span>
          </span>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};

export default QuarterlyMLCard;
