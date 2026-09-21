import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Scale } from "lucide-react";
import type { TaxRule, TAX_REGIME_LABELS } from "@/types/financial";

interface TaxRuleCardProps {
  rule: TaxRule;
  onEdit?: (rule: TaxRule) => void;
  onDelete?: (ruleId: string) => void;
}

const regimeLabels: Record<string, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
};

export const TaxRuleCard = ({ rule, onEdit, onDelete }: TaxRuleCardProps) => {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);
  };

  return (
    <Card className={!rule.is_active ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">{rule.name}</CardTitle>
            <Badge variant={rule.is_active ? "default" : "secondary"} className="mt-1">
              {rule.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(rule)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(rule.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Regime</span>
          <Badge variant="outline">{regimeLabels[rule.regime]}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Alíquota</span>
          <span className="font-semibold text-amber-600">
            {rule.aliquot_percentage}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Receita Mín.</p>
            <p className="font-medium">{formatCurrency(rule.min_revenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita Máx.</p>
            <p className="font-medium">{formatCurrency(rule.max_revenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
