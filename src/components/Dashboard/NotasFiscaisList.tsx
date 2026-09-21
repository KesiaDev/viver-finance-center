import { useState } from "react";
import { format } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { RequestStatus } from "./StatusBadge";
import { StatusWithComment } from "./StatusWithComment";
import { StatusActions } from "./StatusActions";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { AnexosPopover } from "./AnexosPopover";
import { NotaFiscalDetailsDialog } from "./NotaFiscalDetailsDialog";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { useAuth } from "@/contexts/AuthContext";

interface NotasFiscaisListProps {
  embedded?: boolean;
  data?: any[];
}

export const NotasFiscaisList = ({ embedded = false, data }: NotasFiscaisListProps) => {
  const { notasFiscais: fetchedNotasFiscais, isLoading, updateStatus, isUpdating, deleteNotaFiscal, isDeleting } = useNotasFiscais();
  const { canEditAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<any>(null);

  // Use provided data or fetched data
  const notasFiscais = data ?? fetchedNotasFiscais;

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteNotaFiscal(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Build anexos array for popover - use nota_fiscal_anexos if available, else fallback to nota_url
  const getAnexos = (nota: any) => {
    if (nota.nota_fiscal_anexos && nota.nota_fiscal_anexos.length > 0) {
      return nota.nota_fiscal_anexos.map((a: any) => ({
        id: a.id,
        descricao: a.descricao,
        arquivo_url: a.arquivo_url,
      }));
    }
    // Fallback for legacy notas
    if (nota.nota_url) {
      return [{ id: 'legacy', descricao: "Nota Fiscal", arquivo_url: nota.nota_url }];
    }
    return [];
  };

  // Only show loading if we're fetching and no data was provided
  if (isLoading && !data) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (!notasFiscais || notasFiscais.length === 0) {
    if (embedded) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Nenhuma nota fiscal encontrada
        </div>
      );
    }
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma nota fiscal encontrada
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
              <TableHead className="text-muted-foreground font-medium">Descrição</TableHead>
              <TableHead className="text-muted-foreground font-medium">CNPJ</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data</TableHead>
              <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
              <TableHead className="text-muted-foreground font-medium">Período</TableHead>
              <TableHead className="text-muted-foreground font-medium">Pagamento</TableHead>
              <TableHead className="text-muted-foreground font-medium">Chave PIX</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium text-center">Ver</TableHead>
              <TableHead className="text-muted-foreground font-medium">Anexos</TableHead>
              {canEditAdmin && <TableHead className="text-right text-muted-foreground font-medium">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {notasFiscais.map((nota) => (
              <TableRow key={nota.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{nota.nome}</TableCell>
                <TableCell className="text-muted-foreground">{nota.descricao || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{nota.cnpj}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(nota.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(nota.valor))}
                </TableCell>
                <TableCell className="text-muted-foreground">{nota.periodo_referencia}</TableCell>
                <TableCell className="text-muted-foreground">{nota.mes_pagamento || "-"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                  {nota.chave_pix}
                </TableCell>
                <TableCell>
                  <StatusWithComment status={nota.status as RequestStatus} comentario={nota.status_comentario} />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedNota(nota);
                      setDetailsDialogOpen(true);
                    }}
                    title="Ver detalhes"
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
                <TableCell>
                  <AnexosPopover 
                    anexos={getAnexos(nota)} 
                    bucketName="notas-fiscais"
                  />
                </TableCell>
                {canEditAdmin && (
                  <TableCell className="text-right">
                    <StatusActions
                      currentStatus={nota.status as RequestStatus}
                      onStatusChange={(status, comentario) =>
                        updateStatus({ id: nota.id, status, comentario })
                      }
                      onDelete={() => handleDeleteClick(nota.id)}
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
        title="Excluir Nota Fiscal?"
      />
      <NotaFiscalDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        nota={selectedNota}
      />
    </>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Notas Fiscais</CardTitle>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
