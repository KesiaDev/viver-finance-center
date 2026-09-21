import { useParcelamentoContext } from "./ParcelamentoContext";

export function TabInsights() {
  const { resumoExecutivo, riscosCriticos, oportunidades, recomendacoes, cenarios, formatCurrencyBR } = useParcelamentoContext();
  const maxCenario = Math.max(...cenarios.map((c) => c.valor));

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
          border: "1px solid rgba(59,130,246,0.3)",
        }}
      >
        <h3 className="text-white font-semibold text-lg mb-3">📋 Resumo Executivo</h3>
        <p className="text-slate-300 leading-relaxed text-sm">{resumoExecutivo}</p>
      </div>

      {/* Riscos vs Oportunidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #ef444433" }}>
          <h3 className="text-red-400 font-semibold mb-4">🚨 Riscos Críticos</h3>
          <ul className="space-y-3">
            {riscosCriticos.map((r, i) => (
              <li key={i} className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-red-500/50">{r}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #10b98133" }}>
          <h3 className="text-emerald-400 font-semibold mb-4">✅ Oportunidades</h3>
          <ul className="space-y-3">
            {oportunidades.map((o, i) => (
              <li key={i} className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-emerald-500/50">{o}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recomendações */}
      <div>
        <h3 className="text-white font-semibold mb-4">🎯 Recomendações Estratégicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recomendacoes.map((rec, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: "#111827", border: "1px solid #1e293b" }}>
              <span className="text-2xl">{rec.icone}</span>
              <h4 className="text-white font-semibold mt-2 mb-1 text-sm">{rec.titulo}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{rec.texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cenários */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <h3 className="text-white font-semibold mb-4">📈 Cenários de Projeção (sobre R$ 4.73M esperado)</h3>
        <div className="space-y-4">
          {cenarios.map((c) => (
            <div key={c.nome} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">{c.nome}</span>
                <span className="text-slate-400 text-xs">Churn {c.churn}% · Recuperação {c.recuperacao}%</span>
                <span className="font-semibold" style={{ color: c.cor }}>{formatCurrencyBR(c.valor)}</span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: "#1e293b" }}>
                <div className="h-3 rounded-full transition-all" style={{ width: `${(c.valor / maxCenario) * 100}%`, background: c.cor, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
