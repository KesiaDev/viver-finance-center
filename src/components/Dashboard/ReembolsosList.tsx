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
import { ReembolsoDetailsDialog } from "./ReembolsoDetailsDialog";
import { useReembolsos } from "@/hooks/useReembolsos";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { AnexosPopover } from "./AnexosPopover";
import { Eye } from "lucide-react";

interface ReembolsosListProps {
  embedded?: boolean;
  data?: any[];
}

export const ReembolsosList = ({ embedded = false, data }: ReembolsosListProps) => {
  const { reembolsos: fetchedReembolsos, isLoading, updateStatus, isUpdating, deleteReembolso, isDeleting } = useReembolsos();
  const { isAdmin, canEditAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedReembolso, setSelectedReembolso] = useState<any>(null);

  // Use provided data or fetched data
  const reembolsos = data ?? fetchedReembolsos;

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteReembolso(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Only show loading if we're fetching and no data was provided
  if (isLoading && !data) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (!reembolsos || reembolsos.length === 0) {
    if (embedded) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Nenhum reembolso encontrado
        </div>
      );
    }
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum reembolso encontrado
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
              <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data</TableHead>
              <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
              <TableHead className="text-muted-foreground font-medium">Motivo</TableHead>
              <TableHead className="text-muted-foreground font-medium">Centro de Custo</TableHead>
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
            {reembolsos.map((reembolso) => (
              <TableRow key={reembolso.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{reembolso.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(reembolso.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(reembolso.valor))}
                </TableCell>
                <TableCell className="max-w-xs text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate cursor-help">
                          {reembolso.motivo}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="whitespace-pre-wrap">{reembolso.motivo}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-muted-foreground">{reembolso.centro_custo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {reembolso.tipo_chave_pix}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                  {reembolso.chave_pix}
                </TableCell>
                <TableCell>
                  <StatusWithComment status={reembolso.status as RequestStatus} comentario={reembolso.status_comentario} />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedReembolso(reembolso); setDetailsDialogOpen(true); }}
                    title="Ver detalhes"
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
                <TableCell className="text-neon-green font-medium">
                  {reembolso.data_prevista_pagamento 
                    ? format(parseISO(reembolso.data_prevista_pagamento), "dd/MM/yyyy", { locale: ptBR })
                    : "Calculando..."}
                </TableCell>
                <TableCell>
                  <AnexosPopover
                    anexos={reembolso.reembolso_anexos || []}
                    bucketName="reembolsos"
                    legacyUrl={reembolso.comprovante_url}
                  />
                </TableCell>
                {canEditAdmin && (
                  <TableCell className="text-right">
                    <StatusActions
                      currentStatus={reembolso.status as RequestStatus}
                      onStatusChange={(status, comentario) =>
                        updateStatus({ id: reembolso.id, status, comentario })
                      }
                      onDelete={() => handleDeleteClick(reembolso.id)}
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
        title="Excluir Reembolso?"
      />
      <ReembolsoDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        reembolso={selectedReembolso}
      />
    </>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Reembolsos</CardTitle>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
