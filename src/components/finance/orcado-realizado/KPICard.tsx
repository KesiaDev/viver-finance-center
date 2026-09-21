import { Badge } from "@/components/ui/badge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) =>
  isFinite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "—";

interface KPICardProps {
  label: string;
  sublabel: string;
  value: number;
  variation?: number | null;
  variationPositive?: boolean;
  icon: React.ReactNode;
  decorativeIcon: React.ReactNode;
  highlighted?: boolean;
  statusBadge?: string;
  statusPositive?: boolean;
}

export function KPICard({
  label,
  sublabel,
  value,
  variation,
  variationPositive,
  icon,
  decorativeIcon,
  highlighted,
  statusBadge,
  statusPositive,
}: KPICardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card/40 backdrop-blur-sm p-4 pb-5 transition-all hover:border-primary/30 ${
        highlighted ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border/50"
      }`}
    >
      {/* Decorative icon */}
      <div className="absolute -top-2 -right-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="w-16 h-16 flex items-center justify-center">
          {decorativeIcon}
        </div>
      </div>

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-[10px] font-semibold tracking-wider uppercase">{label}</span>
        </div>
        {variation != null && (
          <Badge
            variant={variationPositive ? "default" : "destructive"}
            className="text-[10px] px-1.5 py-0"
          >
            {formatPercent(variation)}
          </Badge>
        )}
        {statusBadge && (
          <Badge
            variant={statusPositive ? "default" : "destructive"}
            className="text-[10px] px-1.5 py-0"
          >
            {statusBadge}
          </Badge>
        )}
      </div>
      <p className={`text-xl font-bold ${value >= 0 ? "text-foreground" : "text-rose-400"}`}>
        {formatCurrency(value)}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
    </div>
  );
}
