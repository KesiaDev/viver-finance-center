import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmpresa, GRUPO_CONSOLIDADO } from "@/contexts/EmpresaContext";

export const EmpresaSelector = () => {
  const { empresas, selectedEmpresa, setSelectedEmpresa } = useEmpresa();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
        <SelectTrigger className="h-8 w-[200px] text-xs">
          <SelectValue placeholder="Selecionar empresa" />
        </SelectTrigger>
        <SelectContent>
          {empresas.map((empresa) => (
            <SelectItem key={empresa.id} value={empresa.slug}>
              {empresa.nome}
            </SelectItem>
          ))}
          <SelectItem value={GRUPO_CONSOLIDADO}>Grupo (consolidado)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
