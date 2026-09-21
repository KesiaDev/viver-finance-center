import { useState } from "react";
import { ChevronRight, Layers } from "lucide-react";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, formatCurrency, groupByCategory, type MarveeRecord } from "./MarveeResultHelpers";

interface Props {
  records: MarveeRecord[];
}

const LEVEL_OPTIONS = [
  { value: 1, label: "Cat. Nível 1" },
  { value: 2, label: "Cat. Nível 2" },
  { value: 3, label: "Cat. Nível 3" },
];

const MarveeGroupedView = ({ records }: Props) => {
  const [levels, setLevels] = useState<number[]>([1, 2, 3]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups = groupByCategory(records, levels);
  const grandTotal = groups.reduce((s, g) => s + g.total, 0);
  const grandMovement = groups.reduce((s, g) => s + g.movementTotal, 0);
  const grandCount = groups.reduce((s, g) => s + g.count, 0);

  const toggleLevel = (level: number) => {
    setLevels((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((l) => l !== level);
      }
      return [...prev, level].sort();
    });
    setOpenGroups(new Set());
  };

  const toggle = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleCols = levels.length;
  // colSpan for expanded detail row (chevron col + visible cat cols)
  const detailColSpan = visibleCols + 1;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Agrupar por
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {levels.length}/3
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="end">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Níveis de agrupamento</p>
            <div className="space-y-2">
              {LEVEL_OPTIONS.map((opt) => {
                const checked = levels.includes(opt.value);
                const disabled = checked && levels.length === 1;
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggleLevel(opt.value)}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-auto max-h-[500px] rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-8" />
              {levels.includes(1) && <TableHead className="text-xs">Cat. Nível 1</TableHead>}
              {levels.includes(2) && <TableHead className="text-xs">Cat. Nível 2</TableHead>}
              {levels.includes(3) && <TableHead className="text-xs">Cat. Nível 3</TableHead>}
              <TableHead className="text-xs text-right">Qtd</TableHead>
              <TableHead className="text-xs text-right">Valor Orig.</TableHead>
              <TableHead className="text-xs text-right">Mov. Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => {
              const key = `${g.cat1}||${g.cat2}||${g.cat3}`;
              const isOpen = openGroups.has(key);
              return (
                <>
                  <TableRow
                    key={key}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggle(key)}
                  >
                    <TableCell className="text-xs p-2">
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </TableCell>
                    {levels.includes(1) && <TableCell className="text-xs font-medium">{g.cat1}</TableCell>}
                    {levels.includes(2) && <TableCell className="text-xs">{g.cat2}</TableCell>}
                    {levels.includes(3) && <TableCell className="text-xs">{g.cat3}</TableCell>}
                    <TableCell className="text-xs text-right">{g.count}</TableCell>
                    <TableCell className="text-xs text-right font-medium whitespace-nowrap">{formatCurrency(g.total)}</TableCell>
                    <TableCell className="text-xs text-right font-medium whitespace-nowrap">{formatCurrency(g.movementTotal)}</TableCell>
                  </TableRow>
                  {isOpen && g.records.map((r, i) => (
                    <TableRow key={`${key}-${i}`} className="bg-muted/20">
                      <TableCell />
                      <TableCell className="text-xs text-muted-foreground" colSpan={Math.max(1, visibleCols - 1)}>
                        {formatDate(r.payment_date || r.expiration_date)} · {r.document?.payment_method_type || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {r.document?.people?.fantasy_name || r.document?.people?.name || r.document?.description || "-"}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-xs text-right text-muted-foreground whitespace-nowrap">
                        {formatCurrency(r.original_value)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground whitespace-nowrap">
                        {formatCurrency(r.movement_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell />
              <TableCell colSpan={visibleCols} className="text-xs font-bold">TOTAL</TableCell>
              <TableCell className="text-xs text-right font-bold">{grandCount}</TableCell>
              <TableCell className="text-xs text-right font-bold whitespace-nowrap">{formatCurrency(grandTotal)}</TableCell>
              <TableCell className="text-xs text-right font-bold whitespace-nowrap">{formatCurrency(grandMovement)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default MarveeGroupedView;
