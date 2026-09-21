import { useEquipamentosByColaborador, ESTADOS_EQUIPAMENTO } from "@/hooks/useEquipamentos";
import { Badge } from "@/components/ui/badge";
import { Laptop, Package } from "lucide-react";

interface ColaboradorEquipamentosProps {
  colaboradorId: string;
}

export function ColaboradorEquipamentos({ colaboradorId }: ColaboradorEquipamentosProps) {
  const { data: equipamentos, isLoading } = useEquipamentosByColaborador(colaboradorId);

  const getEstadoLabel = (estado: string) => {
    return ESTADOS_EQUIPAMENTO.find((e) => e.value === estado)?.label || estado;
  };

  const getEstadoVariant = (estado: string) => {
    switch (estado) {
      case "novo":
        return "default";
      case "bom":
        return "secondary";
      case "regular":
        return "outline";
      case "danificado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!equipamentos || equipamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-50" />
        <p>Nenhum equipamento vinculado a este colaborador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {equipamentos.map((equipamento) => (
        <div
          key={equipamento.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Laptop className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{equipamento.nome}</p>
              <p className="text-sm text-muted-foreground">
                {equipamento.tipo}
                {equipamento.marca && ` • ${equipamento.marca}`}
                {equipamento.modelo && ` ${equipamento.modelo}`}
              </p>
              {(equipamento.numero_serie || equipamento.patrimonio) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {equipamento.patrimonio && `PAT: ${equipamento.patrimonio}`}
                  {equipamento.patrimonio && equipamento.numero_serie && " • "}
                  {equipamento.numero_serie && `S/N: ${equipamento.numero_serie}`}
                </p>
              )}
            </div>
          </div>
          <Badge variant={getEstadoVariant(equipamento.estado)}>
            {getEstadoLabel(equipamento.estado)}
          </Badge>
        </div>
      ))}
    </div>
  );
}
