import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge, RequestStatus } from "./StatusBadge";

interface StatusWithCommentProps {
  status: RequestStatus;
  comentario?: string | null;
}

export const StatusWithComment = ({ status, comentario }: StatusWithCommentProps) => {
  const isRejected = status === "rejeitado" || status === "rejected";
  const hasComment = isRejected && comentario;

  return (
    <div className="flex items-center gap-1">
      <StatusBadge status={status} />
      {hasComment && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                <span className="font-semibold">Motivo:</span> {comentario}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
