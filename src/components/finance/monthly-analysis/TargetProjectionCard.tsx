import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

interface TargetProjectionCardProps {
  title: string;
  target: number;
  achieved: number;
  projection?: number;
  showProjection?: boolean;
}

export const TargetProjectionCard = ({
  title,
  target,
  achieved,
  projection,
  showProjection = true,
}: TargetProjectionCardProps) => {
  const percentage = target > 0 ? (achieved / target) * 100 : 0;
  const projectionPercentage = target > 0 && projection ? (projection / target) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const isOnTrack = projection ? projection >= target : achieved >= target * 0.8;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Alcançado</span>
            <span className="font-semibold">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(percentage, 100)} className={getProgressColor()} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-lg font-bold">{formatCurrency(target)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Realizado</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(achieved)}
            </p>
          </div>
        </div>

        {showProjection && projection !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnTrack ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">Projeção</span>
              </div>
              <span
                className={`font-semibold ${
                  isOnTrack ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(projection)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {projectionPercentage.toFixed(1)}% da meta
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
