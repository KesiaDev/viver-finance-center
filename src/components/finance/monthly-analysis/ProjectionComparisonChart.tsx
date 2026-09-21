import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

interface ProjectionData {
  atual: {
    revenue: number;
    ebitda: number;
    netProfit: number;
  };
  projected: {
    revenue: number;
    ebitda: number;
    netProfit: number;
  };
}

interface ProjectionComparisonChartProps {
  data: ProjectionData | null;
  title?: string;
}

export const ProjectionComparisonChart = ({
  data,
  title = "Comparação Atual vs Meta",
}: ProjectionComparisonChartProps) => {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value.toFixed(0)}`;
  };

  if (!data) {
    return null;
  }

  const chartData = [
    {
      metric: "Receita",
      atual: data.atual.revenue,
      comMeta: data.projected.revenue,
    },
    {
      metric: "EBITDA",
      atual: data.atual.ebitda,
      comMeta: data.projected.ebitda,
    },
    {
      metric: "Lucro Líquido",
      atual: data.atual.netProfit,
      comMeta: data.projected.netProfit,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 80, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="metric" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              width={100}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar 
              dataKey="atual" 
              name="Atual" 
              fill="hsl(var(--muted-foreground))"
              radius={[0, 4, 4, 0]}
              barSize={16}
            >
              <LabelList 
                dataKey="atual" 
                position="right" 
                formatter={formatCurrency}
                fill="hsl(var(--muted-foreground))"
                fontSize={12}
              />
            </Bar>
            <Bar 
              dataKey="comMeta" 
              name="Com Meta" 
              fill="hsl(142, 76%, 36%)"
              radius={[0, 4, 4, 0]}
              barSize={16}
            >
              <LabelList 
                dataKey="comMeta" 
                position="right" 
                formatter={formatCurrency}
                fill="hsl(142, 76%, 36%)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
