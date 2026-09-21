const bgMap = {
  danger: "rgba(239,68,68,0.12)",
  warning: "rgba(245,158,11,0.12)",
  info: "rgba(59,130,246,0.12)",
} as const;

const borderMap = {
  danger: "rgba(239,68,68,0.3)",
  warning: "rgba(245,158,11,0.3)",
  info: "rgba(59,130,246,0.3)",
} as const;

interface InsightBadgeProps {
  tipo: "danger" | "warning" | "info";
  icone: string;
  texto: string;
}

export function InsightBadge({ tipo, icone, texto }: InsightBadgeProps) {
  return (
    <div
      className="rounded-lg p-4 text-sm leading-relaxed text-slate-200"
      style={{ background: bgMap[tipo], border: `1px solid ${borderMap[tipo]}` }}
    >
      <span className="mr-2 text-base">{icone}</span>
      {texto}
    </div>
  );
}
