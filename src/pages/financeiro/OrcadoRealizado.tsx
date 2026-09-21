import { useState, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Clock, X, Wallet, ArrowUpRight, ArrowDownRight, Activity, Target, BarChart3, MousePointer2 } from "lucide-react";
import { useBudgetVsActual } from "@/hooks/useBudgetVsActual";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { MonthPicker } from "@/components/ui/month-picker";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, Legend, LabelList } from "recharts";
import { KPICard } from "@/components/finance/orcado-realizado/KPICard";
import { ChartTooltip } from "@/components/finance/orcado-realizado/ChartTooltip";
import { ChartLegend } from "@/components/finance/orcado-realizado/ChartLegend";
import { PerformanceSummary } from "@/components/finance/orcado-realizado/PerformanceSummary";
import { StrategicSimulatorChart, type SimulatedTotals } from "@/components/finance/orcado-realizado/StrategicSimulatorChart";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCurrencyShort = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1).replace('.', ',')}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}K`;
  return `${sign}${abs}`;
};

/* ─── Custom Bar Label with diagonal connector line ─── */
function CustomBarLabel({ x, y, width, value, offset, color, position, horizontalShift = 0 }: {
  x?: number; y?: number; width?: number; value?: number;
  offset: number; color: string; position: "top" | "bottom"; horizontalShift?: number;
}) {
  if (!value || value === 0 || x == null || y == null || width == null) return null;
  const displayValue = formatCurrencyShort(Math.abs(value));
  const cx = x + width / 2;
  const isTop = position === "top";
  const lineEndY = isTop ? y - offset : y + offset;
  const lineEndX = cx + horizontalShift;
  const textY = isTop ? lineEndY - 4 : lineEndY + 14;
  const showLine = offset >= 20;

  return (
    <g>
      {showLine && <line x1={cx} y1={y} x2={lineEndX} y2={lineEndY} stroke={color} strokeWidth={1} strokeOpacity={0.5} />}
      <text x={lineEndX} y={textY} textAnchor="middle" fontSize={12} fill={color} fontWeight={600}>
        {displayValue}
      </text>
    </g>
  );
}

const getVariation = (realizado: number, previsto: number) => {
  if (previsto === 0) return 0;
  return ((realizado - previsto) / previsto) * 100;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type ViewMode = "realized" | "projected" | "both";

export default function OrcadoRealizado() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [dataFilter, setDataFilter] = useState<"revenue" | "expense" | "all">("all");
  const [chartMode, setChartMode] = useState<"analytic" | "simulator">("simulator");
  const [accumulated, setAccumulated] = useState(false);
  const [simTotals, setSimTotals] = useState<SimulatedTotals | null>(null);
  const { data, totals, initialBalance, isLoading, lastSyncedAt } = useBudgetVsActual({ year, month });
  const { analysisShowTarget, setAnalysisShowTarget } = useAppPreferences();

  const handleSimulationChange = useCallback((t: SimulatedTotals) => {
    setSimTotals(t);
  }, []);

  const handleMonthChange = (value: string) => {
    setMonth(value);
    const selectedYear = parseInt(value.split("-")[0]);
    setYear(selectedYear);
  };

  const clearMonth = () => setMonth(null);

  const getMonthLabel = (monthStr: string) => {
    const idx = parseInt(monthStr.split("-")[1], 10) - 1;
    return MONTHS_SHORT[idx] || monthStr;
  };

  // Consolidated totals for annual view (realized + projected for future months)
  const consolidatedTotals = useMemo(() => {
    if (!data || month) return null;
    return data.reduce((acc, row) => {
      const recReal = Number(row.receita_realizada);
      const recPrev = Number(row.receita_prevista);
      const despReal = Number(row.despesa_realizada);
      const despPrev = Number(row.despesa_prevista);
      return {
        receita: acc.receita + (recReal > 0 ? recReal : recPrev),
        despesa: acc.despesa + (despReal > 0 ? despReal : despPrev),
      };
    }, { receita: 0, despesa: 0 });
  }, [data, month]);

  // KPI values - use simulated totals when simulator is active and has changes
  const useSimValues = chartMode === "simulator" && simTotals?.hasChanges;
  const totalRecPrev = totals?.receita_prevista ?? 0;
  const totalDespPrev = totals?.despesa_prevista ?? 0;
  const totalRecReal = useSimValues
    ? simTotals.receita
    : (consolidatedTotals?.receita ?? (totals?.receita_realizada ?? 0));
  const totalDespReal = useSimValues
    ? simTotals.despesa
    : (consolidatedTotals?.despesa ?? (totals?.despesa_realizada ?? 0));
  const totalRecMeta = totals?.receita_meta ?? 0;
  const totalDespMeta = totals?.despesa_meta ?? 0;
  const caixaPeriodo = useSimValues ? simTotals.caixa : (totalRecReal - totalDespReal);
  const saldoFinal = useSimValues ? simTotals.saldoFinal : (initialBalance + caixaPeriodo);
  const recVar = getVariation(totals?.receita_realizada ?? 0, totalRecPrev);
  const despVar = getVariation(totals?.despesa_realizada ?? 0, totalDespPrev);

  // Chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((row) => ({
      month: getMonthLabel(row.month),
      recReal: Number(row.receita_realizada),
      recPrev: Number(row.receita_prevista),
      despReal: -Number(row.despesa_realizada),
      despPrev: -Number(row.despesa_prevista),
      recMeta: Number(row.receita_meta),
      despMeta: -Number(row.despesa_meta),
    }));
  }, [data]);

  // Accumulated chart data (running totals)
  const chartDataAccumulated = useMemo(() => {
    if (!chartData.length) return [];
    let accRecReal = 0, accRecPrev = 0, accDespReal = 0, accDespPrev = 0, accRecMeta = 0, accDespMeta = 0;
    return chartData.map((row) => {
      accRecReal += row.recReal;
      accRecPrev += row.recPrev;
      accDespReal += row.despReal;
      accDespPrev += row.despPrev;
      accRecMeta += row.recMeta;
      accDespMeta += row.despMeta;
      return { ...row, recReal: accRecReal, recPrev: accRecPrev, despReal: accDespReal, despPrev: accDespPrev, recMeta: accRecMeta, despMeta: accDespMeta };
    });
  }, [chartData]);

  const activeChartData = accumulated ? chartDataAccumulated : chartData;

  const viewButtons: { value: ViewMode; label: string }[] = [
    { value: "realized", label: "Realizado" },
    { value: "projected", label: "Previsto" },
    { value: "both", label: "Previsto x Realizado" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receitas e Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Comparativo entre Previsto, Realizado e Meta
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Chart Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            <button
              onClick={() => setChartMode("analytic")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                chartMode === "analytic"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analítico
            </button>
            <button
              onClick={() => setChartMode("simulator")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                chartMode === "simulator"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              Simulador
            </button>
          </div>
          {lastSyncedAt && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              Sync: {(() => {
                const d = new Date(lastSyncedAt);
                return isNaN(d.getTime()) ? "Data inválida" : format(d, "dd/MM HH:mm");
              })()}
            </Badge>
          )}
          <MonthPicker
            value={month ?? undefined}
            onChange={handleMonthChange}
            placeholder="Todos os meses"
            className="w-48"
          />
          {month && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearMonth}>
              <X className="h-4 w-4" />
            </Button>
          )}
          <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setMonth(null); }}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KPICard
              label="SALDO INICIAL"
              sublabel="Opening Balance"
              value={initialBalance}
              icon={<Wallet className="w-4 h-4" />}
              decorativeIcon={<Wallet className="w-12 h-12" />}
            />
            <KPICard
              label="RECEITA (+)"
              sublabel="Total Inflows"
              value={totalRecReal}
              variation={recVar}
              variationPositive={recVar >= 0}
              icon={<ArrowUpRight className="w-4 h-4" />}
              decorativeIcon={<ArrowUpRight className="w-12 h-12" />}
            />
            <KPICard
              label="DESPESA (-)"
              sublabel="Total Outflows"
              value={totalDespReal}
              variation={despVar}
              variationPositive={despVar <= 0}
              icon={<ArrowDownRight className="w-4 h-4" />}
              decorativeIcon={<ArrowDownRight className="w-12 h-12" />}
            />
            <KPICard
              label="CAIXA PERÍODO"
              sublabel="Net Monthly Flow"
              value={caixaPeriodo}
              icon={<Activity className="w-4 h-4" />}
              decorativeIcon={<Activity className="w-12 h-12" />}
            />
            <KPICard
              label="SALDO FINAL"
              sublabel="Ending Balance"
              value={saldoFinal}
              icon={<Target className="w-4 h-4" />}
              decorativeIcon={<Target className="w-12 h-12" />}
              highlighted
              statusBadge={saldoFinal >= 0 ? "On Target" : "Off Target"}
              statusPositive={saldoFinal >= 0}
            />
          </div>

          {/* Chart Mode Toggle + Chart */}
          {chartMode === "simulator" && data ? (
            <StrategicSimulatorChart
              data={data}
              initialBalance={initialBalance}
              onSimulationChange={handleSimulationChange}
              accumulated={accumulated}
              onAccumulatedChange={setAccumulated}
            />
          ) : (
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
            <div className="p-5 border-b border-border/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-foreground">Receitas e Despesas</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                    {viewButtons.map((btn) => (
                      <button
                        key={btn.value}
                        onClick={() => setViewMode(btn.value)}
                        className={`px-5 py-1.5 rounded-full text-base font-medium transition-all ${
                          viewMode === btn.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                    {([
                      { value: "revenue" as const, label: "Receita" },
                      { value: "expense" as const, label: "Despesa" },
                      { value: "all" as const, label: "Ambos" },
                    ]).map((btn) => (
                      <button
                        key={btn.value}
                        onClick={() => setDataFilter(btn.value)}
                        className={`px-5 py-1.5 rounded-full text-base font-medium transition-all ${
                          dataFilter === btn.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                    {([
                      { value: false, label: "Mensal" },
                      { value: true, label: "Acumulado" },
                    ] as const).map((btn) => (
                      <button
                        key={String(btn.value)}
                        onClick={() => setAccumulated(btn.value)}
                        className={`px-5 py-1.5 rounded-full text-base font-medium transition-all ${
                          accumulated === btn.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={analysisShowTarget}
                      onCheckedChange={setAnalysisShowTarget}
                    />
                    <span className="text-base text-muted-foreground">Comparar com Metas</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={activeChartData} barGap={1} barCategoryGap="15%" margin={{ top: 55, right: 10, left: 10, bottom: 55 }}>
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="emeraldGradLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="roseGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="roseGradLight" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCurrencyShort(v)}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
                  <Legend content={<ChartLegend />} />

                  {/* Receita Prevista */}
                  {(dataFilter === "revenue" || dataFilter === "all") && (viewMode === "projected" || viewMode === "both") && (
                    <Bar dataKey="recPrev" name="Rec. Prevista" radius={[4, 4, 0, 0]} maxBarSize={32} fill="url(#emeraldGradLight)">
                      <LabelList dataKey="recPrev" content={<CustomBarLabel offset={analysisShowTarget ? 30 : (viewMode === "both" ? 40 : 14)} color="rgba(16,185,129,0.7)" position="top" horizontalShift={analysisShowTarget ? -20 : 0} />} />
                    </Bar>
                  )}
                  {/* Receita Realizada */}
                  {(dataFilter === "revenue" || dataFilter === "all") && (viewMode === "realized" || viewMode === "both") && (
                    <Bar dataKey="recReal" name="Rec. Realizada" radius={[4, 4, 0, 0]} maxBarSize={32} fill="url(#emeraldGrad)">
                      <LabelList dataKey="recReal" content={<CustomBarLabel offset={analysisShowTarget ? 30 : 14} color="#10b981" position="top" horizontalShift={analysisShowTarget ? 20 : 0} />} />
                    </Bar>
                  )}
                  {/* Meta Receita */}
                  {(dataFilter === "revenue" || dataFilter === "all") && analysisShowTarget && (
                    <Bar dataKey="recMeta" name="Meta Receita" radius={[4, 4, 0, 0]} maxBarSize={32} fill="#94a3b8">
                      <LabelList dataKey="recMeta" content={<CustomBarLabel offset={46} color="#94a3b8" position="top" horizontalShift={0} />} />
                    </Bar>
                  )}

                  {/* Despesa Prevista */}
                  {(dataFilter === "expense" || dataFilter === "all") && (viewMode === "projected" || viewMode === "both") && (
                    <Bar dataKey="despPrev" name="Desp. Prevista" radius={[0, 0, 4, 4]} maxBarSize={32} fill="url(#roseGradLight)">
                      <LabelList dataKey="despPrev" content={<CustomBarLabel offset={analysisShowTarget ? 30 : (viewMode === "both" ? 40 : 14)} color="rgba(244,63,94,0.7)" position="bottom" horizontalShift={analysisShowTarget ? -20 : 0} />} />
                    </Bar>
                  )}
                  {/* Despesa Realizada */}
                  {(dataFilter === "expense" || dataFilter === "all") && (viewMode === "realized" || viewMode === "both") && (
                    <Bar dataKey="despReal" name="Desp. Realizada" radius={[0, 0, 4, 4]} maxBarSize={32} fill="url(#roseGrad)">
                      <LabelList dataKey="despReal" content={<CustomBarLabel offset={analysisShowTarget ? 30 : 14} color="#f43f5e" position="bottom" horizontalShift={analysisShowTarget ? 20 : 0} />} />
                    </Bar>
                  )}
                  {/* Meta Despesa */}
                  {(dataFilter === "expense" || dataFilter === "all") && analysisShowTarget && (
                    <Bar dataKey="despMeta" name="Meta Despesa" radius={[0, 0, 4, 4]} maxBarSize={32} fill="#64748b">
                      <LabelList dataKey="despMeta" content={<CustomBarLabel offset={46} color="#64748b" position="bottom" horizontalShift={0} />} />
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          {/* Performance Summary */}
          <PerformanceSummary
            receitaPrevista={totalRecPrev}
            receitaRealizada={totalRecReal}
            receitaMeta={totalRecMeta}
            despesaPrevista={totalDespPrev}
            despesaRealizada={totalDespReal}
            despesaMeta={totalDespMeta}
          />
        </>
      )}
    </div>
  );
}
