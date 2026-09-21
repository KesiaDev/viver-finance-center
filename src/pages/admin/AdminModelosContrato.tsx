import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useModelosContrato, ModeloContrato } from "@/hooks/useModelosContrato";
import { ModeloContratoForm } from "@/components/admin/ModeloContratoForm";
import { DeleteConfirmDialog } from "@/components/Dashboard/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";

const AdminModelosContrato = () => {
  const { modelos, isLoading, createModelo, isCreating, updateModelo, isUpdating, deleteModelo, isDeleting } = useModelosContrato();
  const { canEditAdmin } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloContrato | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = (data: { nome: string; cargo_funcao: string; conteudo: string; is_default: boolean }) => {
    if (editingModelo) {
      updateModelo({ id: editingModelo.id, data });
    } else {
      createModelo(data);
    }
  };

  const handleEdit = (modelo: ModeloContrato) => {
    setEditingModelo(modelo);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingModelo(null);
    setFormOpen(true);
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Modelos de Contrato</h2>
          <p className="text-sm text-muted-foreground">Gerencie os templates de contrato por cargo/função</p>
        </div>
        {canEditAdmin && (
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Modelo
          </Button>
        )}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-subtle">
                <TableHead>Nome</TableHead>
                <TableHead>Cargo/Função</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Tamanho</TableHead>
                {canEditAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelos?.map((m) => (
                <TableRow key={m.id} className="border-subtle hover:bg-card-dark/50">
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.cargo_funcao}</Badge>
                  </TableCell>
                  <TableCell>
                    {m.is_default && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {m.conteudo.length.toLocaleString()} caracteres
                  </TableCell>
                  {canEditAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(m.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {(!modelos || modelos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum modelo cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ModeloContratoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        modelo={editingModelo}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) deleteModelo(deleteId); setDeleteId(null); }}
        title="Excluir Modelo de Contrato?"
      />
    </div>
  );
};

export default AdminModelosContrato;
