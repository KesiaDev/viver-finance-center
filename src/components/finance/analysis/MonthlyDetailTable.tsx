import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDynamicExpense, getFullRevenue } from "@/lib/dynamicExpenseCalculation";

interface MonthlyPlanning {
  id: string;
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
  platform_fee?: number | null;
  distribution?: number | null;
  initial_balance?: number | null;
}

interface MonthlyDetailTableProps {
  planningData: MonthlyPlanning[] | undefined;
  months: string[];
  hublaFeePercentage: number;
  showTarget?: boolean;
  targetData?: Record<string, number>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getQuarterLabel = (month: number) => {
  if (month <= 3) return '1º Trim';
  if (month <= 6) return '2º Trim';
  if (month <= 9) return '3º Trim';
  return '4º Trim';
};

const getQuarterKey = (monthStr: string) => {
  const date = new Date(monthStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const q = Math.ceil(month / 3);
  return `${year}-Q${q}`;
};

export const MonthlyDetailTable = ({ planningData, months, hublaFeePercentage, showTarget = false, targetData = {} }: MonthlyDetailTableProps) => {
  const currentMonthStr = format(new Date(), 'yyyy-MM-01');

  const rows = useMemo(() => {
    return months.map(monthStr => {
      const p = planningData?.find(d => d.month === monthStr);
      const revenue = getFullRevenue(p);
      const expenseDynamic = getDynamicExpense(p, hublaFeePercentage, planningData);
      const expense = expenseDynamic.total;
      const cashGen = revenue - expense;
      const ml = revenue > 0 ? (cashGen / revenue) * 100 : 0;
      const date = new Date(monthStr + 'T00:00:00');

      const target = targetData[monthStr] || 0;
      const targetPct = target > 0 ? (revenue / target) * 100 : 0;

      return {
        month: monthStr,
        label: format(date, 'MMM/yy', { locale: ptBR }),
        revenue,
        expense,
        cashGen,
        ml,
        target,
        targetPct,
        isCurrent: monthStr === currentMonthStr,
      };
    });
  }, [planningData, months, currentMonthStr, hublaFeePercentage]);

  // Group rows by quarter
  const quarterGroups = useMemo(() => {
    const groups: { key: string; label: string; rows: typeof rows }[] = [];
    let currentKey = '';

    for (const row of rows) {
      const qKey = getQuarterKey(row.month);
      if (qKey !== currentKey) {
        const date = new Date(row.month + 'T00:00:00');
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const qLabel = `${getQuarterLabel(month)} ${year}`;
        groups.push({ key: qKey, label: qLabel, rows: [] });
        currentKey = qKey;
      }
      groups[groups.length - 1].rows.push(row);
    }

    return groups;
  }, [rows]);

  const totals = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
    const totalCashGen = totalRevenue - totalExpense;
    const totalML = totalRevenue > 0 ? (totalCashGen / totalRevenue) * 100 : 0;
    const totalTarget = rows.reduce((s, r) => s + r.target, 0);
    const totalTargetPct = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;
    return { revenue: totalRevenue, expense: totalExpense, cashGen: totalCashGen, ml: totalML, target: totalTarget, targetPct: totalTargetPct };
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📋 Detalhamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Mês</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                {showTarget && <TableHead className="text-right">Meta</TableHead>}
                {showTarget && <TableHead className="text-right">Meta (%)</TableHead>}
                <TableHead className="text-right">Despesa</TableHead>
                <TableHead className="text-right">Ger. Caixa</TableHead>
                <TableHead className="text-right">ML%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarterGroups.map(group => {
              const qRevenue = group.rows.reduce((s, r) => s + r.revenue, 0);
                const qExpense = group.rows.reduce((s, r) => s + r.expense, 0);
                const qCashGen = qRevenue - qExpense;
                const qML = qRevenue > 0 ? (qCashGen / qRevenue) * 100 : 0;
                const qTarget = group.rows.reduce((s, r) => s + r.target, 0);
                const qTargetPct = qTarget > 0 ? (qRevenue / qTarget) * 100 : 0;

                return [
                  ...group.rows.map(row => (
                    <TableRow
                      key={row.month}
                      className={row.isCurrent ? 'bg-primary/10 font-semibold' : ''}
                    >
                      <TableCell className="font-medium capitalize">{row.label}</TableCell>
                      <TableCell className="text-right text-green-600 tabular-nums">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      {showTarget && (
                        <TableCell className="text-right text-blue-600 tabular-nums">
                          {formatCurrency(row.target)}
                        </TableCell>
                      )}
                      {showTarget && (
                        <TableCell className={`text-right tabular-nums ${row.targetPct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {row.targetPct.toFixed(1)}%
                        </TableCell>
                      )}
                      <TableCell className="text-right text-red-600 tabular-nums">
                        {formatCurrency(row.expense)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${row.cashGen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(row.cashGen)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${row.ml >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                        {row.ml.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )),
                  <TableRow key={group.key} className="bg-primary/10 font-semibold border-t">
                    <TableCell>{group.label}</TableCell>
                    <TableCell className="text-right text-green-600 tabular-nums">
                      {formatCurrency(qRevenue)}
                    </TableCell>
                    {showTarget && (
                      <TableCell className="text-right text-blue-600 tabular-nums">
                        {formatCurrency(qTarget)}
                      </TableCell>
                    )}
                    {showTarget && (
                      <TableCell className={`text-right tabular-nums ${qTargetPct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                        {qTargetPct.toFixed(1)}%
                      </TableCell>
                    )}
                    <TableCell className="text-right text-red-600 tabular-nums">
                      {formatCurrency(qExpense)}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${qCashGen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(qCashGen)}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${qML >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                      {qML.toFixed(1)}%
                    </TableCell>
                  </TableRow>,
                ];
              })}
              <TableRow className="border-t-2 font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell className="text-right text-green-600 tabular-nums">
                  {formatCurrency(totals.revenue)}
                </TableCell>
                {showTarget && (
                  <TableCell className="text-right text-blue-600 tabular-nums">
                    {formatCurrency(totals.target)}
                  </TableCell>
                )}
                {showTarget && (
                  <TableCell className={`text-right tabular-nums ${totals.targetPct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                    {totals.targetPct.toFixed(1)}%
                  </TableCell>
                )}
                <TableCell className="text-right text-red-600 tabular-nums">
                  {formatCurrency(totals.expense)}
                </TableCell>
                <TableCell className={`text-right tabular-nums ${totals.cashGen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.cashGen)}
                </TableCell>
                <TableCell className={`text-right tabular-nums ${totals.ml >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                  {totals.ml.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
