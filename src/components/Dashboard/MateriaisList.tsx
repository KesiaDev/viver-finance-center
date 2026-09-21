import { useState } from "react";
import { useMateriais } from "@/hooks/useMateriais";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RequestStatus } from "./StatusBadge";
import { StatusWithComment } from "./StatusWithComment";
import { StatusActions } from "./StatusActions";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { format } from "date-fns";
import { Package, ChevronDown, ChevronRight, ExternalLink, Eye } from "lucide-react";
import { MaterialDetailsDialog } from "./MaterialDetailsDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MaterialItem {
  id: string;
  descricao: string;
  link: string | null;
  valor: number;
  quantidade?: number;
}

interface MateriaisListProps {
  embedded?: boolean;
  data?: any[];
}

export const MateriaisList = ({ embedded = false, data }: MateriaisListProps) => {
  const { materiais: fetchedMateriais, isLoading, updateStatus, isUpdating, deleteMaterial, isDeleting } = useMateriais();
  const { canEditAdmin, canApprove } = useAuth();
  const canManageMateriais = canEditAdmin || canApprove('materiais');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  // Use provided data or fetched data
  const materiais = data ?? fetchedMateriais;

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMaterial(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Only show loading if we're fetching and no data was provided
  if (isLoading && !data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando solicitações de materiais...
      </div>
    );
  }

  if (!materiais || materiais.length === 0) {
    if (embedded) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Nenhuma solicitação de material encontrada
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Solicitações de Materiais
          </CardTitle>
          <CardDescription>
            Nenhuma solicitação de material encontrada
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tableContent = (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead className="hidden lg:table-cell">Justificativa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Ver</TableHead>
              <TableHead>Data</TableHead>
              {canManageMateriais && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {materiais.map((material) => {
              const itens = (material as any).material_itens || [];
              const isExpanded = expandedRows.has(material.id);
              const valorTotal = (material as any).valor_total || itens.reduce((acc: number, i: MaterialItem) => acc + (i.valor || 0) * (i.quantidade || 1), 0);

              return (
                <Collapsible key={material.id} asChild open={isExpanded}>
                  <>
                    <TableRow>
                      <TableCell>
                        {itens.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleRow(material.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{material.nome_solicitante}</TableCell>
                      <TableCell>{material.material}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                          {itens.length || 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{material.centro_custo}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate cursor-help">
                                {material.justificativa}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="whitespace-pre-wrap">{material.justificativa}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <StatusWithComment status={material.status as RequestStatus} comentario={material.status_comentario} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedMaterial(material); setDetailsDialogOpen(true); }}
                          title="Ver detalhes"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(material.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      {canManageMateriais && (
                        <TableCell className="text-right">
                          <StatusActions
                            currentStatus={material.status as RequestStatus}
                            onStatusChange={(status, comentario) => updateStatus({ id: material.id, status, comentario })}
                            onDelete={() => handleDeleteClick(material.id)}
                            disabled={isUpdating || isDeleting}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                    {itens.length > 0 && (
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30 hover:bg-muted/50">
                          <TableCell colSpan={canManageMateriais ? 11 : 10} className="p-0">
                            <div className="px-8 py-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Itens da solicitação:</p>
                              <div className="space-y-2">
                                {itens.map((item: MaterialItem) => {
                                  const qtd = item.quantidade || 1;
                                  const totalItem = item.valor * qtd;
                                  return (
                                    <div key={item.id} className="flex items-center justify-between text-sm bg-background rounded px-3 py-2">
                                      <div className="flex items-center gap-3">
                                        <span>{item.descricao}</span>
                                        {item.link && (
                                          <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Ver produto
                                          </a>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                        <span>Qtd: <span className="font-medium text-foreground">{qtd}</span></span>
                                        <span>R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} un.</span>
                                        <span className="font-semibold text-foreground">
                                          Total: R$ {totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    )}
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Material?"
        description="Esta ação não pode ser desfeita."
      />
      <MaterialDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        material={selectedMaterial}
      />
    </>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Solicitações de Materiais
        </CardTitle>
        <CardDescription>
          Gerencie todas as solicitações de materiais
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
