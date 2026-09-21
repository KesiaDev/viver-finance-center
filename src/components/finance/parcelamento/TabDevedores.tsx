import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KPICard } from "./KPICard";
import { InsightBadge } from "./InsightBadge";
import { CustomTooltip } from "./CustomTooltip";
import { useParcelamentoContext } from "./ParcelamentoContext";

export function TabDevedores() {
  const { topDevedores, distribuicaoFaixa, distribuicaoFaturas, kpisGlobais, insightsDevedores, formatCurrencyBR } = useParcelamentoContext();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icone="👥" valor={kpisGlobais.usuariosInadimplentes.toString()} label="Usuários Inadimplentes" sublabel="com faturas em atraso" sublabelColor="#8b5cf6" borderColor="#8b5cf633" />
        <KPICard icone="🎫" valor={formatCurrencyBR(kpisGlobais.ticketMedioAtrasado)} label="Ticket Médio Atrasado" sublabel="por inadimplente" sublabelColor="#8b5cf6" borderColor="#8b5cf633" />
        <KPICard icone="🏆" valor={formatCurrencyBR(topDevedores[0]?.valor ?? 0)} label="Top 1 Devedor" sublabel={topDevedores[0]?.nome ?? "-"} sublabelColor="#ef4444" borderColor="#ef444433" />
      </div>

      {/* Tabela Top 10 */}
      <div className="rounded-xl p-5 overflow-x-auto" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">Ranking — Top 10 Devedores</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4 text-right">Valor Atrasado</th>
              <th className="py-2 pr-4 text-right">Faturas</th>
              <th className="py-2 text-right">Data Compra</th>
            </tr>
          </thead>
          <tbody>
            {topDevedores.map((d, i) => (
              <tr key={i} className="border-b border-slate-800 text-slate-200 hover:bg-slate-800/50">
                <td className="py-2.5 pr-4 font-bold text-slate-400">{i + 1}</td>
                <td className="py-2.5 pr-4">{d.nome}</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-red-400">{formatCurrencyBR(d.valor)}</td>
                <td className="py-2.5 pr-4 text-right">{d.faturas}</td>
                <td className="py-2.5 text-right text-slate-400">{new Date(d.dataCompra).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2 gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <h3 className="text-white font-semibold mb-4">Distribuição por Faixa de Valor</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distribuicaoFaixa}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="faixa" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip isCurrency={false} suffix=" usuários" />} />
              <Bar dataKey="usuarios" name="Usuários" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <h3 className="text-white font-semibold mb-4">Distribuição por Qtd Faturas Atrasadas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distribuicaoFaturas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="qtd" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip isCurrency={false} suffix=" usuários" />} />
              <Bar dataKey="usuarios" name="Usuários" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insightsDevedores.map((ins, i) => (
          <InsightBadge key={i} {...ins} />
        ))}
      </div>
    </div>
  );
}
