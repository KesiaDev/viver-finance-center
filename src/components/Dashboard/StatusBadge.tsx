import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RequestStatus = "pending" | "approved" | "paid" | "rejected" | 
                           "pendente" | "aprovado" | "pago" | "rejeitado";

interface StatusBadgeProps {
  status: RequestStatus | string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // English values (backwards compatibility)
  pending: {
    label: "Pendente",
    className: "bg-yellow/20 text-yellow border-yellow/50",
  },
  approved: {
    label: "Aprovado",
    className: "bg-neonGreen/20 text-neon-green border-neonGreen/50",
  },
  paid: {
    label: "Pago",
    className: "bg-cyan/20 text-cyan border-cyan/50",
  },
  rejected: {
    label: "Rejeitado",
    className: "bg-red-500/20 text-red-400 border-red-500/50",
  },
  // Portuguese values (used in database)
  pendente: {
    label: "Pendente",
    className: "bg-yellow/20 text-yellow border-yellow/50",
  },
  aprovado: {
    label: "Aprovado",
    className: "bg-neonGreen/20 text-neon-green border-neonGreen/50",
  },
  pago: {
    label: "Pago",
    className: "bg-cyan/20 text-cyan border-cyan/50",
  },
  rejeitado: {
    label: "Rejeitado",
    className: "bg-red-500/20 text-red-400 border-red-500/50",
  },
  assinatura: {
    label: "Em Assinatura",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  if (!config) {
    console.warn(`⚠️ StatusBadge: Status desconhecido "${status}". Usando fallback.`);
  }
  
  const finalConfig = config || {
    label: status || "Desconhecido",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/50",
  };
  
  return (
    <Badge variant="outline" className={cn("font-medium border", finalConfig.className)}>
      {finalConfig.label}
    </Badge>
  );
};
