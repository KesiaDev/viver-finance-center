interface KPICardProps {
  icone: string;
  valor: string;
  label: string;
  sublabel: string;
  sublabelColor?: string;
  borderColor?: string;
}

export function KPICard({ icone, valor, label, sublabel, sublabelColor = "#94a3b8", borderColor = "#1e293b" }: KPICardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1"
      style={{
        background: "#111827",
        border: `1px solid ${borderColor}`,
      }}
    >
      <span className="text-2xl">{icone}</span>
      <span className="text-2xl font-bold text-white mt-1">{valor}</span>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-xs font-medium" style={{ color: sublabelColor }}>{sublabel}</span>
    </div>
  );
}
