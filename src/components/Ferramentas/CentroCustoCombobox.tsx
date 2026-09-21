import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Pencil, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCentrosCusto } from "@/hooks/useCentrosCusto";

interface CentroCustoComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CentroCustoCombobox({ value, onChange }: CentroCustoComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const { centrosCusto, createCentroCusto, updateCentroCusto, isCreating, isUpdating } = useCentrosCusto();

  const filtered = centrosCusto.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const isNew =
    search.trim() !== "" &&
    !centrosCusto.some((c) => c.nome.toLowerCase() === search.trim().toLowerCase());

  const handleSelect = (nome: string) => {
    onChange(nome);
    setSearch("");
    setOpen(false);
  };

  const handleAdd = async () => {
    const nome = search.trim();
    if (!nome) return;
    await createCentroCusto(nome);
    onChange(nome);
    setSearch("");
    setOpen(false);
  };

  const handleSaveEdit = async (id: string) => {
    const nome = editingNome.trim();
    if (!nome) return;
    const old = centrosCusto.find((c) => c.id === id);
    await updateCentroCusto({ id, nome });
    if (old && value === old.nome) onChange(nome);
    setEditingId(null);
    setEditingNome("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Selecione o centro de custo"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite ou selecione..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhum centro de custo encontrado</CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.nome}
                  onSelect={() => {
                    if (editingId !== c.id) handleSelect(c.nome);
                  }}
                  className="flex items-center justify-between"
                >
                  {editingId === c.id ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingNome}
                        onChange={(e) => setEditingNome(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit(c.id);
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        disabled={isUpdating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(c.id);
                        }}
                      >
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn("h-4 w-4", value === c.nome ? "opacity-100" : "opacity-0")}
                        />
                        <span>{c.nome}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(c.id);
                          setEditingNome(c.nome);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </CommandItem>
              ))}
              {isNew && (
                <CommandItem
                  value={search.trim()}
                  onSelect={handleAdd}
                  className="text-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar "{search.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
