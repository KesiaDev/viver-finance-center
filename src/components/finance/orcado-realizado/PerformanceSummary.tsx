import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface PerformanceSummaryProps {
  receitaPrevista: number;
  receitaRealizada: number;
  receitaMeta: number;
  despesaPrevista: number;
  despesaRealizada: number;
  despesaMeta: number;
}

function getRevenueStatus(pct: number) {
  if (pct >= 100) return { label: "No Alvo", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400", bar: "[&>div]:bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.4)]" };
  if (pct >= 80) return { label: "Atenção", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30 text-amber-400", bar: "[&>div]:bg-amber-500", glow: "shadow-[0_0_8px_rgba(245,158,11,0.4)]" };
  return { label: "Crítico", color: "text-rose-400", bg: "bg-rose-500/20 border-rose-500/30 text-rose-400", bar: "[&>div]:bg-rose-500", glow: "shadow-[0_0_8px_rgba(244,63,94,0.4)]" };
}

function getExpenseStatus(pct: number) {
  if (pct <= 100) return { label: "Controlada", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400", bar: "[&>div]:bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.4)]" };
  if (pct <= 120) return { label: "Atenção", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30 text-amber-400", bar: "[&>div]:bg-amber-500", glow: "shadow-[0_0_8px_rgba(245,158,11,0.4)]" };
  return { label: "Estourou", color: "text-rose-400", bg: "bg-rose-500/20 border-rose-500/30 text-rose-400", bar: "[&>div]:bg-rose-500", glow: "shadow-[0_0_8px_rgba(244,63,94,0.4)]" };
}

function MetricCell({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="bg-card/30 border border-border/30 rounded-lg p-2.5 space-y-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={`text-sm font-semibold ${highlight || "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function PerformanceSummary({
  receitaPrevista, receitaRealizada, receitaMeta,
  despesaPrevista, despesaRealizada, despesaMeta,
}: PerformanceSummaryProps) {
  const recMetaPct = receitaMeta > 0 ? (receitaRealizada / receitaMeta) * 100 : 0;
  const despMetaPct = despesaMeta > 0 ? (despesaRealizada / despesaMeta) * 100 : 0;
  const resultadoRealizado = receitaRealizada - despesaRealizada;
  const resultadoPrevisto = receitaPrevista - despesaPrevista;
  const margem = receitaRealizada > 0 ? (resultadoRealizado / receitaRealizada) * 100 : 0;
  const desvioRec = receitaRealizada - receitaMeta;
  const desvioDep = despesaRealizada - despesaMeta;

  const recStatus = getRevenueStatus(recMetaPct);
  const despStatus = getExpenseStatus(despMetaPct);
  const resPositive = resultadoRealizado >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Receita vs Meta */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 space-y-4 group hover:border-primary/30 transition-all">
        <TrendingUp className="absolute top-3 right-3 w-12 h-12 text-emerald-400 opacity-10 group-hover:opacity-20 transition-opacity" />
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Receita vs Meta</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${recStatus.color}`}>{recMetaPct.toFixed(0)}%</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${recStatus.bg}`}>
              {recStatus.label}
            </span>
          </div>
        </div>
        <Progress value={Math.min(recMetaPct, 100)} className={`h-2 ${recStatus.bar} ${recStatus.glow}`} />
        <div className="grid grid-cols-2 gap-2">
          <MetricCell label="Realizado" value={formatCurrency(receitaRealizada)} />
          <MetricCell label="Meta" value={formatCurrency(receitaMeta)} />
          <MetricCell label="Previsto" value={formatCurrency(receitaPrevista)} />
          <MetricCell
            label="Desvio"
            value={`${desvioRec >= 0 ? "+" : ""}${formatCurrency(desvioRec)}`}
            highlight={desvioRec >= 0 ? "text-emerald-400" : "text-rose-400"}
          />
        </div>
      </div>

      {/* Card 2: Despesa vs Meta */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 space-y-4 group hover:border-primary/30 transition-all">
        <TrendingDown className="absolute top-3 right-3 w-12 h-12 text-rose-400 opacity-10 group-hover:opacity-20 transition-opacity" />
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Despesa vs Meta</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${despStatus.color}`}>{despMetaPct.toFixed(0)}%</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${despStatus.bg}`}>
              {despStatus.label}
            </span>
          </div>
        </div>
        <Progress value={Math.min(despMetaPct, 100)} className={`h-2 ${despStatus.bar} ${despStatus.glow}`} />
        <div className="grid grid-cols-2 gap-2">
          <MetricCell label="Realizado" value={formatCurrency(despesaRealizada)} />
          <MetricCell label="Meta" value={formatCurrency(despesaMeta)} />
          <MetricCell label="Previsto" value={formatCurrency(despesaPrevista)} />
          <MetricCell
            label="Desvio"
            value={`${desvioDep >= 0 ? "+" : ""}${formatCurrency(desvioDep)}`}
            highlight={desvioDep <= 0 ? "text-emerald-400" : "text-rose-400"}
          />
        </div>
      </div>

      {/* Card 3: Resultado Líquido */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 space-y-4 group hover:border-primary/30 transition-all">
        <Activity className="absolute top-3 right-3 w-12 h-12 text-primary opacity-10 group-hover:opacity-20 transition-opacity" />
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Resultado Líquido</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${resPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(resultadoRealizado)}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${resPositive ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-rose-500/20 border-rose-500/30 text-rose-400"}`}>
              {resPositive ? "Positivo" : "Negativo"}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Margem operacional</span>
            <span className={`font-semibold ${resPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {margem.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(Math.max(margem, 0), 100)}
            className={`h-2 ${resPositive ? "[&>div]:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "[&>div]:bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"}`}
          />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <div className="grid grid-cols-2 gap-2">
          <MetricCell label="Receita" value={formatCurrency(receitaRealizada)} highlight="text-emerald-400" />
          <MetricCell label="Despesa" value={formatCurrency(despesaRealizada)} highlight="text-rose-400" />
          <MetricCell label="Resultado Previsto" value={formatCurrency(resultadoPrevisto)} />
          <MetricCell
            label="Desvio"
            value={`${(resultadoRealizado - resultadoPrevisto) >= 0 ? "+" : ""}${formatCurrency(resultadoRealizado - resultadoPrevisto)}`}
            highlight={(resultadoRealizado - resultadoPrevisto) >= 0 ? "text-emerald-400" : "text-rose-400"}
          />
        </div>
      </div>
    </div>
  );
}
