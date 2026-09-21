import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, DollarSign, Trash2 } from "lucide-react";
import { RequestStatus } from "./StatusBadge";
import { RejectDialog } from "./RejectDialog";

interface StatusActionsProps {
  currentStatus: RequestStatus;
  onStatusChange: (status: RequestStatus, comentario?: string) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const StatusActions = ({ currentStatus, onStatusChange, onDelete, disabled }: StatusActionsProps) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const handleRejectClick = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = (comentario: string) => {
    onStatusChange("rejeitado", comentario);
    setRejectDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus !== "aprovado" && currentStatus !== "approved" && (
            <DropdownMenuItem onClick={() => onStatusChange("aprovado")}>
              <Check className="w-4 h-4 mr-2" />
              Aprovar
            </DropdownMenuItem>
          )}
          {(currentStatus === "aprovado" || currentStatus === "approved") && (
            <DropdownMenuItem onClick={() => onStatusChange("pago")}>
              <DollarSign className="w-4 h-4 mr-2" />
              Marcar como Pago
            </DropdownMenuItem>
          )}
          {currentStatus !== "rejeitado" && currentStatus !== "rejected" && (
            <DropdownMenuItem onClick={handleRejectClick}>
              <X className="w-4 h-4 mr-2" />
              Rejeitar
            </DropdownMenuItem>
          )}
          {currentStatus !== "pendente" && currentStatus !== "pending" && (
            <DropdownMenuItem onClick={() => onStatusChange("pendente")}>
              Voltar para Pendente
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        isLoading={disabled}
      />
    </>
  );
};
