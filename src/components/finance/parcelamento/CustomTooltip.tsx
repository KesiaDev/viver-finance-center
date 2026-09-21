import { formatCurrencyBR } from "./data";

interface Payload {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

interface Props {
  active?: boolean;
  payload?: Payload[];
  label?: string;
  isCurrency?: boolean;
  suffix?: string;
}

export function CustomTooltip({ active, payload, label, isCurrency = true, suffix }: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-xl"
      style={{ background: "#111827", border: "1px solid #1e293b" }}
    >
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-semibold">
            {isCurrency ? formatCurrencyBR(p.value ?? 0) : `${p.value}${suffix ?? ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}
