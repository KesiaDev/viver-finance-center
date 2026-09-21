import { useState, useMemo } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, TrendingUp, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMonthlyFlowFromDB } from "@/hooks/useMonthlyFlowFromDB";
import { formatCurrency } from "@/components/financeiro/MarveeResultHelpers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell,
} from "@/components/ui/table";

interface MonthRow {
  month: string;
  label: string;
  saldoInicial: number;
  receitas: number;
  despesas: number;
  geracaoCaixa: number;
  saldoFinal: number;
}

const buildMonthRows = (
  data: { month: string; total_receitas: number; total_despesas: number }[]
): MonthRow[] => {
  const rows: MonthRow[] = [];
  let saldoAnterior = 0;

  for (const item of data) {
    const receitas = Number(item.total_receitas) || 0;
    const despesas = Number(item.total_despesas) || 0;
    const geracaoCaixa = receitas - despesas;
    const saldoFinal = saldoAnterior + geracaoCaixa;

    const parsed = parse(item.month, "yyyy-MM", new Date());
    const label = isValid(parsed)
      ? format(parsed, "MMM/yyyy", { locale: ptBR })
      : item.month;

    rows.push({
      month: item.month,
      label,
      saldoInicial: saldoAnterior,
      receitas,
      despesas,
      geracaoCaixa,
      saldoFinal,
    });

    saldoAnterior = saldoFinal;
  }

  return rows;
};

const colorClass = (val: number) =>
  val > 0 ? "text-green-600" : val < 0 ? "text-destructive" : "";

const MarveeMonthlyCashFlow = () => {
  const [dateStart, setDateStart] = useState<Date | undefined>();
  const [dateEnd, setDateEnd] = useState<Date | undefined>();

  const { data, isLoading, isError, error, lastSyncedAt } = useMonthlyFlowFromDB({
    startDate: dateStart,
    endDate: dateEnd,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return buildMonthRows(data);
  }, [data]);

  const totals = useMemo(() => {
    if (rows.length === 0) return null;
    return {
      receitas: rows.reduce((s, r) => s + r.receitas, 0),
      despesas: rows.reduce((s, r) => s + r.despesas, 0),
      geracaoCaixa: rows.reduce((s, r) => s + r.geracaoCaixa, 0),
      saldoFinal: rows[rows.length - 1]?.saldoFinal ?? 0,
    };
  }, [rows]);

  const formattedSync = lastSyncedAt
    ? format(new Date(lastSyncedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Fluxo de Caixa Mensal
          </CardTitle>
          {formattedSync && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última sincronização: {formattedSync}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left text-xs font-normal", !dateStart && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {dateStart ? format(dateStart, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateStart} onSelect={setDateStart} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left text-xs font-normal", !dateEnd && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {dateEnd ? format(dateEnd, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateEnd} onSelect={setDateEnd} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        )}

        {rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Mês</TableHead>
                <TableHead className="text-xs text-right">Saldo Inicial</TableHead>
                <TableHead className="text-xs text-right">Receitas</TableHead>
                <TableHead className="text-xs text-right">Despesas</TableHead>
                <TableHead className="text-xs text-right">Geração de Caixa</TableHead>
                <TableHead className="text-xs text-right">Saldo Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="text-xs font-medium capitalize">{r.label}</TableCell>
                  <TableCell className={cn("text-xs text-right", colorClass(r.saldoInicial))}>{formatCurrency(r.saldoInicial)}</TableCell>
                  <TableCell className="text-xs text-right text-green-600">{formatCurrency(r.receitas)}</TableCell>
                  <TableCell className="text-xs text-right text-destructive">{formatCurrency(r.despesas)}</TableCell>
                  <TableCell className={cn("text-xs text-right font-medium", colorClass(r.geracaoCaixa))}>{formatCurrency(r.geracaoCaixa)}</TableCell>
                  <TableCell className={cn("text-xs text-right font-medium", colorClass(r.saldoFinal))}>{formatCurrency(r.saldoFinal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            {totals && (
              <TableFooter>
                <TableRow>
                  <TableCell className="text-xs font-bold">Total</TableCell>
                  <TableCell className="text-xs text-right">-</TableCell>
                  <TableCell className="text-xs text-right font-bold text-green-600">{formatCurrency(totals.receitas)}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-destructive">{formatCurrency(totals.despesas)}</TableCell>
                  <TableCell className={cn("text-xs text-right font-bold", colorClass(totals.geracaoCaixa))}>{formatCurrency(totals.geracaoCaixa)}</TableCell>
                  <TableCell className={cn("text-xs text-right font-bold", colorClass(totals.saldoFinal))}>{formatCurrency(totals.saldoFinal)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}

        {!isLoading && dateStart && dateEnd && rows.length === 0 && !isError && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum registro encontrado para o período selecionado.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MarveeMonthlyCashFlow;
