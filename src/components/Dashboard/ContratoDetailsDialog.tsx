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

interface ContratoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: {
    id: string;
    nome: string;
    area: string;
    funcao: string;
    remuneracao: number;
    data_inicio_contrato: string;
    escopo_trabalho?: string | null;
    contrato_url?: string | null;
    status?: string | null;
    status_comentario?: string | null;
    created_at: string;
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

export const ContratoDetailsDialog = ({ open, onOpenChange, contrato }: ContratoDetailsDialogProps) => {
  if (!contrato) return null;

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
            <span>Detalhes do Contrato</span>
            <Badge className={getStatusColor(contrato.status)}>{getStatusLabel(contrato.status)}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Informações Gerais</h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Nome" value={contrato.nome} />
              <DetailRow label="Área" value={contrato.area} />
              <DetailRow label="Função" value={contrato.funcao} />
              <DetailRow label="Data de Início" value={format(new Date(contrato.data_inicio_contrato), "dd/MM/yyyy", { locale: ptBR })} />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Remuneração</h4>
            <div className="bg-muted/30 rounded-lg p-3">
              <span className="text-primary font-semibold text-lg">{formatCurrency(Number(contrato.remuneracao))}</span>
            </div>
          </div>
          {contrato.escopo_trabalho && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Escopo de Trabalho</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap">{contrato.escopo_trabalho}</p>
                </div>
              </div>
            </>
          )}
          {contrato.contrato_url && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Contrato</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <a href={contrato.contrato_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4" /> Ver documento
                  </a>
                </div>
              </div>
            </>
          )}
          {contrato.status_comentario && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Comentário da Aprovação</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap">{contrato.status_comentario}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
