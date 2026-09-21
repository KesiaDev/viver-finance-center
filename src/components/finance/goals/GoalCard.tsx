import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Target } from "lucide-react";
import type { GoalProgress, GOAL_TYPE_LABELS } from "@/types/financial";

interface GoalCardProps {
  goalProgress: GoalProgress;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
}

const goalTypeLabels = {
  sales_volume: "Volume de Vendas",
  sales_value: "Valor de Vendas",
  net_margin_percentage: "Margem Líquida (%)",
};

export const GoalCard = ({ goalProgress, onEdit, onDelete }: GoalCardProps) => {
  const { goal, percentage, remaining } = goalProgress;

  const formatValue = (value: number) => {
    if (goal.type === "net_margin_percentage") {
      return `${value.toFixed(1)}%`;
    }
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">
              {goalTypeLabels[goal.type]}
            </CardTitle>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(goal.id)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(goal.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <Badge variant={percentage >= 100 ? "default" : "secondary"}>
            {percentage.toFixed(1)}%
          </Badge>
        </div>

        <Progress value={Math.min(percentage, 100)} className={getProgressColor()} />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Meta</p>
            <p className="font-semibold">{formatValue(goal.target_value)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Alcançado</p>
            <p className="font-semibold">
              {formatValue(goal.achieved_value || 0)}
            </p>
          </div>
        </div>

        {remaining > 0 && (
          <p className="text-xs text-muted-foreground">
            Faltam {formatValue(remaining)} para atingir a meta
          </p>
        )}
      </CardContent>
    </Card>
  );
};
