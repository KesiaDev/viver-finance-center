import { useState, useMemo, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/taxCalculations";
import { CashFlowRow, StatusFilter } from "@/hooks/useCashFlowData";
import { useAuth } from "@/contexts/AuthContext";

interface CashFlowTableProps {
  rows: CashFlowRow[];
  months: string[];
  isLoading: boolean;
  statusFilter: StatusFilter;
  showPercentage: boolean;
  presentation: "grouped" | "detailed";
  onCellEdit?: (code: string, month: string, value: number, type: "realized" | "projected") => void;
}

interface EditingCell {
  code: string;
  month: string;
  type: "realized" | "projected";
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export const CashFlowTable = ({
  rows,
  months,
  isLoading,
  statusFilter,
  showPercentage,
  presentation,
  onCellEdit,
}: CashFlowTableProps) => {
  const { canEditFinance } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["01", "02"]));
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focar no input quando entrar em modo de edição
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

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

  // Verificar se uma célula é editável
  const isEditable = (row: CashFlowRow, month: string) => {
    // Saldo Inicial (código "00") - apenas primeiro mês (janeiro)
    if (row.code === "00") {
      return month.endsWith("-01");
    }
    // Categorias filhas não calculadas são editáveis
    return !row.isCalculated && !row.isParent;
  };

  const startEditing = (code: string, month: string, value: number, type: "realized" | "projected") => {
    setEditingCell({ code, month, type });
    setEditValue(value === 0 ? "" : value.toString());
  };

  const handleSaveEdit = () => {
    if (!editingCell || !onCellEdit) return;
    
    const numValue = parseFloat(editValue.replace(/[^\d.-]/g, "")) || 0;
    onCellEdit(editingCell.code, editingCell.month, numValue, editingCell.type);
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  // Calcular totais para percentuais
  const totals = useMemo(() => {
    const result = { realized: 0, projected: 0 };
    rows.forEach((row) => {
      if (row.code === "01" || row.code === "03") {
        result.realized += row.total.realized;
        result.projected += row.total.projected;
      }
    });
    return result;
  }, [rows]);

  const formatValue = (value: number, type: "realized" | "projected") => {
    const formatted = formatCurrency(value);
    if (showPercentage && totals[type] > 0) {
      const percentage = ((Math.abs(value) / totals[type]) * 100).toFixed(1);
      return `${formatted} (${percentage}%)`;
    }
    return formatted;
  };

  // Retorna classes de fundo para a linha (row) e para a célula sticky (100% sólida)
  const getRowBackground = (type: string, isParent: boolean, isCalculated: boolean) => {
    if (isCalculated && !isParent) {
      return { row: "bg-muted/50", sticky: "bg-slate-800" };
    }
    if (type === "revenue") {
      return isParent 
        ? { row: "bg-emerald-950/30", sticky: "bg-emerald-950" }
        : { row: "bg-emerald-950/10", sticky: "bg-emerald-900" };
    }
    if (type === "expense") {
      return isParent 
        ? { row: "bg-red-950/30", sticky: "bg-red-950" }
        : { row: "bg-red-950/10", sticky: "bg-red-900" };
    }
    if (type === "distribution") {
      return isParent 
        ? { row: "bg-orange-950/30", sticky: "bg-orange-950" }
        : { row: "bg-orange-950/10", sticky: "bg-orange-900" };
    }
    if (type === "balance") {
      return { row: "bg-slate-800/50", sticky: "bg-slate-700" };
    }
    return { row: "", sticky: "bg-slate-900" };
  };

  const getTextColor = (type: string, isCalculated: boolean) => {
    if (isCalculated) return "text-foreground font-semibold";
    if (type === "revenue") return "text-emerald-400";
    if (type === "expense") return "text-red-400";
    if (type === "distribution") return "text-orange-400";
    return "text-foreground";
  };

  const renderRow = (row: CashFlowRow, isChild = false) => {
    const isExpanded = expandedRows.has(row.code);
    const hasChildren = row.children && row.children.length > 0;
    // No modo "grouped", NUNCA mostrar filhos
    // No modo "detailed", mostrar filhos apenas se expandido
    const showChildren = presentation === "detailed" && isExpanded;
    const bgClasses = getRowBackground(row.type, row.isParent, row.isCalculated);
    const textClass = getTextColor(row.type, row.isCalculated);

    return (
      <>
        <tr
          key={row.code}
          className={cn(bgClasses.row, "hover:bg-muted/20 transition-colors border-b border-border")}
        >
          <td
            className={cn(
              "sticky left-0 z-10 font-medium whitespace-nowrap min-w-[280px] p-4 align-middle",
              bgClasses.sticky,
              textClass,
              isChild && "pl-8"
            )}
          >
            <div className="flex items-center gap-2">
              {hasChildren && !isChild && presentation === "detailed" && (
                <button
                  onClick={() => toggleRow(row.code)}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {(!hasChildren || presentation === "grouped") && !isChild && <span className="w-5" />}
              <span>
                {row.code !== "GCO" && row.code !== "GCP" && row.code !== "SF" && row.code !== "00"
                  ? `${row.code} - `
                  : ""}
                {row.name}
              </span>
            </div>
          </td>

          {months.map((month) => {
            const monthValue = row.values[month] || { realized: 0, projected: 0 };
            const canEdit = isEditable(row, month);
            
            const renderEditableValue = (value: number, type: "realized" | "projected", showLabel?: boolean) => {
              const isEditMode = editingCell?.code === row.code && 
                                 editingCell?.month === month && 
                                 editingCell?.type === type;
              
              if (isEditMode) {
                return (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-b border-primary text-right outline-none text-sm"
                  />
                );
              }
              
              if (canEdit && onCellEdit && canEditFinance) {
                return (
                  <span 
                    className="cursor-pointer hover:underline hover:text-primary inline-flex items-center gap-1 justify-end group"
                    onDoubleClick={() => startEditing(row.code, month, value, type)}
                    title="Clique duas vezes para editar"
                  >
                    {formatValue(value, type)}
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                  </span>
                );
              }
              
              return <span>{formatValue(value, type)}</span>;
            };
            
            if (statusFilter === "both") {
              return (
                <td key={month} className={cn("text-right text-xs p-4 align-middle", textClass)}>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px]">R:</span>
                    {renderEditableValue(monthValue.realized, "realized")}
                    <span className="text-muted-foreground text-[10px] mt-1">P:</span>
                    <span className="text-muted-foreground">
                      {renderEditableValue(monthValue.projected, "projected")}
                    </span>
                  </div>
                </td>
              );
            }
            
            const value = statusFilter === "realized" ? monthValue.realized : monthValue.projected;
            return (
              <td key={month} className={cn("text-right text-sm p-4 align-middle", textClass)}>
                {renderEditableValue(value, statusFilter)}
              </td>
            );
          })}

          <td className={cn("text-right font-semibold text-sm p-4 align-middle", textClass)}>
            {statusFilter === "both" ? (
              <div className="flex flex-col">
                <span>{formatValue(row.total.realized, "realized")}</span>
                <span className="text-muted-foreground">
                  {formatValue(row.total.projected, "projected")}
                </span>
              </div>
            ) : (
              formatValue(
                statusFilter === "realized" ? row.total.realized : row.total.projected,
                statusFilter
              )
            )}
          </td>
        </tr>

        {/* Render children if expanded or detailed */}
        {hasChildren && showChildren && row.children!.map((child) => renderRow(child, true))}
      </>
    );
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

  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="bg-muted/50 border-b border-border">
            <th className="sticky left-0 z-20 bg-slate-800 min-w-[280px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Categoria
            </th>
            {months.map((month, index) => (
              <th key={month} className="text-right min-w-[100px] h-12 px-4 align-middle font-medium text-muted-foreground">
                {MONTH_LABELS[index]}
              </th>
            ))}
            <th className="text-right min-w-[120px] h-12 px-4 align-middle font-bold text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {rows.map((row) => renderRow(row))}
        </tbody>
      </table>
    </div>
  );
};
