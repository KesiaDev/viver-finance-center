import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comentario: string) => void;
  isLoading?: boolean;
}

export const RejectDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RejectDialogProps) => {
  const [comentario, setComentario] = useState("");

  const handleConfirm = () => {
    onConfirm(comentario);
    setComentario("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setComentario("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rejeitar Solicitação</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição. Isso ajudará o solicitante a entender
            a decisão.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="comentario">Motivo da Rejeição (opcional)</Label>
            <Textarea
              id="comentario"
              placeholder="Descreva o motivo da rejeição..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Rejeitando..." : "Confirmar Rejeição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
