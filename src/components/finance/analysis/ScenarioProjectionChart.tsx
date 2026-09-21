import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ScenarioData {
  label: string;
  conservador: number;
  base: number;
  otimista: number;
}

interface ScenarioProjection {
  name: string;
  factor: number;
  data: {
    label: string;
    balance: number;
  }[];
  totals: {
    revenue: number;
    expense: number;
    cashGeneration: number;
    netMargin: number;
  };
}

interface ScenarioProjectionChartProps {
  projections: ScenarioProjection[];
  title?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);

export const ScenarioProjectionChart = ({ 
  projections, 
  title = "Projeção de Cenários" 
}: ScenarioProjectionChartProps) => {
  if (projections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData: ScenarioData[] = projections[0]?.data.map((_, index) => ({
    label: projections[0].data[index].label,
    conservador: projections.find(p => p.name === 'Conservador')?.data[index]?.balance || 0,
    base: projections.find(p => p.name === 'Base')?.data[index]?.balance || 0,
    otimista: projections.find(p => p.name === 'Otimista')?.data[index]?.balance || 0,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="otimista"
                name="Otimista"
                stroke="hsl(142 76% 36%)"
                fill="hsl(142 76% 36%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="base"
                name="Base"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="conservador"
                name="Conservador"
                stroke="hsl(45 93% 47%)"
                fill="hsl(45 93% 47%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {projections.map((scenario) => (
            <div 
              key={scenario.name}
              className={`p-3 rounded-lg text-center ${
                scenario.name === 'Base' ? 'bg-primary/10' :
                scenario.name === 'Otimista' ? 'bg-green-50 dark:bg-green-950/20' :
                'bg-amber-50 dark:bg-amber-950/20'
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1">{scenario.name} ({(scenario.factor * 100).toFixed(0)}%)</p>
              <p className="text-sm font-bold">{formatCurrency(scenario.totals.cashGeneration)}</p>
              <p className="text-xs text-muted-foreground">ML: {scenario.totals.netMargin.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
