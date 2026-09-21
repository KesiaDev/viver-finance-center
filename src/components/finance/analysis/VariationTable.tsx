import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Metric {
  label: string;
  current: number;
  previous: number;
  variation: number;
  format: 'currency' | 'percent' | 'points';
  inverse?: boolean;
}

interface VariationTableProps {
  metrics: Metric[];
  currentLabel: string;
  previousLabel: string;
  title?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatValue = (value: number, format: 'currency' | 'percent' | 'points') => {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'points':
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}pp`;
  }
};

const TrendIndicator = ({ variation, inverse }: { variation: number; inverse?: boolean }) => {
  const isPositive = inverse ? variation < 0 : variation > 0;
  const isNeutral = Math.abs(variation) < 0.5;
  
  if (isNeutral) {
    return (
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span className="text-sm">0%</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {variation > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
      <span className="text-sm font-medium">{variation >= 0 ? '+' : ''}{variation.toFixed(1)}%</span>
    </div>
  );
};

export const VariationTable = ({ 
  metrics, 
  currentLabel, 
  previousLabel,
  title = "Análise Comparativa" 
}: VariationTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead className="text-right">{currentLabel}</TableHead>
              <TableHead className="text-right">{previousLabel}</TableHead>
              <TableHead className="text-center">Variação</TableHead>
              <TableHead className="text-center">Tendência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatValue(metric.current, metric.format === 'points' ? 'percent' : metric.format)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatValue(metric.previous, metric.format === 'points' ? 'percent' : metric.format)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-medium ${
                    metric.format === 'points' 
                      ? (metric.variation >= 0 ? 'text-green-600' : 'text-red-600')
                      : ''
                  }`}>
                    {metric.format === 'points' 
                      ? formatValue(metric.variation, 'points')
                      : `${metric.variation >= 0 ? '+' : ''}${metric.variation.toFixed(1)}%`
                    }
                  </span>
                </TableCell>
                <TableCell>
                  <TrendIndicator variation={metric.variation} inverse={metric.inverse} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
