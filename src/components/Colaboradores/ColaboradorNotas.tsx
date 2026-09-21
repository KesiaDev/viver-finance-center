import { useState } from "react";
import { Plus, Pencil, Trash2, MessageSquare, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useColaboradorNotas, ColaboradorNota } from "@/hooks/useColaboradorNotas";
import { DeleteConfirmDialog } from "@/components/Dashboard/DeleteConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ColaboradorNotasProps {
  colaboradorId: string;
}

export const ColaboradorNotas = ({ colaboradorId }: ColaboradorNotasProps) => {
  const { notas, isLoading, createNota, updateNota, deleteNota, isCreating, isUpdating, isDeleting } = 
    useColaboradorNotas(colaboradorId);
  
  const [newNota, setNewNota] = useState("");
  const [editingNota, setEditingNota] = useState<ColaboradorNota | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newNota.trim()) return;
    createNota(newNota, {
      onSuccess: () => setNewNota("")
    });
  };

  const handleStartEdit = (nota: ColaboradorNota) => {
    setEditingNota(nota);
    setEditContent(nota.conteudo);
  };

  const handleSaveEdit = () => {
    if (!editingNota || !editContent.trim()) return;
    updateNota({ id: editingNota.id, conteudo: editContent }, {
      onSuccess: () => {
        setEditingNota(null);
        setEditContent("");
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingNota(null);
    setEditContent("");
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteNota(deletingId);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Note Form */}
      <div className="p-4 rounded-lg border border-subtle bg-card-dark space-y-4">
        <h4 className="font-medium text-sm text-foreground">Adicionar Nota</h4>
        
        <Textarea
          placeholder="Escreva uma anotação sobre este colaborador..."
          value={newNota}
          onChange={(e) => setNewNota(e.target.value)}
          rows={3}
        />
        
        <Button 
          onClick={handleCreate} 
          disabled={!newNota.trim() || isCreating}
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Adicionar Nota
        </Button>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">
          Notas ({notas?.length || 0})
        </h4>
        
        {!notas || notas.length === 0 ? (
          <div className="text-center p-6 border border-subtle rounded-lg bg-card-dark">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Nenhuma nota registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notas.map((nota) => (
              <div
                key={nota.id}
                className="p-4 rounded-lg border border-subtle bg-card-dark"
              >
                {editingNota?.id === nota.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {nota.conteudo}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(nota.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {nota.author_name && ` • por ${nota.author_name}`}
                        {nota.updated_at !== nota.created_at && " (editada)"}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(nota)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(nota.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={handleDelete}
        title="Excluir Nota"
        description="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
      />
    </div>
  );
};
