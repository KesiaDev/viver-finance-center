import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { TIPOS_EQUIPAMENTO } from "@/hooks/useEquipamentos";

interface TipoEquipamentoComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipoEquipamentoCombobox({
  value,
  onChange,
}: TipoEquipamentoComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTypes = TIPOS_EQUIPAMENTO.filter((tipo) =>
    tipo.toLowerCase().includes(search.toLowerCase())
  );

  const isCustomType =
    search.trim() !== "" &&
    !TIPOS_EQUIPAMENTO.some(
      (t) => t.toLowerCase() === search.trim().toLowerCase()
    );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearch("");
    setOpen(false);
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
          {value || "Selecione o tipo"}
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
            <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
            <CommandGroup>
              {filteredTypes.map((tipo) => (
                <CommandItem
                  key={tipo}
                  value={tipo}
                  onSelect={() => handleSelect(tipo)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === tipo ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tipo}
                </CommandItem>
              ))}
              {isCustomType && (
                <CommandItem
                  value={search.trim()}
                  onSelect={() => handleSelect(search.trim())}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Usar "{search.trim()}" como tipo
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
