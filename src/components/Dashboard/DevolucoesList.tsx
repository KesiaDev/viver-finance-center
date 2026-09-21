import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RequestStatus } from "./StatusBadge";
import { StatusWithComment } from "./StatusWithComment";
import { StatusActions } from "./StatusActions";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { DevolucaoDetailsDialog } from "./DevolucaoDetailsDialog";
import { useDevolucoes } from "@/hooks/useDevolucoes";
import { useAuth } from "@/contexts/AuthContext";
import { AnexosPopover } from "./AnexosPopover";
import { Eye } from "lucide-react";

interface DevolucoesListProps {
  embedded?: boolean;
  data?: any[];
}

export const DevolucoesList = ({ embedded = false, data }: DevolucoesListProps) => {
  const { devolucoes: fetchedDevolucoes, isLoading, updateStatus, isUpdating, deleteDevolucao, isDeleting } = useDevolucoes();
  const { canEditAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<any>(null);

  // Use provided data or fetched data
  const devolucoes = data ?? fetchedDevolucoes;

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteDevolucao(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Only show loading if we're fetching and no data was provided
  if (isLoading && !data) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (!devolucoes || devolucoes.length === 0) {
    if (embedded) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Nenhuma devolução encontrada
        </div>
      );
    }
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma devolução encontrada
        </CardContent>
      </Card>
    );
  }

  const tableContent = (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-subtle hover:bg-card-dark/50">
              <TableHead className="text-muted-foreground font-medium">Cliente</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data</TableHead>
              <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
              <TableHead className="text-muted-foreground font-medium">Motivo</TableHead>
              <TableHead className="text-muted-foreground font-medium">Responsável</TableHead>
              <TableHead className="text-muted-foreground font-medium">Tipo PIX</TableHead>
              <TableHead className="text-muted-foreground font-medium">Chave PIX</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Ver</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data Prevista Pagto</TableHead>
              <TableHead className="text-muted-foreground font-medium">Comprovantes</TableHead>
              {canEditAdmin && <TableHead className="text-right text-muted-foreground font-medium">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {devolucoes.map((devolucao) => (
              <TableRow key={devolucao.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{devolucao.nome_cliente}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(devolucao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(devolucao.valor))}
                </TableCell>
                <TableCell className="max-w-xs text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate cursor-help">
                          {devolucao.motivo}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="whitespace-pre-wrap">{devolucao.motivo}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-muted-foreground">{devolucao.responsavel}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-cyan/10 text-cyan text-xs font-medium border border-cyan/20">
                    {devolucao.tipo_chave_pix || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground max-w-[180px] truncate">
                  {devolucao.chave_pix || 'Não informada'}
                </TableCell>
                <TableCell>
                  <StatusWithComment status={devolucao.status as RequestStatus} comentario={devolucao.status_comentario} />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedDevolucao(devolucao); setDetailsDialogOpen(true); }}
                    title="Ver detalhes"
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
                <TableCell className="text-neon-green font-medium">
                  {devolucao.data_prevista_pagamento 
                    ? format(parseISO(devolucao.data_prevista_pagamento), "dd/MM/yyyy", { locale: ptBR })
                    : "Calculando..."}
                </TableCell>
                <TableCell>
                  <AnexosPopover
                    anexos={devolucao.devolucao_anexos || []}
                    bucketName="devolucoes"
                    legacyUrl={devolucao.comprovante_original_url}
                  />
                </TableCell>
                {canEditAdmin && (
                  <TableCell className="text-right">
                    <StatusActions
                      currentStatus={devolucao.status as RequestStatus}
                      onStatusChange={(status, comentario) =>
                        updateStatus({ id: devolucao.id, status, comentario })
                      }
                      onDelete={() => handleDeleteClick(devolucao.id)}
                      disabled={isUpdating || isDeleting}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Devolução?"
      />
      <DevolucaoDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        devolucao={selectedDevolucao}
      />
    </>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Devoluções</CardTitle>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
