import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { KPICard } from "./KPICard";
import { InsightBadge } from "./InsightBadge";
import { CustomTooltip } from "./CustomTooltip";
import { useParcelamentoContext } from "./ParcelamentoContext";

export function TabCancelamentos() {
  const { gmvComCancelado, kpisGlobais, insightsCancelamentos, formatCurrencyBR, formatCurrencyCompact } = useParcelamentoContext();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icone="❌" valor={formatCurrencyBR(kpisGlobais.canceladoTotal)} label="Total Cancelado" sublabel="em GMV" sublabelColor="#ec4899" borderColor="#ec489933" />
        <KPICard icone="📉" valor={`${kpisGlobais.taxaCancelamento}%`} label="Taxa de Cancelamento" sublabel="das faturas emitidas" sublabelColor="#ec4899" borderColor="#ec489933" />
        <KPICard icone="📄" valor={kpisGlobais.canceladoFaturas.toString()} label="Faturas Canceladas" sublabel="total acumulado" sublabelColor="#ec4899" borderColor="#ec489933" />
      </div>

      {/* BarChart empilhado */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">GMV com Cancelamentos (empilhado)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={gmvComCancelado}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cancelado" name="Cancelado" stackId="a" fill="#ec4899" />
            <Bar dataKey="pago" name="Pago" stackId="a" fill="#10b981" />
            <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insightsCancelamentos.map((ins, i) => (
          <InsightBadge key={i} {...ins} />
        ))}
      </div>
    </div>
  );
}
