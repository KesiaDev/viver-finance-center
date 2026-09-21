import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailedCashFlowRow, StatusFilter } from "@/hooks/useCashFlowDataDetailed";

interface CashFlowDetailedTableProps {
  rows: DetailedCashFlowRow[];
  months: string[];
  isLoading: boolean;
  statusFilter: StatusFilter;
  showPercentage: boolean;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function CashFlowDetailedTable({
  rows,
  months,
  isLoading,
  statusFilter,
  showPercentage,
}: CashFlowDetailedTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (code: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Calculate totals for percentage display
  const totals = useMemo(() => {
    const result: { [month: string]: { realized: number; projected: number } } = {};
    months.forEach((month) => {
      result[month] = { realized: 0, projected: 0 };
    });

    rows.forEach((row) => {
      if (row.code === "TOTAL_RECEITAS") {
        months.forEach((month) => {
          result[month].realized = row.values[month]?.realized || 0;
          result[month].projected = row.values[month]?.projected || 0;
        });
      }
    });

    return result;
  }, [rows, months]);

  const formatValue = (value: number, type: "realized" | "projected", month: string) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    if (showPercentage && totals[month]) {
      const total = type === "realized" ? totals[month].realized : totals[month].projected;
      if (total !== 0) {
        const percentage = ((value / total) * 100).toFixed(1);
        return `${formatted} (${percentage}%)`;
      }
    }

    return formatted;
  };

  const getRowBackground = (type: string, level: number, isTotal: boolean) => {
    if (isTotal || type === "result") {
      return "bg-slate-100 dark:bg-slate-800 font-bold";
    }
    if (level === 0) {
      return "bg-muted/50 font-semibold";
    }
    if (level === 1) {
      return "bg-muted/30";
    }
    return "bg-background";
  };

  const getTextColor = (type: string, value: number) => {
    if (type === "result") {
      return value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    }
    if (type === "revenue") {
      return "text-green-600 dark:text-green-400";
    }
    if (type === "expense") {
      return "text-red-600 dark:text-red-400";
    }
    return "";
  };

  const getIndentation = (level: number) => {
    if (level === 1) return "pl-6";
    if (level === 2) return "pl-12";
    return "";
  };

  const renderRow = (row: DetailedCashFlowRow) => {
    const isExpanded = expandedRows.has(row.code);
    const hasChildren = row.children && row.children.length > 0;
    const isTotal = row.code.startsWith("TOTAL_") || row.code === "GCO";

    const rowElements = [];

    // Main row
    rowElements.push(
      <tr key={row.code} className={getRowBackground(row.type, row.level, isTotal)}>
        {/* Category name - sticky */}
        <td
          className={`sticky left-0 z-10 px-3 py-2 text-sm whitespace-nowrap border-r border-border min-w-[280px] ${getRowBackground(row.type, row.level, isTotal)} ${getIndentation(row.level)}`}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleRow(row.code)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && row.level > 0 && <span className="w-5" />}
            <span className="text-xs text-muted-foreground font-mono">{row.code}</span>
            <span>{row.name}</span>
          </div>
        </td>

        {/* Month values */}
        {months.map((month) => {
          const realized = row.values[month]?.realized || 0;
          const projected = row.values[month]?.projected || 0;

          if (statusFilter === "realized") {
            return (
              <td
                key={month}
                className={`px-3 py-2 text-sm text-right whitespace-nowrap ${getTextColor(row.type, realized)}`}
              >
                {formatValue(realized, "realized", month)}
              </td>
            );
          }

          if (statusFilter === "projected") {
            return (
              <td
                key={month}
                className={`px-3 py-2 text-sm text-right whitespace-nowrap ${getTextColor(row.type, projected)}`}
              >
                {formatValue(projected, "projected", month)}
              </td>
            );
          }

          // Both
          return (
            <td key={month} className="px-2 py-2 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className={`text-right ${getTextColor(row.type, realized)}`}>
                  R: {formatValue(realized, "realized", month)}
                </span>
                <span className={`text-right text-muted-foreground`}>
                  P: {formatValue(projected, "projected", month)}
                </span>
              </div>
            </td>
          );
        })}

        {/* Total column */}
        <td
          className={`px-3 py-2 text-sm text-right font-bold whitespace-nowrap border-l border-border ${getTextColor(row.type, row.total.realized)}`}
        >
          {statusFilter === "projected"
            ? formatValue(row.total.projected, "projected", months[0])
            : formatValue(row.total.realized, "realized", months[0])}
        </td>
      </tr>
    );

    // Render children if expanded
    if (hasChildren && isExpanded) {
      row.children!.forEach((child) => {
        rowElements.push(...renderRow(child));
      });
    }

    return rowElements;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum dado detalhado encontrado.</p>
        <p className="text-sm mt-2">
          Execute a sincronização detalhada para popular esta visualização.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50">
          <tr>
            <th className="sticky left-0 z-20 px-3 py-3 text-left text-sm font-semibold bg-muted/50 border-r border-border min-w-[280px]">
              Categoria
            </th>
            {months.map((month, index) => (
              <th
                key={month}
                className="px-3 py-3 text-right text-sm font-semibold whitespace-nowrap"
              >
                {MONTH_LABELS[index]}
              </th>
            ))}
            <th className="px-3 py-3 text-right text-sm font-semibold border-l border-border">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => renderRow(row))}
        </tbody>
      </table>
    </div>
  );
}
