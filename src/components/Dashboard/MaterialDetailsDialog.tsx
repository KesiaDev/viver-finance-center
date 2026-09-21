import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";

interface MaterialItem {
  id: string;
  descricao: string;
  link: string | null;
  valor: number;
  quantidade?: number;
}

interface MaterialDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: {
    id: string;
    nome_solicitante: string;
    material: string;
    centro_custo: string;
    justificativa: string;
    valor_total?: number | null;
    status?: string | null;
    status_comentario?: string | null;
    created_at: string;
    material_itens?: MaterialItem[];
  } | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getStatusColor = (status: string | null | undefined) => {
  switch (status) {
    case "aprovado": return "bg-neon-green/20 text-neon-green border-neon-green/30";
    case "rejeitado": return "bg-magenta/20 text-magenta border-magenta/30";
    default: return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
  }
};

const getStatusLabel = (status: string | null | undefined) => {
  switch (status) {
    case "aprovado": return "Aprovado";
    case "rejeitado": return "Rejeitado";
    default: return "Pendente";
  }
};

export const MaterialDetailsDialog = ({ open, onOpenChange, material }: MaterialDetailsDialogProps) => {
  if (!material) return null;

  const itens = material.material_itens || [];
  const valorTotal = material.valor_total || itens.reduce((acc, i) => acc + (i.valor || 0) * (i.quantidade || 1), 0);

  const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <span className="text-muted-foreground text-sm min-w-[140px] shrink-0">{label}</span>
      <span className="text-foreground break-all">{value || "-"}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>Detalhes do Material</span>
            <Badge className={getStatusColor(material.status)}>{getStatusLabel(material.status)}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Informações Gerais</h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Solicitante" value={material.nome_solicitante} />
              <DetailRow label="Data" value={format(new Date(material.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
              <DetailRow label="Centro de Custo" value={material.centro_custo} />
              <DetailRow label="Valor Total" value={formatCurrency(valorTotal)} />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Justificativa</h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-foreground text-sm whitespace-pre-wrap">{material.justificativa}</p>
            </div>
          </div>
          {itens.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Itens da Solicitação ({itens.length})</h4>
                <div className="space-y-2">
                  {itens.map((item) => {
                    const qtd = item.quantidade || 1;
                    const totalItem = item.valor * qtd;
                    return (
                      <div key={item.id} className="bg-muted/30 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-foreground text-sm font-medium">{item.descricao}</span>
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 shrink-0 text-sm">
                                <ExternalLink className="h-3 w-3" /> Ver
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Qtd: <span className="font-medium text-foreground">{qtd}</span></span>
                          <span>Unit.: <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span></span>
                          <span className="ml-auto font-semibold text-foreground text-sm">{formatCurrency(totalItem)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          {material.status_comentario && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Comentário da Aprovação</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap">{material.status_comentario}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
