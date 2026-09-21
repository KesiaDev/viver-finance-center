import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DevolucaoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devolucao: {
    id: string;
    nome_cliente: string;
    valor: number;
    motivo: string;
    responsavel: string;
    tipo_chave_pix: string;
    chave_pix: string;
    link_venda_hubla?: string;
    data_prevista_pagamento?: string | null;
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

export const DevolucaoDetailsDialog = ({ open, onOpenChange, devolucao }: DevolucaoDetailsDialogProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!devolucao) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const DetailRow = ({ label, value, copyable = false, fieldKey, mono = false }: {
    label: string; value: string | null | undefined; copyable?: boolean; fieldKey?: string; mono?: boolean;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <span className="text-muted-foreground text-sm min-w-[140px] shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`text-foreground break-all ${mono ? "font-mono text-sm" : ""}`}>{value || "-"}</span>
        {copyable && value && (
          <button onClick={() => copyToClipboard(value, fieldKey || label)} className="shrink-0 p-1 rounded hover:bg-muted transition-colors" title="Copiar">
            {copiedField === (fieldKey || label) ? <Check className="h-4 w-4 text-neon-green" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>Detalhes da Devolução</span>
            <Badge className={getStatusColor(devolucao.status)}>{getStatusLabel(devolucao.status)}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Informações Gerais</h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Cliente" value={devolucao.nome_cliente} />
              <DetailRow label="Data de Envio" value={format(new Date(devolucao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
              <DetailRow label="Valor" value={formatCurrency(Number(devolucao.valor))} />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Detalhes</h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Responsável" value={devolucao.responsavel} />
              {devolucao.link_venda_hubla && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
                  <span className="text-muted-foreground text-sm min-w-[140px] shrink-0">Link Hubla</span>
                  <a href={devolucao.link_venda_hubla} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-sm">
                    {devolucao.link_venda_hubla}
                  </a>
                </div>
              )}
              <div className="flex flex-col gap-1 py-2">
                <span className="text-muted-foreground text-sm">Motivo</span>
                <p className="text-foreground text-sm whitespace-pre-wrap">{devolucao.motivo}</p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Dados para Pagamento</h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Tipo Chave PIX" value={devolucao.tipo_chave_pix} />
              <DetailRow label="Chave PIX" value={devolucao.chave_pix} copyable fieldKey="pix" mono />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Previsão</h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Data Prevista Pagto" value={devolucao.data_prevista_pagamento ? format(parseISO(devolucao.data_prevista_pagamento), "dd/MM/yyyy", { locale: ptBR }) : "Calculando..."} />
            </div>
          </div>
          {devolucao.status_comentario && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">Comentário da Aprovação</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap">{devolucao.status_comentario}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
