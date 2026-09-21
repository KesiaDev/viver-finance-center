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
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface NotaFiscalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nota: {
    id: string;
    nome: string;
    cnpj: string;
    valor: number;
    chave_pix: string;
    tipo_chave_pix?: string | null;
    periodo_referencia: string;
    mes_pagamento?: string | null;
    descricao?: string | null;
    status?: string | null;
    status_comentario?: string | null;
    created_at: string;
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
    tipo_conta?: string | null;
  } | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const getStatusColor = (status: string | null | undefined) => {
  switch (status) {
    case "aprovado":
      return "bg-neon-green/20 text-neon-green border-neon-green/30";
    case "rejeitado":
      return "bg-magenta/20 text-magenta border-magenta/30";
    default:
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
  }
};

const getStatusLabel = (status: string | null | undefined) => {
  switch (status) {
    case "aprovado":
      return "Aprovado";
    case "rejeitado":
      return "Rejeitado";
    default:
      return "Pendente";
  }
};

const formatTipoChavePix = (tipo: string | null | undefined) => {
  switch (tipo) {
    case "cpf":
      return "CPF";
    case "cnpj":
      return "CNPJ";
    case "email":
      return "E-mail";
    case "telefone":
      return "Telefone";
    case "aleatoria":
      return "Chave Aleatória";
    default:
      return tipo || "-";
  }
};

export const NotaFiscalDetailsDialog = ({
  open,
  onOpenChange,
  nota,
}: NotaFiscalDetailsDialogProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!nota) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const DetailRow = ({
    label,
    value,
    copyable = false,
    fieldKey,
    mono = false,
  }: {
    label: string;
    value: string | null | undefined;
    copyable?: boolean;
    fieldKey?: string;
    mono?: boolean;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <span className="text-muted-foreground text-sm min-w-[140px] shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          className={`text-foreground break-all ${mono ? "font-mono text-sm" : ""}`}
        >
          {value || "-"}
        </span>
        {copyable && value && (
          <button
            onClick={() => copyToClipboard(value, fieldKey || label)}
            className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
            title="Copiar"
          >
            {copiedField === (fieldKey || label) ? (
              <Check className="h-4 w-4 text-neon-green" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
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
            <span>Detalhes da Nota Fiscal</span>
            <Badge className={getStatusColor(nota.status)}>
              {getStatusLabel(nota.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Gerais */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">
              Informações Gerais
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow label="Nome" value={nota.nome} />
              <DetailRow label="CNPJ" value={nota.cnpj} copyable fieldKey="cnpj" mono />
              <DetailRow
                label="Data de Envio"
                value={format(new Date(nota.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              />
              <DetailRow
                label="Valor"
                value={formatCurrency(Number(nota.valor))}
              />
            </div>
          </div>

          <Separator />

          {/* Períodos */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">
              Períodos
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow
                label="Período de Referência"
                value={nota.periodo_referencia}
              />
              <DetailRow
                label="Mês de Pagamento"
                value={nota.mes_pagamento}
              />
            </div>
          </div>

          <Separator />

          {/* Dados Bancários */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">
              Dados para Pagamento
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <DetailRow
                label="Tipo de Chave PIX"
                value={formatTipoChavePix(nota.tipo_chave_pix)}
              />
              <DetailRow
                label="Chave PIX"
                value={nota.chave_pix}
                copyable
                fieldKey="pix"
                mono
              />
              {nota.banco && <DetailRow label="Banco" value={nota.banco} />}
              {nota.agencia && (
                <DetailRow label="Agência" value={nota.agencia} mono />
              )}
              {nota.conta && (
                <DetailRow label="Conta" value={nota.conta} mono />
              )}
              {nota.tipo_conta && (
                <DetailRow label="Tipo de Conta" value={nota.tipo_conta} />
              )}
            </div>
          </div>

          {/* Descrição */}
          {nota.descricao && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">
                  Observações
                </h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap">
                    {nota.descricao}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Comentário do Status */}
          {nota.status_comentario && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">
                  Comentário da Aprovação
                </h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap">
                    {nota.status_comentario}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
