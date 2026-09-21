import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type PeriodType = "single" | "range" | "custom";
type RangePreset = "6m" | "12m" | "quarter" | null;

interface PeriodSelectorProps {
  periodType: PeriodType;
  selectedYears: number[];
  rangePreset: RangePreset;
  onPeriodTypeChange: (type: PeriodType) => void;
  onSelectedYearsChange: (years: number[]) => void;
  onRangePresetChange: (preset: RangePreset) => void;
}

export const PeriodSelector = ({
  periodType,
  selectedYears,
  rangePreset,
  onPeriodTypeChange,
  onSelectedYearsChange,
  onRangePresetChange,
}: PeriodSelectorProps) => {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const options = [];
    for (let year = currentYear; year >= 2023; year--) {
      options.push(year);
    }
    return options;
  }, [currentYear]);

  const handlePresetClick = (preset: RangePreset) => {
    onPeriodTypeChange("range");
    onRangePresetChange(preset);
    setOpen(false);
  };

  const handleYearClick = (year: number) => {
    onPeriodTypeChange("single");
    onRangePresetChange(null);
    onSelectedYearsChange([year]);
    setOpen(false);
  };

  const handleYearToggle = (year: number, checked: boolean) => {
    const newYears = checked
      ? [...selectedYears, year].sort((a, b) => a - b)
      : selectedYears.filter((y) => y !== year);
    
    if (newYears.length === 0) {
      newYears.push(currentYear);
    }
    
    onPeriodTypeChange("custom");
    onRangePresetChange(null);
    onSelectedYearsChange(newYears);
  };

  const getPeriodLabel = () => {
    if (periodType === "range" && rangePreset) {
      switch (rangePreset) {
        case "6m":
          return "Últimos 6 meses";
        case "12m":
          return "Últimos 12 meses";
        case "quarter":
          return "Último trimestre";
        default:
          return "Período";
      }
    }

    if (selectedYears.length === 1) {
      return selectedYears[0].toString();
    }

    if (selectedYears.length > 1) {
      const sorted = [...selectedYears].sort((a, b) => a - b);
      return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
    }

    return currentYear.toString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>{getPeriodLabel()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        {/* Anos individuais */}
        <div className="p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Ano
          </p>
          {yearOptions.map((year) => (
            <Button
              key={year}
              variant="ghost"
              className={cn(
                "w-full justify-start font-normal",
                periodType === "single" && selectedYears[0] === year && "bg-accent"
              )}
              onClick={() => handleYearClick(year)}
            >
              {year}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Presets */}
        <div className="p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Períodos
          </p>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start font-normal",
              rangePreset === "quarter" && "bg-accent"
            )}
            onClick={() => handlePresetClick("quarter")}
          >
            Último trimestre
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start font-normal",
              rangePreset === "6m" && "bg-accent"
            )}
            onClick={() => handlePresetClick("6m")}
          >
            Últimos 6 meses
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start font-normal",
              rangePreset === "12m" && "bg-accent"
            )}
            onClick={() => handlePresetClick("12m")}
          >
            Últimos 12 meses
          </Button>
        </div>

        <Separator />

        {/* Seleção múltipla de anos */}
        <div className="p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Combinar anos
          </p>
          <div className="space-y-1 px-2">
            {yearOptions.map((year) => (
              <div key={year} className="flex items-center gap-2 py-1">
                <Checkbox
                  id={`year-${year}`}
                  checked={periodType === "custom" && selectedYears.includes(year)}
                  onCheckedChange={(checked) =>
                    handleYearToggle(year, checked as boolean)
                  }
                />
                <label
                  htmlFor={`year-${year}`}
                  className="text-sm cursor-pointer"
                >
                  {year}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
