import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Line, Bar, ReferenceArea,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { BudgetVsActualRow } from "@/hooks/useBudgetVsActual";

export interface SimulatedTotals {
  receita: number;
  despesa: number;
  caixa: number;
  saldoFinal: number;
  hasChanges: boolean;
}

interface StrategicSimulatorChartProps {
  data: BudgetVsActualRow[];
  initialBalance: number;
  onSimulationChange?: (totals: SimulatedTotals) => void;
  accumulated?: boolean;
  onAccumulatedChange?: (value: boolean) => void;
}

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCurrencyShort = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}K`;
  return `${sign}${abs.toFixed(0)}`;
};

const getMonthLabel = (monthStr: string) => {
  const idx = parseInt(monthStr.split("-")[1], 10) - 1;
  return MONTHS_SHORT[idx] || monthStr;
};

interface SimRow {
  month: string;
  label: string;
  isRealized: boolean;
  recReal: number;
  despReal: number;
  recPrevisto: number | null;
  despPrevisto: number | null;
  recSimulada: number | null;
  despSimulada: number | null;
  recAjustada: number;
  despAjustada: number;
}

type ActiveLine = "receita" | "despesa";

export function StrategicSimulatorChart({ data, initialBalance, onSimulationChange, accumulated = false, onAccumulatedChange }: StrategicSimulatorChartProps) {
  const [activeLine, setActiveLine] = useState<ActiveLine>("receita");
  // Build simulation data from raw rows
  const buildSimData = useCallback((): SimRow[] => {
    return data.map((row) => {
      const isRealized = Number(row.receita_realizada) > 0;
      const recPrev = Number(row.receita_prevista);
      const despPrev = Number(row.despesa_prevista);
      const recReal = Number(row.receita_realizada);
      const despReal = Number(row.despesa_realizada);
      return {
        month: row.month,
        label: getMonthLabel(row.month),
        isRealized,
        recReal,
        despReal,
        recPrevisto: !isRealized ? recPrev : null,
        despPrevisto: !isRealized ? despPrev : null,
        recSimulada: !isRealized ? recPrev : null,
        despSimulada: !isRealized ? despPrev : null,
        recAjustada: recPrev,
        despAjustada: despPrev,
      };
    });
  }, [data]);

  const [simData, setSimData] = useState<SimRow[]>(() => buildSimData());
  const [dragging, setDragging] = useState<{ type: "recAjustada" | "despAjustada"; index: number; startY: number; startValue: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Reset sim data when source data changes
  useEffect(() => {
    setSimData(buildSimData());
  }, [buildSimData]);

  // Check if any value was changed
  const hasChanges = useMemo(() => {
    return simData.some((row) => {
      if (row.isRealized) return false;
      const origRec = Number(data.find((d) => d.month === row.month)?.receita_prevista ?? 0);
      const origDesp = Number(data.find((d) => d.month === row.month)?.despesa_prevista ?? 0);
      return Math.abs(row.recAjustada - origRec) > 100 || Math.abs(row.despAjustada - origDesp) > 100;
    });
  }, [simData, data]);

  // Compute totals and notify parent
  const totals = useMemo(() => {
    const receita = simData.reduce((acc, row) => acc + (row.isRealized ? row.recReal : row.recAjustada), 0);
    const despesa = simData.reduce((acc, row) => acc + (row.isRealized ? row.despReal : row.despAjustada), 0);
    const caixa = receita - despesa;
    const saldoFinal = initialBalance + caixa;
    return { receita, despesa, caixa, saldoFinal, hasChanges };
  }, [simData, initialBalance, hasChanges]);

  useEffect(() => {
    onSimulationChange?.(totals);
  }, [totals, onSimulationChange]);

  // Accumulated version of simData for chart display
  const displayData = useMemo(() => {
    if (!accumulated) return simData;
    let accRecReal = 0, accDespReal = 0, accRecPrev = 0, accDespPrev = 0, accRecSim = 0, accDespSim = 0, accRecAdj = 0, accDespAdj = 0;
    return simData.map((row) => {
      accRecReal += row.recReal;
      accDespReal += row.despReal;
      accRecPrev += row.recPrevisto ?? 0;
      accDespPrev += row.despPrevisto ?? 0;
      accRecSim += row.recSimulada ?? 0;
      accDespSim += row.despSimulada ?? 0;
      accRecAdj += row.recAjustada;
      accDespAdj += row.despAjustada;
      return {
        ...row,
        recReal: accRecReal,
        despReal: accDespReal,
        recPrevisto: row.recPrevisto !== null ? accRecPrev : null,
        despPrevisto: row.despPrevisto !== null ? accDespPrev : null,
        recSimulada: row.recSimulada !== null ? accRecSim : null,
        despSimulada: row.despSimulada !== null ? accDespSim : null,
        recAjustada: accRecAdj,
        despAjustada: accDespAdj,
      };
    });
  }, [simData, accumulated]);

  // Dynamic Y scale
  const dynamicYMax = useMemo(() => {
    const maxVal = Math.max(
      ...displayData.map((d) =>
        Math.max(d.recReal, d.despReal, d.recAjustada, d.despAjustada)
      )
    );
    return Math.ceil((maxVal * 1.2) / 500000) * 500000 || 5000000;
  }, [displayData]);

  // Drag logic
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      const deltaPixels = dragging.startY - e.clientY;
      const val = Math.max(0, dragging.startValue + deltaPixels * (dynamicYMax / 400));

      setSimData((prev) => {
        const next = [...prev];
        const row = next[dragging.index];
        if (!row || row.isRealized) return prev;
        const key = dragging.type;
        const updated = { ...row, [key]: val };
        // Update the simulated line value too
        if (key === "recAjustada") updated.recSimulada = val;
        else updated.despSimulada = val;
        next[dragging.index] = updated;
        return next;
      });
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    document.body.style.cursor = "ns-resize";

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "default";
    };
  }, [dragging, dynamicYMax]);

  const handleReset = () => setSimData(buildSimData());

  // Find the last realized month label for the reference line
  const lastRealizedLabel = useMemo(() => {
    const realized = simData.filter((d) => d.isRealized);
    return realized.length > 0 ? realized[realized.length - 1].label : null;
  }, [simData]);

  // InteractiveDot component
  const InteractiveDot = (props: any) => {
    const { cx, cy, payload, dataKey, index } = props;
    if (!payload || payload.isRealized) return null;

    const sourceKey: "recAjustada" | "despAjustada" =
      dataKey === "recSimulada" ? "recAjustada" : "despAjustada";
    const isRevenue = dataKey === "recSimulada";
    const color = isRevenue ? "#10b981" : "#f43f5e";
    const isInteractable = (isRevenue && activeLine === "receita") || (!isRevenue && activeLine === "despesa");
    const isDragging = dragging?.type === sourceKey && dragging?.index === index;
    const value = payload[dataKey] ?? 0;
    const labelY = isRevenue ? cy - 14 : cy + 18;

    return (
      <g
        style={{ cursor: isInteractable ? "ns-resize" : "default", pointerEvents: "auto" }}
        onPointerDown={isInteractable ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging({ type: sourceKey, index, startY: e.clientY, startValue: payload[sourceKey] ?? 0 });
        } : undefined}
      >
        {isInteractable && <circle cx={cx} cy={cy} r={20} fill="transparent" />}
        <circle
          cx={cx}
          cy={cy}
          r={isDragging ? 7 : isInteractable ? 5 : 3}
          fill="hsl(var(--card))"
          stroke={color}
          strokeWidth={isDragging ? 3 : isInteractable ? 2 : 1}
          opacity={1}
        />
        <text
          x={cx}
          y={labelY}
          fill={color}
          fontSize="10"
          fontWeight="600"
          textAnchor="middle"
          opacity={1}
          style={{ pointerEvents: "none" }}
        >
          {formatCurrencyShort(value)}
        </text>
      </g>
    );
  };

  // Custom tooltip
  const SimTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length || dragging) return null;
    const d = payload[0]?.payload as SimRow | undefined;
    if (!d) return null;

    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-xs font-semibold text-foreground mb-2 border-b border-border pb-1.5">
          {label} {d.isRealized ? "(Realizado)" : "(Simulação)"}
        </p>
        {d.isRealized ? (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Receita Real</span>
              <span className="text-[11px] font-medium text-foreground">{formatCurrency(d.recReal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-muted-foreground">Despesa Real</span>
              <span className="text-[11px] font-medium text-foreground">{formatCurrency(d.despReal)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Plano Base</p>
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">Receita</span>
                <span className="text-[11px] text-muted-foreground">{formatCurrency(d.recPrevisto ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">Despesa</span>
                <span className="text-[11px] text-muted-foreground">{formatCurrency(d.despPrevisto ?? 0)}</span>
              </div>
            </div>
            <div className="p-2 rounded border border-border/50 bg-muted/30">
              <p className="text-[10px] text-primary uppercase font-semibold mb-1">Simulação</p>
              <div className="flex justify-between">
                <span className="text-[11px] font-medium" style={{ color: "#10b981" }}>Receita</span>
                <span className="text-[11px] font-bold text-foreground">{formatCurrency(d.recSimulada ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-medium" style={{ color: "#f43f5e" }}>Despesa</span>
                <span className="text-[11px] font-bold text-foreground">{formatCurrency(d.despSimulada ?? 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5 border-b border-border/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Simulador Estratégico</h2>
            {hasChanges && (
              <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                Simulação Ativa
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Active line selector */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setActiveLine("receita")}
                className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                  activeLine === "receita"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Receita
              </button>
              <button
                onClick={() => setActiveLine("despesa")}
                className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                  activeLine === "despesa"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Despesa
              </button>
            </div>
            {/* Mensal / Acumulado toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => onAccumulatedChange?.(false)}
                className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                  !accumulated
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => onAccumulatedChange?.(true)}
                className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                  accumulated
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Acumulado
              </button>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 bg-muted/50 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: "#10b981" }} />
                  <div className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: "#f43f5e" }} />
                </div>
                Realizado
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0 border-t-2 border-dashed border-muted-foreground" />
                Plano Base
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-primary" />
                Simulação
              </div>
            </div>
            {hasChanges && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Resetar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="h-[450px] w-full" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="simEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="simRoseGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.15}
                vertical={false}
              />

              {/* Realized area shading */}
              {lastRealizedLabel && (
                <ReferenceArea
                  x1={simData[0]?.label}
                  x2={lastRealizedLabel}
                  fill="hsl(var(--muted))"
                  fillOpacity={0.15}
                />
              )}

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={[0, dynamicYMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v: number) => formatCurrencyShort(v)}
                width={70}
              />

              <Tooltip
                content={<SimTooltip />}
                cursor={{ fill: "transparent" }}
              />

              {/* Realized bars */}
              <Bar
                dataKey="recReal"
                name="Rec. Realizada"
                fill="url(#simEmeraldGrad)"
                radius={[3, 3, 0, 0]}
                barSize={20}
                isAnimationActive={false}
              />
              <Bar
                dataKey="despReal"
                name="Desp. Realizada"
                fill="url(#simRoseGrad)"
                radius={[3, 3, 0, 0]}
                barSize={20}
                isAnimationActive={false}
              />

              {/* Original plan lines (dashed reference) */}
              <Line
                type="monotone"
                dataKey="recPrevisto"
                name="Rec. Prevista"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
                opacity={0.4}
              />
              <Line
                type="monotone"
                dataKey="despPrevisto"
                name="Desp. Prevista"
                stroke="#f43f5e"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
                opacity={0.4}
              />

              {/* Simulated lines with interactive dots */}
              <Line
                type="monotone"
                dataKey="recSimulada"
                name="Rec. Simulada"
                stroke="#10b981"
                strokeWidth={3}
                isAnimationActive={false}
                dot={<InteractiveDot />}
                activeDot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="despSimulada"
                name="Desp. Simulada"
                stroke="#f43f5e"
                strokeWidth={3}
                isAnimationActive={false}
                dot={<InteractiveDot />}
                activeDot={false}
                connectNulls={false}
              />

              {/* Divider between realized and projected */}
              {lastRealizedLabel && (
                <ReferenceLine
                  x={lastRealizedLabel}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
