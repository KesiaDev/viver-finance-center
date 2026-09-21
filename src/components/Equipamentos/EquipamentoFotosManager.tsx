import { useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEquipamentoFotos, EquipamentoFoto } from "@/hooks/useEquipamentoFotos";

interface EquipamentoFotosManagerProps {
  equipamentoId: string;
}

export function EquipamentoFotosManager({ equipamentoId }: EquipamentoFotosManagerProps) {
  const { fotos, isLoading, uploadFoto, deleteFoto, getPhotoUrl, isUploading, isDeleting } =
    useEquipamentoFotos(equipamentoId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [descricao, setDescricao] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<EquipamentoFoto | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<EquipamentoFoto | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadFoto.mutateAsync({
      file: selectedFile,
      descricao: descricao || undefined,
    });

    // Limpar estado
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescricao("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescricao("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingPhoto) {
      await deleteFoto.mutateAsync(deletingPhoto);
      setDeletingPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Fotos do Equipamento</Label>

      {/* Grid de fotos existentes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
          >
            <img
              src={getPhotoUrl(foto.arquivo_url)}
              alt={foto.descricao || "Foto do equipamento"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => setViewingPhoto(foto)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={() => setDeletingPhoto(foto)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {foto.descricao && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                {foto.descricao}
              </div>
            )}
          </div>
        ))}

        {/* Botão de adicionar ou preview do upload */}
        {previewUrl ? (
          <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary bg-muted">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={handleCancelUpload}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Adicionar</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        )}
      </div>

      {/* Campos para upload */}
      {selectedFile && (
        <div className="flex items-end gap-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex-1">
            <Label htmlFor="descricao-foto" className="text-sm">
              Descrição (opcional)
            </Label>
            <Input
              id="descricao-foto"
              placeholder="Ex: Frente do equipamento, Etiqueta de patrimônio..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              "Enviar Foto"
            )}
          </Button>
        </div>
      )}

      {fotos.length === 0 && !previewUrl && (
        <p className="text-sm text-muted-foreground">
          Nenhuma foto adicionada. Clique no botão acima para adicionar fotos do equipamento.
        </p>
      )}

      {/* Dialog para visualização ampliada */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewingPhoto?.descricao || "Foto do Equipamento"}
            </DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <img
              src={getPhotoUrl(viewingPhoto.arquivo_url)}
              alt={viewingPhoto.descricao || "Foto do equipamento"}
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingPhoto} onOpenChange={() => setDeletingPhoto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A foto será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
