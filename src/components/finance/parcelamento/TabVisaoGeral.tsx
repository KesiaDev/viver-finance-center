import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";
import { KPICard } from "./KPICard";
import { CustomTooltip } from "./CustomTooltip";
import { useParcelamentoContext } from "./ParcelamentoContext";

export function TabVisaoGeral() {
  const { gmvData, faturasPorStatus, kpisGlobais, formatCurrencyBR, formatCurrencyCompact } = useParcelamentoContext();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icone="💰" valor={formatCurrencyBR(kpisGlobais.gmvPago)} label="GMV Pago Total" sublabel={`${kpisGlobais.gmvPagoFaturas} faturas`} sublabelColor="#10b981" borderColor="#10b98133" />
        <KPICard icone="🚨" valor={formatCurrencyBR(kpisGlobais.gmvAtrasado)} label="GMV Atrasado" sublabel={`${kpisGlobais.gmvAtrasadoFaturas} faturas`} sublabelColor="#ef4444" borderColor="#ef444433" />
        <KPICard icone="📅" valor={formatCurrencyBR(kpisGlobais.renovacaoEsperada)} label="Renovação Esperada" sublabel={`${kpisGlobais.renovacaoEsperadaFaturas.toLocaleString("pt-BR")} faturas`} sublabelColor="#3b82f6" borderColor="#3b82f633" />
        <KPICard icone="❌" valor={formatCurrencyBR(kpisGlobais.canceladoTotal)} label="Total Cancelado" sublabel={`${kpisGlobais.canceladoFaturas} faturas`} sublabelColor="#ec4899" borderColor="#ec489933" />
      </div>

      {/* GMV por Status - AreaChart */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">GMV por Status (mensal)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={gmvData}>
            <defs>
              <linearGradient id="gPago" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gAtrasado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gEsperado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="pago" name="Pago" stroke="#10b981" fill="url(#gPago)" strokeWidth={2} />
            <Area type="monotone" dataKey="atrasado" name="Atrasado" stroke="#ef4444" fill="url(#gAtrasado)" strokeWidth={2} />
            <Area type="monotone" dataKey="esperado" name="Esperado" stroke="#3b82f6" fill="url(#gEsperado)" strokeWidth={2} />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Faturas por Status - BarChart */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">Faturas por Status (mensal)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={faturasPorStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip isCurrency={false} />} />
            <Bar dataKey="pago" name="Pago" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="atrasado" name="Atrasado" fill="#ef4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="cancelado" name="Cancelado" fill="#ec4899" radius={[2, 2, 0, 0]} />
            <Bar dataKey="esperado" name="Esperado" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
