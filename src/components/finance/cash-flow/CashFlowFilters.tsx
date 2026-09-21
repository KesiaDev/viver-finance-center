import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusFilter } from "@/hooks/useCashFlowData";

interface CashFlowFiltersProps {
  presentation: "grouped" | "detailed";
  onPresentationChange: (value: "grouped" | "detailed") => void;
  showPercentage: boolean;
  onShowPercentageChange: (value: boolean) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  year: number;
  onYearChange: (value: number) => void;
}

export const CashFlowFilters = ({
  presentation,
  onPresentationChange,
  showPercentage,
  onShowPercentageChange,
  statusFilter,
  onStatusFilterChange,
  year,
  onYearChange,
}: CashFlowFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Apresentação:</span>
        <Select value={presentation} onValueChange={onPresentationChange}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grouped">Agrupado</SelectItem>
            <SelectItem value="detailed">Detalhado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Representação:</span>
        <Select
          value={showPercentage ? "with-percentage" : "without-percentage"}
          onValueChange={(v) => onShowPercentageChange(v === "with-percentage")}
        >
          <SelectTrigger className="w-[100px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="without-percentage">Sem %</SelectItem>
            <SelectItem value="with-percentage">Com %</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[110px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realized">Realizado</SelectItem>
            <SelectItem value="projected">Previsto</SelectItem>
            <SelectItem value="both">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Ano:</span>
        <Select value={year.toString()} onValueChange={(v) => onYearChange(Number(v))}>
          <SelectTrigger className="w-[90px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
