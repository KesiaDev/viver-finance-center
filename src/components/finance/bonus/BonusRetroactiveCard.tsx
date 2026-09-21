import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Target, TrendingUp, BarChart3 } from "lucide-react";
import type { BonusSummary } from "@/hooks/useBonusCalculator";
import { formatCurrency } from "@/lib/taxCalculations";

interface BonusRetroactiveCardProps {
  summary: BonusSummary;
  mlTarget: number;
}

const BonusRetroactiveCard = ({ summary, mlTarget }: BonusRetroactiveCardProps) => {
  const {
    annualML,
    annualMLForecast,
    isRetroactiveEligible,
    isRetroactiveEligibleForecast,
    totalPaid,
    totalPaidForecast,
    totalRetroactive,
    totalRetroactiveForecast,
    totalAnnualBase,
  } = summary;

  const progressReal = Math.min((annualML / mlTarget) * 100, 100);
  const progressCenario = Math.min((annualMLForecast / mlTarget) * 100, 100);
  const gapToTarget = mlTarget - annualML;
  const gapToTargetCenario = mlTarget - annualMLForecast;

  const hasCenario = annualMLForecast !== annualML;

  return (
    <Card
      className={`relative overflow-hidden ${
        isRetroactiveEligibleForecast
          ? "border-success/50 bg-success/5"
          : hasCenario && progressCenario >= 70
          ? "border-primary/50 bg-primary/5"
          : progressReal >= 70
          ? "border-warning/50 bg-warning/5"
          : ""
      }`}
    >
      {/* Decorative gradient */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
          isRetroactiveEligibleForecast
            ? "bg-success"
            : hasCenario
            ? "bg-primary"
            : "bg-muted"
        }`}
      />

      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Retroativo Anual
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ML Realizado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ML Realizado</span>
            <span
              className={`font-bold text-lg ${
                isRetroactiveEligible ? "text-success" : "text-foreground"
              }`}
            >
              {annualML.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={progressReal}
            className="h-2"
          />
        </div>

        {/* ML Previsto */}
        {hasCenario && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-primary" />
                <span className="text-primary font-medium">ML Previsto</span>
              </div>
              <span
                className={`font-bold text-lg ${
                  isRetroactiveEligibleForecast ? "text-success" : "text-primary"
                }`}
              >
                {annualMLForecast.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={progressCenario}
              className="h-2 [&>div]:bg-primary/60"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
          <Target className="w-3 h-3" />
          <span>Meta: {mlTarget}%</span>
        </div>

        {/* Status Messages */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          {/* Situação Atual */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Situação Atual</div>
            {isRetroactiveEligible ? (
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Meta atingida!</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Faltam <span className="font-semibold text-foreground">{gapToTarget.toFixed(1)}%</span> para meta
              </div>
            )}
          </div>

          {/* Previsão */}
          {hasCenario && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <BarChart3 className="w-3 h-3" />
                Previsão
              </div>
              {isRetroactiveEligibleForecast ? (
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Meta será atingida!</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Faltam <span className="font-semibold text-primary">{gapToTargetCenario.toFixed(1)}%</span> para meta
                </div>
              )}
            </div>
          )}
        </div>

        {/* Values */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          {/* Já Pago */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Já Pago (Real)</span>
              <span className="font-semibold">{formatCurrency(totalPaid)}</span>
            </div>
            {hasCenario && totalPaidForecast > totalPaid && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-primary">A Pagar (Prev.)</span>
                <span className="font-semibold text-primary">{formatCurrency(totalPaidForecast)}</span>
              </div>
            )}
          </div>

          {/* Retroativo */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Retroativo (Real)</span>
              <span
                className={`font-bold text-lg ${
                  isRetroactiveEligible ? "text-success" : "text-muted-foreground"
                }`}
              >
                {isRetroactiveEligible ? formatCurrency(totalRetroactive) : "--"}
              </span>
            </div>
            {hasCenario && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-primary">Retroativo (Prev.)</span>
                <span
                  className={`font-bold text-lg ${
                    isRetroactiveEligibleForecast ? "text-success" : "text-primary"
                  }`}
                >
                  {isRetroactiveEligibleForecast ? formatCurrency(totalRetroactiveForecast) : "--"}
                </span>
              </div>
            )}
          </div>

          {/* Total Potencial */}
          {hasCenario && isRetroactiveEligibleForecast && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Potencial</span>
                <div className="flex items-center gap-2">
                  <span className="text-success font-bold text-lg">
                    {formatCurrency(totalPaidForecast + totalRetroactiveForecast)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-right">
                de {formatCurrency(totalAnnualBase)} possível
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusRetroactiveCard;
