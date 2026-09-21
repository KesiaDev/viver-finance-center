import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusWithComment } from "./StatusWithComment";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { RejectDialog } from "./RejectDialog";
import { EditContratoDialog } from "./EditContratoDialog";
import { RequestStatus } from "./StatusBadge";
import { useContratos } from "@/hooks/useContratos";
import { useAuth } from "@/contexts/AuthContext";
import { ContractPreviewDialog } from "./ContractPreviewDialog";
import { ExternalLink, MoreHorizontal, Check, X, Pencil, Send, RotateCcw, Trash2, Eye } from "lucide-react";
import { ContratoDetailsDialog } from "./ContratoDetailsDialog";

interface ContratosListProps {
  embedded?: boolean;
  data?: any[];
}

export const ContratosList = ({ embedded = false, data }: ContratosListProps) => {
  const { contratos: fetchedContratos, isLoading, updateStatus, isUpdating, deleteContrato, isDeleting, editContrato, isEditing } = useContratos();
  const { canEditAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<any>(null);

  

  const contratos = data ?? fetchedContratos;
  const busy = isUpdating || isDeleting || isEditing;

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) deleteContrato(itemToDelete);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleRejectClick = (id: string) => {
    setItemToReject(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = (comentario: string) => {
    if (itemToReject) updateStatus({ id: itemToReject, status: "rejeitado", comentario });
    setRejectDialogOpen(false);
    setItemToReject(null);
  };

  if (isLoading && !data) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  if (!contratos || contratos.length === 0) {
    if (embedded) return <div className="py-8 text-center text-muted-foreground">Nenhuma solicitação de contrato encontrada</div>;
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Nenhuma solicitação de contrato encontrada</CardContent>
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
              <TableHead className="text-muted-foreground font-medium">Área</TableHead>
              <TableHead className="text-muted-foreground font-medium">Função</TableHead>
              <TableHead className="text-muted-foreground font-medium">Remuneração</TableHead>
              <TableHead className="text-muted-foreground font-medium">Início</TableHead>
              <TableHead className="text-muted-foreground font-medium">Escopo</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Ver</TableHead>
              <TableHead className="text-muted-foreground font-medium">Contrato</TableHead>
              {canEditAdmin && <TableHead className="text-right text-muted-foreground font-medium">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((c: any) => (
              <TableRow key={c.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground">{c.area}</TableCell>
                <TableCell className="text-muted-foreground">{c.funcao}</TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.remuneracao))}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(c.data_inicio_contrato), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="max-w-xs text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate cursor-help">{c.escopo_trabalho}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="whitespace-pre-wrap">{c.escopo_trabalho}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <StatusWithComment status={c.status as RequestStatus} comentario={c.status_comentario} />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedContrato(c); setDetailsDialogOpen(true); }}
                    title="Ver detalhes"
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
                <TableCell>
                  {c.contrato_url ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={c.contrato_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" /> Ver
                      </a>
                    </Button>
                  ) : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                {canEditAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={busy}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {c.status === "pendente" && (
                          <DropdownMenuItem onClick={() => updateStatus({ id: c.id, status: "aprovado" })}>
                            <Check className="w-4 h-4 mr-2" /> Aprovar
                          </DropdownMenuItem>
                        )}
                        {c.status === "aprovado" && (
                          <DropdownMenuItem onClick={() => { setPreviewItemId(c.id); setPreviewDialogOpen(true); }}>
                            <Send className="w-4 h-4 mr-2" /> Enviar para Assinatura
                          </DropdownMenuItem>
                        )}
                        {(c.status === "pendente" || c.status === "aprovado") && (
                          <DropdownMenuItem onClick={() => { setItemToEdit(c); setEditDialogOpen(true); }}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                        )}
                        {c.status !== "rejeitado" && (
                          <DropdownMenuItem onClick={() => handleRejectClick(c.id)}>
                            <X className="w-4 h-4 mr-2" /> Rejeitar
                          </DropdownMenuItem>
                        )}
                        {c.status !== "pendente" && (
                          <DropdownMenuItem onClick={() => updateStatus({ id: c.id, status: "pendente" })}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Voltar para Pendente
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(c.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        title="Excluir Solicitação de Contrato?"
      />
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={busy}
      />
      <EditContratoDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contrato={itemToEdit}
        onSave={(id, data) => editContrato({ id, data })}
        isLoading={isEditing}
      />
      <ContractPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        solicitacaoId={previewItemId}
        onSent={() => {
          queryClient.invalidateQueries({ queryKey: ["contratos"] });
          queryClient.invalidateQueries({ queryKey: ["my-contratos"] });
        }}
      />
      <ContratoDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        contrato={selectedContrato}
      />
    </>
  );

  if (embedded) return tableContent;

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader><CardTitle className="text-primary">Contratos</CardTitle></CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  );
};
