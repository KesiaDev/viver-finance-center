import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FinancialPeriod } from "@/types/financial";

interface PeriodSelectorProps {
  periods: FinancialPeriod[];
  selectedPeriodId?: string;
  onSelect: (periodId: string) => void;
  isLoading?: boolean;
}

export const PeriodSelector = ({
  periods,
  selectedPeriodId,
  onSelect,
  isLoading = false,
}: PeriodSelectorProps) => {
  const formatPeriodLabel = (period: FinancialPeriod) => {
    const start = format(new Date(period.start_date), "MMM/yy", { locale: ptBR });
    const end = format(new Date(period.end_date), "MMM/yy", { locale: ptBR });
    return `${period.name} (${start} - ${end})`;
  };

  return (
    <Select
      value={selectedPeriodId}
      onValueChange={onSelect}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione um período" />
      </SelectTrigger>
      <SelectContent>
        {periods.map((period) => (
          <SelectItem key={period.id} value={period.id}>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  period.status === "open" ? "bg-green-500" : "bg-muted"
                }`}
              />
              {formatPeriodLabel(period)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
