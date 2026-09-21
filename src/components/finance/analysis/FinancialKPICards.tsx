import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent,
  Target,
  PiggyBank 
} from "lucide-react";

interface KPIData {
  totalRevenue: number;
  totalExpense: number;
  cashGeneration: number;
  netMargin: number;
  targetAchievement: number;
  finalBalance: number;
}

interface FinancialKPICardsProps {
  data: KPIData;
  isLoading?: boolean;
  periodLabel?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const FinancialKPICards = ({ data, isLoading, periodLabel }: FinancialKPICardsProps) => {
  const kpis = [
    {
      title: 'Receita Total',
      value: formatCurrency(data.totalRevenue),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      title: 'Despesa Total',
      value: formatCurrency(data.totalExpense),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      title: 'Geração de Caixa',
      value: formatCurrency(data.cashGeneration),
      icon: Wallet,
      color: data.cashGeneration >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data.cashGeneration >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20',
    },
    {
      title: 'Margem Líquida',
      value: formatPercent(data.netMargin),
      icon: Percent,
      color: data.netMargin >= 0 ? 'text-cyan-600' : 'text-red-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    },
    {
      title: 'Atingimento Meta',
      value: formatPercent(data.targetAchievement),
      icon: Target,
      color: data.targetAchievement >= 100 ? 'text-green-600' : 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
      title: 'Saldo Final',
      value: formatCurrency(data.finalBalance),
      icon: PiggyBank,
      color: data.finalBalance >= 0 ? 'text-primary' : 'text-red-600',
      bgColor: 'bg-primary/5',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4 pb-4">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {periodLabel && (
        <p className="text-xs text-muted-foreground font-medium">{periodLabel}</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className={`${kpi.bgColor} border-none`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  <Icon className={`w-5 h-5 ${kpi.color} opacity-60`} />
                </div>
                <p className={`text-2xl font-bold ${kpi.color} tabular-nums`}>{kpi.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
