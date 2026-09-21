import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  CartesianGrid,
} from "recharts";

interface TrendData {
  label: string;
  value: number;
  target?: number;
}

interface TrendLineChartProps {
  data: TrendData[];
  title: string;
  dataKey?: string;
  color?: string;
  format?: 'currency' | 'percent';
  showTarget?: boolean;
  targetValue?: number;
  showArea?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatYAxisCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toFixed(0);
};

export const TrendLineChart = ({ 
  data, 
  title, 
  color = 'hsl(var(--primary))',
  format = 'currency',
  showTarget = false,
  targetValue,
  showArea = false,
}: TrendLineChartProps) => {
  const formatter = format === 'currency' ? formatCurrency : formatPercent;
  const yAxisFormatter = format === 'currency' 
    ? (v: number) => formatYAxisCurrency(v)
    : (v: number) => `${v.toFixed(0)}%`;

  if (data.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={yAxisFormatter}
              />
              <Tooltip 
                formatter={(value: number) => formatter(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              {showArea && (
              <Area
                  type="monotone"
                  dataKey="value"
                  fill={`url(#gradient-${title})`}
                  stroke="none"
                  tooltipType="none"
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                name={title.replace(/[^\p{L}\p{N}\s]/gu, '').trim()}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 5, fill: color, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
              {showTarget && targetValue && (
                <ReferenceLine 
                  y={targetValue} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Meta: ${formatter(targetValue)}`, 
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
