import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Legend,
} from "recharts";
import { KPICard } from "./KPICard";
import { InsightBadge } from "./InsightBadge";
import { CustomTooltip } from "./CustomTooltip";
import { useParcelamentoContext } from "./ParcelamentoContext";

export function TabInadimplencia() {
  const { inadimplenciaData, crescimentoData, kpisGlobais, insightsInadimplencia, formatCurrencyBR, formatCurrencyCompact } = useParcelamentoContext();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icone="📊" valor={`${kpisGlobais.taxaInadimplencia}%`} label="Taxa de Inadimplência" sublabel="do GMV faturado" sublabelColor="#ef4444" borderColor="#ef444433" />
        <KPICard icone="💸" valor={formatCurrencyBR(kpisGlobais.gmvAtrasado)} label="GMV Atrasado" sublabel={`${kpisGlobais.gmvAtrasadoFaturas} faturas em aberto`} sublabelColor="#ef4444" borderColor="#ef444433" />
        <KPICard icone="📈" valor={`+${kpisGlobais.crescimentoFev}%`} label="Crescimento Fev/26" sublabel={`vs +${kpisGlobais.crescimentoJan}% em Jan`} sublabelColor="#f59e0b" borderColor="#f59e0b33" />
      </div>

      {/* ComposedChart */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">Taxa de Inadimplência vs GMV Atrasado</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={inadimplenciaData}>
            <defs>
              <linearGradient id="gTaxa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip isCurrency={false} suffix="%" />} />
            <Area yAxisId="left" type="monotone" dataKey="taxa" name="Taxa (%)" stroke="#ef4444" fill="url(#gTaxa)" strokeWidth={2} />
            <Bar yAxisId="right" dataKey="atrasado" name="Atrasado (R$)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* AreaChart */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">Crescimento do GMV Atrasado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={crescimentoData}>
            <defs>
              <linearGradient id="gCresc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="valor" name="GMV Atrasado" stroke="#ef4444" fill="url(#gCresc)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insightsInadimplencia.map((ins, i) => (
          <InsightBadge key={i} {...ins} />
        ))}
      </div>
    </div>
  );
}
