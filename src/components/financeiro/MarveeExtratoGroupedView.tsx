import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  formatCurrency,
  formatDate,
  getExtratoValue,
  getExtratoStatus,
  groupExtratoByFields,
  type MarveeExtratoRecord,
  type ExtratoGroupedRow,
} from "./MarveeResultHelpers";

interface Props {
  records: MarveeExtratoRecord[];
}

const MultiSelectFilter = ({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
}) => {
  const allSelected = selected.size === 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <Filter className="w-3 h-3" />
          {label}
          {!allSelected && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {selected.size}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-xs">
              <Checkbox
                checked={selected.size === 0 || selected.has(opt)}
                onCheckedChange={() => onToggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
        {selected.size > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 text-xs"
            onClick={() => options.forEach((o) => { if (selected.has(o)) onToggle(o); })}
          >
            Limpar filtro
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const ExpandableGroup = ({ group }: { group: ExtratoGroupedRow }) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <TableRow className="cursor-pointer hover:bg-muted/50">
          <TableCell className="w-8">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </TableCell>
          <TableCell className="text-xs font-medium">{group.typecolumn}</TableCell>
          <TableCell className="text-xs">{group.source}</TableCell>
          <TableCell className="text-xs">{group.status}</TableCell>
          <TableCell className="text-xs text-right">{group.count}</TableCell>
          <TableCell className="text-xs text-right font-medium">{formatCurrency(group.total)}</TableCell>
        </TableRow>
      </CollapsibleTrigger>
      <CollapsibleContent asChild>
        <>
          {group.records.map((r, i) => (
            <TableRow key={r.guid || i} className="bg-muted/20">
              <TableCell />
              <TableCell className="text-[11px] text-muted-foreground">
                {r.treasury?.movement_date ? formatDate(r.treasury.movement_date) : "-"}
              </TableCell>
              <TableCell className="text-[11px] text-muted-foreground">{r.account?.name || "-"}</TableCell>
              <TableCell className="text-[11px] text-muted-foreground" colSpan={2}>
                {r.installment?.document?.description || r.treasury?.comments || "-"}
              </TableCell>
              <TableCell className="text-[11px] text-right text-muted-foreground">
                {formatCurrency(getExtratoValue(r))}
              </TableCell>
            </TableRow>
          ))}
        </>
      </CollapsibleContent>
    </Collapsible>
  );
};

const MarveeExtratoGroupedView = ({ records }: Props) => {
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    setter(next);
  };

  const allTypecolumns = useMemo(() => [...new Set(records.map((r) => r.typecolumn))].sort(), [records]);
  const allSources = useMemo(() => [...new Set(records.map((r) => r.source))].sort(), [records]);
  const allStatuses = useMemo(() => [...new Set(records.map((r) => getExtratoStatus(r)))].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter.size > 0 && !typeFilter.has(r.typecolumn)) return false;
      if (sourceFilter.size > 0 && !sourceFilter.has(r.source)) return false;
      if (statusFilter.size > 0 && !statusFilter.has(getExtratoStatus(r))) return false;
      return true;
    });
  }, [records, typeFilter, sourceFilter, statusFilter]);

  const groups = useMemo(() => groupExtratoByFields(filtered), [filtered]);
  const grandTotal = useMemo(() => groups.reduce((s, g) => s + g.total, 0), [groups]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Type Column" options={allTypecolumns} selected={typeFilter} onToggle={(v) => toggle(typeFilter, v, setTypeFilter)} />
        <MultiSelectFilter label="Source" options={allSources} selected={sourceFilter} onToggle={(v) => toggle(sourceFilter, v, setSourceFilter)} />
        <MultiSelectFilter label="Status" options={allStatuses} selected={statusFilter} onToggle={(v) => toggle(statusFilter, v, setStatusFilter)} />
        <Badge variant="outline" className="text-xs">
          {filtered.length}/{records.length} registros
        </Badge>
      </div>

      <ScrollArea className="h-[500px] rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="text-xs">Type Column</TableHead>
              <TableHead className="text-xs">Source</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Qtd</TableHead>
              <TableHead className="text-xs text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g, i) => (
              <ExpandableGroup key={`${g.typecolumn}-${g.source}-${g.status}-${i}`} group={g} />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-xs font-bold">Total Geral</TableCell>
              <TableCell className="text-xs text-right font-bold">{filtered.length}</TableCell>
              <TableCell className="text-xs text-right font-bold">{formatCurrency(grandTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default MarveeExtratoGroupedView;
