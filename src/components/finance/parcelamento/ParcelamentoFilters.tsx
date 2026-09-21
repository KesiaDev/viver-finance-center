import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ParcelamentoFilters as Filters } from "@/hooks/useHublaEvents";

interface ParcelamentoFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  produtos: string[];
  metodosPagamento: string[];
}

const STATUS_OPTIONS = [
  { value: "on_schedule", label: "Em dia" },
  { value: "off_schedule", label: "Atrasado" },
  { value: "canceled", label: "Cancelado" },
  { value: "completed", label: "Finalizado" },
  { value: "created", label: "Criado" },
];

export function ParcelamentoFilters({
  filters,
  onFiltersChange,
  produtos,
  metodosPagamento,
}: ParcelamentoFiltersProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    updateFilter("status", newStatus);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: [],
      produto: "",
      metodoPagamento: "",
      periodoInicio: null,
      periodoFim: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status.length > 0 ||
    filters.produto ||
    filters.metodoPagamento ||
    filters.periodoInicio ||
    filters.periodoFim;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, email, documento..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Produto */}
        <Select
          value={filters.produto}
          onValueChange={(value) => updateFilter("produto", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            {produtos.map((produto) => (
              <SelectItem key={produto} value={produto}>
                {produto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Método de Pagamento */}
        <Select
          value={filters.metodoPagamento}
          onValueChange={(value) => updateFilter("metodoPagamento", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os métodos</SelectItem>
            {metodosPagamento.map((metodo) => (
              <SelectItem key={metodo} value={metodo}>
                {metodo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período Início */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !filters.periodoInicio && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.periodoInicio
                ? format(filters.periodoInicio, "dd/MM/yyyy", { locale: ptBR })
                : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.periodoInicio || undefined}
              onSelect={(date) => updateFilter("periodoInicio", date || null)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Período Fim */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !filters.periodoFim && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.periodoFim
                ? format(filters.periodoFim, "dd/MM/yyyy", { locale: ptBR })
                : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.periodoFim || undefined}
              onSelect={(date) => updateFilter("periodoFim", date || null)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Status:</span>
        {STATUS_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            variant={filters.status.includes(option.value) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleStatus(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
