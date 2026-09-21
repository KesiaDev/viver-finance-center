import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyEvolutionData {
  month: string;
  revenue: number;
  target: number;
  expense: number;
  ebitda: number;
  ml: number;
  revenueDelta?: 'up' | 'down' | 'equal';
  expenseDelta?: 'up' | 'down' | 'equal';
}

interface MonthlyEvolutionTableProps {
  data: MonthlyEvolutionData[];
  title?: string;
}

export const MonthlyEvolutionTable = ({
  data,
  title = "Evolução Mensal",
}: MonthlyEvolutionTableProps) => {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (delta?: 'up' | 'down' | 'equal') => {
    switch (delta) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500 inline ml-1" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500 inline ml-1" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground inline ml-1" />;
    }
  };

  const getTargetStatus = (revenue: number, target: number) => {
    if (target <= 0) return { percent: 0, color: "text-muted-foreground", icon: null };
    const percent = (revenue / target) * 100;
    if (percent >= 100) {
      return { percent, color: "text-green-600", icon: "✅" };
    } else if (percent >= 80) {
      return { percent, color: "text-amber-600", icon: "⚠️" };
    }
    return { percent, color: "text-red-600", icon: "❌" };
  };

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Meta (%)</TableHead>
                  <TableHead className="text-right">Despesa</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                  <TableHead className="text-right">ML %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => {
                  const targetStatus = getTargetStatus(row.revenue, row.target);
                  return (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">
                        {row.month}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(row.revenue)}
                        {getTrendIcon(row.revenueDelta)}
                      </TableCell>
                      <TableCell className={`text-right ${targetStatus.color}`}>
                        {formatPercent(targetStatus.percent)} {targetStatus.icon}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(row.expense)}
                        {getTrendIcon(row.expenseDelta)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          row.ebitda >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(row.ebitda)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          row.ml >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatPercent(row.ml)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
