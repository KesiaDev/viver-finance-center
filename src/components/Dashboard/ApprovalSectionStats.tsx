import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ApprovalStats {
  pendentes: number;
  aprovados: number;
  rejeitados: number;
  total: number;
  valorPendente: number;
  valorAprovado: number;
  valorRejeitado: number;
  valorTotal: number;
  hasValue?: boolean; // Para categorias sem valor monetário (ex: Materiais)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
};

interface MiniStatCardProps {
  label: string;
  count: number;
  value?: number;
  color: string;
  showValue?: boolean;
}

const MiniStatCard = ({ label, count, value, color, showValue = true }: MiniStatCardProps) => (
  <div className="px-3 py-1.5 border-l border-border/30 min-w-[90px]">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
      {label}
    </p>
    <p className={cn("text-lg font-bold leading-tight", color)}>
      {count}
    </p>
    {showValue && value !== undefined && (
      <p className="text-[11px] text-muted-foreground">
        {formatCurrency(value)}
      </p>
    )}
  </div>
);

interface StatCardProps {
  label: string;
  count: number;
  value?: number;
  color: string;
  bgColor: string;
  showValue?: boolean;
}

const StatCard = ({ label, count, value, color, bgColor, showValue = true }: StatCardProps) => (
  <div className={cn("p-3 rounded-lg", bgColor)}>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className={cn("text-2xl font-bold", color)}>
      {count}
    </p>
    {showValue && value !== undefined && (
      <p className="text-sm text-muted-foreground">
        {formatCurrency(value)}
      </p>
    )}
  </div>
);

interface CompactBadgeProps {
  count: number;
  label: string;
  variant: 'pending' | 'approved' | 'rejected' | 'total';
}

const CompactBadge = ({ count, label, variant }: CompactBadgeProps) => {
  const styles = {
    pending: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    approved: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
    total: "bg-muted text-muted-foreground border-border"
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-medium", styles[variant])}
    >
      {count} {label}
    </Badge>
  );
};

interface ApprovalSectionStatsProps {
  stats: ApprovalStats;
  variant: 'compact' | 'expanded' | 'header';
}

export const ApprovalSectionStats = ({ stats, variant }: ApprovalSectionStatsProps) => {
  const showValue = stats.hasValue !== false;

  // Variante header: cards inline no trigger do accordion
  if (variant === 'header') {
    return (
      <div className="flex items-center gap-0 ml-4 mr-2 flex-1">
        <div className="flex items-center">
          <MiniStatCard 
            label="Pendentes" 
            count={stats.pendentes} 
            value={stats.valorPendente}
            color="text-amber-600 dark:text-amber-400"
            showValue={showValue}
          />
          <MiniStatCard 
            label="Aprovadas" 
            count={stats.aprovados} 
            value={stats.valorAprovado}
            color="text-green-600 dark:text-green-400"
            showValue={showValue}
          />
          <MiniStatCard 
            label="Rejeitadas" 
            count={stats.rejeitados} 
            value={stats.valorRejeitado}
            color="text-red-600 dark:text-red-400"
            showValue={showValue}
          />
        </div>
        
        <Badge 
          variant="outline" 
          className="ml-auto text-xs font-medium bg-muted text-muted-foreground border-border"
        >
          {stats.total} total
        </Badge>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 ml-auto mr-4">
        {stats.pendentes > 0 && (
          <CompactBadge count={stats.pendentes} label="pend." variant="pending" />
        )}
        {stats.aprovados > 0 && (
          <CompactBadge count={stats.aprovados} label="aprov." variant="approved" />
        )}
        {stats.rejeitados > 0 && (
          <CompactBadge count={stats.rejeitados} label="rej." variant="rejected" />
        )}
        <CompactBadge count={stats.total} label="total" variant="total" />
      </div>
    );
  }

  // variant === 'expanded': cards detalhados com valores
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <StatCard 
        label="Pendentes" 
        count={stats.pendentes} 
        value={stats.valorPendente}
        color="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-500/10"
        showValue={showValue}
      />
      <StatCard 
        label="Aprovadas" 
        count={stats.aprovados} 
        value={stats.valorAprovado}
        color="text-green-600 dark:text-green-400"
        bgColor="bg-green-500/10"
        showValue={showValue}
      />
      <StatCard 
        label="Rejeitadas" 
        count={stats.rejeitados} 
        value={stats.valorRejeitado}
        color="text-red-600 dark:text-red-400"
        bgColor="bg-red-500/10"
        showValue={showValue}
      />
      <StatCard 
        label="Total" 
        count={stats.total} 
        value={stats.valorTotal}
        color="text-foreground"
        bgColor="bg-muted/50"
        showValue={showValue}
      />
    </div>
  );
};
