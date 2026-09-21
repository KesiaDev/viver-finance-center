import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export interface ApprovalFiltersState {
  statusFilter: string;
  periodFilter: string;
  dateFrom: string | null;
  dateTo: string | null;
}

interface ApprovalFiltersProps {
  filters: ApprovalFiltersState;
  onStatusChange: (status: string) => void;
  onPeriodChange: (period: string) => void;
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "pendente", label: "Pendentes" },
  { value: "aprovado", label: "Aprovados" },
  { value: "rejeitado", label: "Rejeitados" },
];

const periodOptions = [
  { value: "todos", label: "Todo o período" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mês" },
  { value: "trimestre", label: "Últimos 3 meses" },
  { value: "ano", label: "Este ano" },
  { value: "custom", label: "Personalizado" },
];

export const ApprovalFilters = ({
  filters,
  onStatusChange,
  onPeriodChange,
  onDateRangeChange,
  onClearFilters,
}: ApprovalFiltersProps) => {
  const hasActiveFilters = 
    filters.statusFilter !== "todos" || 
    filters.periodFilter !== "todos";

  const dateRange: DateRange = {
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  };

  const handlePeriodChange = (period: string) => {
    onPeriodChange(period);
    // Limpa as datas customizadas se mudar para outro período
    if (period !== "custom") {
      onDateRangeChange({ from: undefined, to: undefined });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-subtle rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
      
      {/* Status Filter */}
      <Select value={filters.statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Period Filter */}
      <Select value={filters.periodFilter} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[170px] bg-background">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Picker - só aparece quando período é "custom" */}
      {filters.periodFilter === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[260px] justify-start text-left font-normal bg-background",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
};

// Helper functions for filtering data
export const getDateRangeFromPeriod = (
  periodFilter: string,
  dateFrom: string | null,
  dateTo: string | null
): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  
  switch (periodFilter) {
    case "todos":
      return { startDate: null, endDate: null };
    case "hoje":
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case "semana":
      return { startDate: startOfWeek(now, { locale: ptBR }), endDate: now };
    case "mes":
      return { startDate: startOfMonth(now), endDate: now };
    case "trimestre":
      return { startDate: subMonths(now, 3), endDate: now };
    case "ano":
      return { startDate: startOfYear(now), endDate: now };
    case "custom":
      return {
        startDate: dateFrom ? new Date(dateFrom) : null,
        endDate: dateTo ? endOfDay(new Date(dateTo)) : null,
      };
    default:
      return { startDate: null, endDate: null };
  }
};

export const filterItemsByDate = <T extends { created_at: string }>(
  items: T[] | undefined,
  periodFilter: string,
  dateFrom: string | null,
  dateTo: string | null
): T[] => {
  if (!items) return [];
  
  const { startDate, endDate } = getDateRangeFromPeriod(periodFilter, dateFrom, dateTo);
  
  if (!startDate && !endDate) return items;
  
  return items.filter((item) => {
    const itemDate = new Date(item.created_at);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });
};

export const filterItemsByStatus = <T extends { status: string | null }>(
  items: T[] | undefined,
  statusFilter: string
): T[] => {
  if (!items) return [];
  if (statusFilter === "todos") return items;
  return items.filter((item) => item.status === statusFilter);
};
