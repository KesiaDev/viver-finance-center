import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface MovingAverages {
  revenue3M: number;
  revenue6M: number;
  revenue12M: number;
  expense3M: number;
  expense6M: number;
  expense12M: number;
  ml3M: number;
  ml6M: number;
  ml12M: number;
}

interface MovingAveragesCardProps {
  data: MovingAverages;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const TrendIndicator = ({ shortTerm, longTerm, inverse = false }: { shortTerm: number; longTerm: number; inverse?: boolean }) => {
  const diff = shortTerm - longTerm;
  const isPositive = inverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff / (longTerm || 1)) < 0.02; // Less than 2% difference
  
  if (isNeutral || longTerm === 0) {
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
  
  if (isPositive) {
    return <ArrowUp className="w-4 h-4 text-green-600" />;
  }
  
  return <ArrowDown className="w-4 h-4 text-red-600" />;
};

export const MovingAveragesCard = ({ data }: MovingAveragesCardProps) => {
  const metrics = [
    {
      label: 'Receita',
      values: [data.revenue3M, data.revenue6M, data.revenue12M],
      format: formatCurrency,
      inverse: false,
    },
    {
      label: 'Despesa',
      values: [data.expense3M, data.expense6M, data.expense12M],
      format: formatCurrency,
      inverse: true,
    },
    {
      label: 'Margem Líquida',
      values: [data.ml3M, data.ml6M, data.ml12M],
      format: formatPercent,
      inverse: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Médias Móveis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Métrica</th>
                <th className="text-right py-2 font-medium text-muted-foreground">3 Meses</th>
                <th className="text-right py-2 font-medium text-muted-foreground">6 Meses</th>
                <th className="text-right py-2 font-medium text-muted-foreground">12 Meses</th>
                <th className="text-center py-2 font-medium text-muted-foreground">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3 font-medium">{metric.label}</td>
                  <td className="py-3 text-right">{metric.format(metric.values[0])}</td>
                  <td className="py-3 text-right">{metric.format(metric.values[1])}</td>
                  <td className="py-3 text-right">{metric.format(metric.values[2])}</td>
                  <td className="py-3">
                    <div className="flex justify-center">
                      <TrendIndicator 
                        shortTerm={metric.values[0]} 
                        longTerm={metric.values[2]} 
                        inverse={metric.inverse}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          💡 A tendência compara a média de 3 meses com a média de 12 meses
        </p>
      </CardContent>
    </Card>
  );
};
