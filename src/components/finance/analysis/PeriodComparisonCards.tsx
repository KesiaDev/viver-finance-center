import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PeriodMetrics {
  totalRevenue: number;
  totalExpense: number;
  cashGeneration: number;
  netMargin: number;
}

interface Variations {
  revenue: number;
  expense: number;
  cashGeneration: number;
  netMargin: number;
}

interface PeriodComparisonCardsProps {
  currentPeriod: {
    label: string;
    metrics: PeriodMetrics;
  };
  previousPeriod: {
    label: string;
    metrics: PeriodMetrics;
  };
  variations: Variations;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const VariationBadge = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = Math.abs(value) < 0.5;
  
  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span>0%</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {value > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      <span>{formatPercent(value)}</span>
    </span>
  );
};

export const PeriodComparisonCards = ({ 
  currentPeriod, 
  previousPeriod, 
  variations 
}: PeriodComparisonCardsProps) => {
  const metrics = [
    {
      label: 'Receita',
      current: currentPeriod.metrics.totalRevenue,
      previous: previousPeriod.metrics.totalRevenue,
      variation: variations.revenue,
      format: formatCurrency,
      inverse: false,
    },
    {
      label: 'Despesa',
      current: currentPeriod.metrics.totalExpense,
      previous: previousPeriod.metrics.totalExpense,
      variation: variations.expense,
      format: formatCurrency,
      inverse: true, // Menos despesa é melhor
    },
    {
      label: 'Geração de Caixa',
      current: currentPeriod.metrics.cashGeneration,
      previous: previousPeriod.metrics.cashGeneration,
      variation: variations.cashGeneration,
      format: formatCurrency,
      inverse: false,
    },
    {
      label: 'Margem Líquida',
      current: currentPeriod.metrics.netMargin,
      previous: previousPeriod.metrics.netMargin,
      variation: variations.netMargin,
      format: (v: number) => `${v.toFixed(1)}%`,
      inverse: false,
      isPoints: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Period Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            {currentPeriod.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metric.format(metric.current)}</span>
                <VariationBadge value={metric.isPoints ? metric.variation : metric.variation} inverse={metric.inverse} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Previous Period Card */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {previousPeriod.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <span className="font-semibold text-muted-foreground">{metric.format(metric.previous)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
