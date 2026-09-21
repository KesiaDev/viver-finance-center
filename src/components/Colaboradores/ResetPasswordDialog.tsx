import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Colaborador, useColaboradores } from "@/hooks/useColaboradores";

interface ResetPasswordDialogProps {
  colaborador: Colaborador;
  open: boolean;
  onClose: () => void;
}

export const ResetPasswordDialog = ({ colaborador, open, onClose }: ResetPasswordDialogProps) => {
  const { resetPassword, isResetting } = useColaboradores();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      return;
    }

    if (colaborador.user_id) {
      resetPassword(
        { userId: colaborador.user_id, newPassword },
        {
          onSuccess: () => {
            setNewPassword("");
            onClose();
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar Senha</DialogTitle>
          <DialogDescription>
            Digite uma nova senha para <strong>{colaborador.nome}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A senha deve ter no mínimo 8 caracteres
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isResetting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isResetting || newPassword.length < 8}>
              {isResetting ? "Resetando..." : "Resetar Senha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
