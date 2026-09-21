const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const SERIES_COLORS: Record<string, string> = {
  "Rec. Prevista": "rgba(16,185,129,0.4)",
  "Rec. Realizada": "#10b981",
  "Meta Receita": "#94a3b8",
  "Desp. Prevista": "rgba(244,63,94,0.4)",
  "Desp. Realizada": "#f43f5e",
  "Meta Despesa": "#64748b",
};

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: SERIES_COLORS[entry.name] || entry.color }}
              />
              <span className="text-[11px] text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-[11px] font-medium text-foreground">
              {formatCurrency(Math.abs(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
