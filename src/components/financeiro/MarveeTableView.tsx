import { useState, useMemo, useCallback } from "react";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency, type MarveeRecord } from "./MarveeResultHelpers";

interface Props {
  records: MarveeRecord[];
}

type SortableColumn = "expiration_date" | "payment_date" | "original_value" | "movement_value" | "payment_method" | "provider" | "description" | "cat1" | "cat2" | "cat3";

const MarveeTableView = ({ records }: Props) => {
  const [textFilter, setTextFilter] = useState("");
  const [cat1Filter, setCat1Filter] = useState<string[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([]);
  const [onlyDiscrepancies, setOnlyDiscrepancies] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback((column: SortableColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn, sortDirection]);

  const uniqueCat1 = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      const v = r.document?.category_level_1?.description;
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [records]);

  const uniquePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      const v = r.document?.payment_method_type;
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    const lc = textFilter.toLowerCase();
    return records.filter(r => {
      if (lc) {
        const name = (r.document?.people?.fantasy_name || r.document?.people?.name || "").toLowerCase();
        const desc = (r.document?.description || "").toLowerCase();
        if (!name.includes(lc) && !desc.includes(lc)) return false;
      }
      if (cat1Filter.length > 0 && !cat1Filter.includes(r.document?.category_level_1?.description || "")) return false;
      if (paymentMethodFilter.length > 0 && !paymentMethodFilter.includes(r.document?.payment_method_type || "")) return false;
      if (onlyDiscrepancies) {
        const orig = parseFloat(String(r.original_value ?? 0));
        const mov = parseFloat(String(r.movement_value ?? 0));
        if (Math.abs(orig - mov) < 0.01) return false;
      }
      return true;
    });
  }, [records, textFilter, cat1Filter, paymentMethodFilter, onlyDiscrepancies]);

  const getValueForSort = useCallback((r: MarveeRecord, col: SortableColumn): string | number => {
    switch (col) {
      case "expiration_date": return r.expiration_date || "";
      case "payment_date": return r.payment_date || "";
      case "original_value": return parseFloat(String(r.original_value ?? 0));
      case "movement_value": return parseFloat(String(r.movement_value ?? 0));
      case "payment_method": return r.document?.payment_method_type || "";
      case "provider": return r.document?.people?.fantasy_name || r.document?.people?.name || "";
      case "description": return r.document?.description || r.document?.people?.fantasy_name || r.document?.people?.name || "";
      case "cat1": return r.document?.category_level_1?.description || "";
      case "cat2": return r.document?.category_level_2?.description || "";
      case "cat3": return r.document?.category_level_3?.description || "";
      default: return "";
    }
  }, []);

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    const mul = sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = getValueForSort(a, sortColumn);
      const vb = getValueForSort(b, sortColumn);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
      return String(va).localeCompare(String(vb), "pt-BR") * mul;
    });
  }, [filtered, sortColumn, sortDirection, getValueForSort]);

  const totals = useMemo(() => {
    let orig = 0, mov = 0;
    filtered.forEach(r => {
      orig += parseFloat(String(r.original_value ?? 0));
      mov += parseFloat(String(r.movement_value ?? 0));
    });
    return { orig, mov };
  }, [filtered]);

  const hasFilters = textFilter || cat1Filter.length > 0 || paymentMethodFilter.length > 0 || onlyDiscrepancies;

  const clearFilters = () => {
    setTextFilter("");
    setCat1Filter([]);
    setPaymentMethodFilter([]);
    setOnlyDiscrepancies(false);
  };

  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const SortIcon = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const SortableHead = ({ column, children }: { column: SortableColumn; children: React.ReactNode }) => (
    <TableHead className="text-xs">
      <button
        type="button"
        className="flex items-center gap-0 hover:text-foreground transition-colors cursor-pointer"
        onClick={() => handleSort(column)}
      >
        {children}
        <SortIcon column={column} />
      </button>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedor/descrição..."
            value={textFilter}
            onChange={e => setTextFilter(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs gap-1 min-w-[140px] justify-between">
              {cat1Filter.length > 0 ? `${cat1Filter.length} cat.` : "Cat. Nível 1"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {uniqueCat1.map(c => (
                  <label key={c} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-muted rounded">
                    <Checkbox checked={cat1Filter.includes(c)} onCheckedChange={() => toggleArrayFilter(cat1Filter, c, setCat1Filter)} />
                    <span className="truncate">{c}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs gap-1 min-w-[120px] justify-between">
              {paymentMethodFilter.length > 0 ? `${paymentMethodFilter.length} formas` : "Forma Pgto"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {uniquePaymentMethods.map(m => (
                  <label key={m} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-muted rounded">
                    <Checkbox checked={paymentMethodFilter.includes(m)} onCheckedChange={() => toggleArrayFilter(paymentMethodFilter, m, setPaymentMethodFilter)} />
                    <span className="truncate">{m}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
          <Checkbox checked={onlyDiscrepancies} onCheckedChange={v => setOnlyDiscrepancies(!!v)} />
          Discrepâncias
        </label>
        {hasFilters && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Badge variant="outline" className="text-xs ml-auto">
          {filtered.length} de {records.length}
        </Badge>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[500px] rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="expiration_date">Vencimento</SortableHead>
              <SortableHead column="payment_date">Pagamento</SortableHead>
              <SortableHead column="original_value">Valor Orig.</SortableHead>
              <SortableHead column="movement_value">Mov. Valor</SortableHead>
              <SortableHead column="payment_method">Forma Pgto</SortableHead>
              <SortableHead column="provider">Fornecedor/Cliente</SortableHead>
              <SortableHead column="description">Descrição</SortableHead>
              <SortableHead column="cat1">Cat. Nível 1</SortableHead>
              <SortableHead column="cat2">Cat. Nível 2</SortableHead>
              <SortableHead column="cat3">Cat. Nível 3</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r, i) => {
              const orig = parseFloat(String(r.original_value ?? 0));
              const mov = parseFloat(String(r.movement_value ?? 0));
              const isDisc = Math.abs(orig - mov) >= 0.01;
              return (
                <TableRow key={i} className={isDisc ? "bg-destructive/10" : undefined}>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(r.expiration_date)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(r.payment_date)}</TableCell>
                  <TableCell className="text-xs text-right whitespace-nowrap">{formatCurrency(r.original_value)}</TableCell>
                  <TableCell className="text-xs text-right whitespace-nowrap">{formatCurrency(r.movement_value)}</TableCell>
                  <TableCell className="text-xs">{r.document?.payment_method_type || "-"}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{r.document?.people?.fantasy_name || r.document?.people?.name || "-"}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{r.document?.description || r.document?.people?.fantasy_name || r.document?.people?.name || "-"}</TableCell>
                  <TableCell className="text-xs">{r.document?.category_level_1?.description || "-"}</TableCell>
                  <TableCell className="text-xs">{r.document?.category_level_2?.description || "-"}</TableCell>
                  <TableCell className="text-xs">{r.document?.category_level_3?.description || "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="text-xs font-semibold">Totais filtrados</TableCell>
              <TableCell className="text-xs text-right font-semibold whitespace-nowrap">{formatCurrency(totals.orig)}</TableCell>
              <TableCell className="text-xs text-right font-semibold whitespace-nowrap">{formatCurrency(totals.mov)}</TableCell>
              <TableCell colSpan={6} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default MarveeTableView;
