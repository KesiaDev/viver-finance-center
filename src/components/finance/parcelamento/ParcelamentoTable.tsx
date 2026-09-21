import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/taxCalculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ParcelamentoAgrupado } from "@/hooks/useHublaEvents";
import { Loader2 } from "lucide-react";

interface ParcelamentoTableProps {
  parcelamentos: ParcelamentoAgrupado[];
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  on_schedule: { bg: "bg-green-500/20", text: "text-green-500" },
  off_schedule: { bg: "bg-destructive/20", text: "text-destructive" },
  canceled: { bg: "bg-muted", text: "text-muted-foreground" },
  completed: { bg: "bg-blue-500/20", text: "text-blue-500" },
  created: { bg: "bg-amber-500/20", text: "text-amber-500" },
  aborted: { bg: "bg-muted", text: "text-muted-foreground" },
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.created;
}

export function ParcelamentoTable({ parcelamentos, isLoading }: ParcelamentoTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (parcelamentos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum parcelamento encontrado</p>
        <p className="text-sm mt-1">Ajuste os filtros ou aguarde novos eventos</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Total Parcelado</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead>Método</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcelamentos.map((p) => {
            const statusStyle = getStatusStyle(p.status);
            
            return (
              <TableRow key={p.id}>
                {/* Total Parcelado */}
                <TableCell>
                  <div>
                    <p className="font-semibold">{formatCurrency(p.valorTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.totalParcelas}x de {formatCurrency(p.valorParcela)}
                    </p>
                  </div>
                </TableCell>

                {/* Cliente */}
                <TableCell>
                  <div>
                    <p className="font-medium">{p.cliente}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </TableCell>

                {/* Produto */}
                <TableCell>
                  <p className="max-w-[200px] truncate" title={p.produto}>
                    {p.produto}
                  </p>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge className={`${statusStyle.bg} ${statusStyle.text} border-0`}>
                    {p.statusLabel}
                  </Badge>
                </TableCell>

                {/* Progresso */}
                <TableCell>
                  <div className="space-y-1 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs">
                      <span>
                        {p.parcelasPagas}/{p.totalParcelas} pagas
                      </span>
                      <span className="font-medium">{p.percentualPago.toFixed(0)}%</span>
                    </div>
                    <Progress value={p.percentualPago} className="h-2" />
                    {p.parcelasAtrasadas > 0 && (
                      <p className="text-xs text-destructive">
                        {p.parcelasAtrasadas} atrasada(s)
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Data Criação */}
                <TableCell>
                  <p className="text-sm">
                    {format(p.dataCriacao, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(p.dataCriacao, "HH:mm", { locale: ptBR })}
                  </p>
                </TableCell>

                {/* Método */}
                <TableCell>
                  <p className="text-sm capitalize">{p.metodoPagamento}</p>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
