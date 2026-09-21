import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr",
  "Mai", "Jun", "Jul", "Ago",
  "Set", "Out", "Nov", "Dez"
];

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface MonthPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MonthPicker({ 
  value, 
  onChange, 
  placeholder = "Selecione o mês",
  disabled = false,
  className 
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(() => {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      return parseInt(value.split("-")[0]);
    }
    return new Date().getFullYear();
  });

  // Parse the current value
  const selectedYear = value && /^\d{4}-\d{2}$/.test(value) 
    ? parseInt(value.split("-")[0]) 
    : null;
  const selectedMonth = value && /^\d{4}-\d{2}$/.test(value) 
    ? parseInt(value.split("-")[1]) - 1 
    : null;

  const handleMonthSelect = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${month}`);
    setOpen(false);
  };

  const formatDisplayValue = () => {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) {
      return null;
    }
    const [year, month] = value.split("-");
    const monthIndex = parseInt(month) - 1;
    return `${MONTHS_FULL[monthIndex]} ${year}`;
  };

  const displayValue = formatDisplayValue();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 pointer-events-auto" align="start">
        <div className="p-3">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">{viewYear}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewYear(y => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((month, index) => {
              const isSelected = selectedYear === viewYear && selectedMonth === index;
              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleMonthSelect(index)}
                >
                  {month}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
