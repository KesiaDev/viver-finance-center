import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDynamicExpense, getFullRevenue } from "@/lib/dynamicExpenseCalculation";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceLine,
} from "recharts";

interface AnnualEvolutionChartProps {
  yearPlanning: Array<{
    month: string;
    revenue?: number | null;
    planned_revenue?: number | null;
    other_revenue?: number | null;
    forecast_revenue?: number | null;
    expense?: number | null;
    planned_expense?: number | null;
    other_expense?: number | null;
    forecast_expense?: number | null;
    tax?: number | null;
    distribution?: number | null;
    platform_fee?: number | null;
  }>;
  targetMLPercentage: number;
  hublaFeePercentage: number;
  isLoading?: boolean;
}

const chartConfig = {
  revenueRealizada: {
    label: "Receita Realizada",
    color: "#16a34a",
  },
  revenuePrevista: {
    label: "Receita Prevista",
    color: "#86efac",
  },
  expenseRealizada: {
    label: "Despesa Realizada",
    color: "#ef4444",
  },
  expensePrevista: {
    label: "Despesa Prevista",
    color: "#fca5a5",
  },
  mlRealizado: {
    label: "ML% Realizado",
    color: "#0891b2",
  },
  mlPrevisto: {
    label: "ML% Previsto",
    color: "#67e8f9",
  },
} satisfies ChartConfig;

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

export const AnnualEvolutionChart = ({
  yearPlanning,
  targetMLPercentage,
  hublaFeePercentage,
  isLoading,
}: AnnualEvolutionChartProps) => {
  const chartData = useMemo(() => {
    if (!yearPlanning.length) return [];

    return yearPlanning
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((p) => {
        // Revenue split
        const revenueRealizada = (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0);
        const revenuePrevista = (Number(p.planned_revenue) || 0) + (Number(p.forecast_revenue) || 0);
        const totalRevenue = getFullRevenue(p);

        // Dynamic expense (includes Hubla fee + taxes)
        const dynamic = getDynamicExpense(p, hublaFeePercentage, yearPlanning);

        // Expense split: realizada = expense + other_expense, prevista = rest
        const expenseRealizada = (Number(p.expense) || 0) + (Number(p.other_expense) || 0);
        const expensePrevista = dynamic.total - expenseRealizada;

        // ML% Realizado (only if there's realized revenue)
        const mlRealizado = revenueRealizada > 0
          ? ((revenueRealizada - expenseRealizada) / revenueRealizada) * 100
          : null;

        // ML% Previsto (full month: totalRevenue - dynamic.total)
        const mlPrevisto = totalRevenue > 0
          ? ((totalRevenue - dynamic.total) / totalRevenue) * 100
          : null;

        return {
          month: format(parse(p.month, "yyyy-MM-dd", new Date()), "MMM", {
            locale: ptBR,
          }),
          revenueRealizada: revenueRealizada / 1000,
          revenuePrevista: revenuePrevista / 1000,
          expenseRealizada: expenseRealizada / 1000,
          expensePrevista: Math.max(0, expensePrevista) / 1000,
          mlRealizado,
          mlPrevisto,
        };
      });
  }, [yearPlanning, hublaFeePercentage]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução Anual
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução Anual
          </CardTitle>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-muted-foreground">
            Nenhum dado de planejamento encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Evolução Anual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${formatCompact(value * 1000)}`}
              className="text-xs"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value)}%`}
              domain={['auto', 'auto']}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "mlRealizado" || name === "mlPrevisto") {
                      const label = name === "mlRealizado" ? "ML% Realizado" : "ML% Previsto";
                      return [`${Number(value).toFixed(1)}%`, label];
                    }
                    const labels: Record<string, string> = {
                      revenueRealizada: "Receita Realizada",
                      revenuePrevista: "Receita Prevista",
                      expenseRealizada: "Despesa Realizada",
                      expensePrevista: "Despesa Prevista",
                    };
                    return [`R$ ${formatCompact(Number(value) * 1000)}`, labels[name as string] || name];
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar yAxisId="left" dataKey="revenueRealizada" fill="var(--color-revenueRealizada)" radius={[4, 4, 0, 0]} name="revenueRealizada" />
            <Bar yAxisId="left" dataKey="revenuePrevista" fill="var(--color-revenuePrevista)" radius={[4, 4, 0, 0]} name="revenuePrevista" />
            <Bar yAxisId="left" dataKey="expenseRealizada" fill="var(--color-expenseRealizada)" radius={[4, 4, 0, 0]} name="expenseRealizada" />
            <Bar yAxisId="left" dataKey="expensePrevista" fill="var(--color-expensePrevista)" radius={[4, 4, 0, 0]} name="expensePrevista" />
            <Line yAxisId="right" type="monotone" dataKey="mlRealizado" stroke="var(--color-mlRealizado)" strokeWidth={2} dot={{ fill: "var(--color-mlRealizado)", strokeWidth: 2 }} name="mlRealizado" connectNulls={false} />
            <Line yAxisId="right" type="monotone" dataKey="mlPrevisto" stroke="var(--color-mlPrevisto)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "var(--color-mlPrevisto)", strokeWidth: 2 }} name="mlPrevisto" connectNulls={false} />
            <ReferenceLine
              yAxisId="right"
              y={targetMLPercentage}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              label={{
                value: `ML Alvo: ${targetMLPercentage}%`,
                position: "insideTopRight",
                fill: "hsl(var(--primary))",
                fontSize: 12,
              }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AnnualEvolutionChart;
