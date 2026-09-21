import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonData {
  month: string;
  revenue: number;
  target: number;
  expense: number;
}

interface MonthlyComparisonChartProps {
  data: ComparisonData[];
  title?: string;
  showTarget?: boolean;
}

export const MonthlyComparisonChart = ({
  data,
  title = "Comparação Mensal",
  showTarget = true,
}: MonthlyComparisonChartProps) => {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value.toFixed(0)}`;
  };

  const formatTooltip = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis 
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatTooltip(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Receita"
                fill="#22c55e"
                radius={[6, 6, 0, 0]}
              />
              {showTarget && (
                <Bar
                  dataKey="target"
                  name="Meta"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              )}
              <Bar
                dataKey="expense"
                name="Despesa"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
