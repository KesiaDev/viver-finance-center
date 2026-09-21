import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as fallback from "@/components/finance/parcelamento/data";

interface CardRow {
  card_name: string;
  card_data: {
    cols: string[];
    rows: any[][];
    row_count: number;
  };
  synced_at: string;
}

function findCard(cards: CardRow[], ...keywords: string[]): CardRow | undefined {
  return cards.find((c) => {
    const name = c.card_name.toLowerCase();
    return keywords.some((k) => name.includes(k.toLowerCase()));
  });
}

function mapRows(card: CardRow | undefined): Record<string, any>[] {
  if (!card) return [];
  const { cols, rows } = card.card_data;
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

// Transform Metabase rows into the format expected by our charts
function transformGmvData(cards: CardRow[]) {
  // Look for the GMV by status card (without cancelado)
  const card = findCard(cards, "gmv", "status", "sem cancelado") 
    || findCard(cards, "análise 1")
    || findCard(cards, "gmv por status");
  
  if (!card) return fallback.gmvData;
  
  const rows = mapRows(card);
  if (rows.length === 0) return fallback.gmvData;
  
  // Try to map columns - adapt to whatever column names Metabase returns
  const cols = card.card_data.cols.map(c => c.toLowerCase());
  const mesIdx = cols.findIndex(c => c.includes("mes") || c.includes("mês") || c.includes("month"));
  const pagoIdx = cols.findIndex(c => c.includes("pago") || c.includes("paid"));
  const atrasadoIdx = cols.findIndex(c => c.includes("atrasado") || c.includes("overdue") || c.includes("late"));
  const esperadoIdx = cols.findIndex(c => c.includes("esperado") || c.includes("expected") || c.includes("pending"));
  
  if (mesIdx === -1) return fallback.gmvData;
  
  return card.card_data.rows.map(row => ({
    mes: row[mesIdx],
    pago: row[pagoIdx] ?? 0,
    atrasado: row[atrasadoIdx] ?? 0,
    esperado: row[esperadoIdx] ?? 0,
  }));
}

function transformTopDevedores(cards: CardRow[]) {
  const card = findCard(cards, "devedor", "atrasado por aluno", "devedores");
  if (!card) return fallback.topDevedores;
  
  const rows = mapRows(card);
  if (rows.length === 0) return fallback.topDevedores;
  
  const cols = card.card_data.cols.map(c => c.toLowerCase());
  const nomeIdx = cols.findIndex(c => c.includes("nome") || c.includes("name") || c.includes("aluno"));
  const valorIdx = cols.findIndex(c => c.includes("valor") || c.includes("value") || c.includes("atrasado") || c.includes("amount"));
  const faturasIdx = cols.findIndex(c => c.includes("fatura") || c.includes("invoice") || c.includes("qtd") || c.includes("count"));
  const dataIdx = cols.findIndex(c => c.includes("data") || c.includes("date") || c.includes("compra"));
  
  if (nomeIdx === -1 || valorIdx === -1) return fallback.topDevedores;
  
  return card.card_data.rows
    .map(row => ({
      nome: row[nomeIdx],
      valor: Number(row[valorIdx]) || 0,
      faturas: Number(row[faturasIdx]) || 0,
      dataCompra: row[dataIdx] || "2025-01-01",
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
}

function transformGmvComCancelado(cards: CardRow[]) {
  const card = findCard(cards, "cancelado", "com cancelado", "análise 3");
  if (!card) return fallback.gmvComCancelado;
  
  const cols = card.card_data.cols.map(c => c.toLowerCase());
  const mesIdx = cols.findIndex(c => c.includes("mes") || c.includes("mês") || c.includes("month"));
  const canceladoIdx = cols.findIndex(c => c.includes("cancelado") || c.includes("cancel"));
  const pagoIdx = cols.findIndex(c => c.includes("pago") || c.includes("paid"));
  const atrasadoIdx = cols.findIndex(c => c.includes("atrasado") || c.includes("overdue"));
  
  if (mesIdx === -1) return fallback.gmvComCancelado;
  
  return card.card_data.rows.map(row => ({
    mes: row[mesIdx],
    cancelado: Number(row[canceladoIdx]) || 0,
    pago: Number(row[pagoIdx]) || 0,
    atrasado: Number(row[atrasadoIdx]) || 0,
  }));
}

function transformInadimplenciaData(cards: CardRow[]) {
  const card = findCard(cards, "atrasado por mês", "inadimplência", "análise 2", "gmv atrasado");
  if (!card) return { inadimplenciaData: fallback.inadimplenciaData, crescimentoData: fallback.crescimentoData };
  
  const cols = card.card_data.cols.map(c => c.toLowerCase());
  const mesIdx = cols.findIndex(c => c.includes("mes") || c.includes("mês") || c.includes("month"));
  const atrasadoIdx = cols.findIndex(c => c.includes("atrasado") || c.includes("overdue") || c.includes("valor"));
  const totalIdx = cols.findIndex(c => c.includes("total") || c.includes("faturado"));
  
  if (mesIdx === -1 || atrasadoIdx === -1) {
    return { inadimplenciaData: fallback.inadimplenciaData, crescimentoData: fallback.crescimentoData };
  }
  
  const inadimplenciaData = card.card_data.rows.map(row => {
    const atrasado = Number(row[atrasadoIdx]) || 0;
    const total = totalIdx >= 0 ? Number(row[totalIdx]) || 1 : 1;
    return {
      mes: row[mesIdx],
      taxa: totalIdx >= 0 ? Number(((atrasado / total) * 100).toFixed(1)) : 0,
      atrasado,
      total,
    };
  });
  
  // Derive crescimento from inadimplencia
  const crescimentoData = inadimplenciaData.map((item, i) => ({
    mes: item.mes,
    valor: item.atrasado,
    crescimento: i > 0 && inadimplenciaData[i - 1].atrasado > 0
      ? Number((((item.atrasado - inadimplenciaData[i - 1].atrasado) / inadimplenciaData[i - 1].atrasado) * 100).toFixed(1))
      : null,
  }));
  
  return { inadimplenciaData, crescimentoData };
}

function transformFaturasPorStatus(cards: CardRow[]) {
  // Look for faturas card in the same "análise 3" card or separate
  const card = findCard(cards, "faturas por status", "faturas");
  if (!card) return fallback.faturasPorStatus;
  
  const cols = card.card_data.cols.map(c => c.toLowerCase());
  const mesIdx = cols.findIndex(c => c.includes("mes") || c.includes("mês") || c.includes("month"));
  
  if (mesIdx === -1) return fallback.faturasPorStatus;
  
  const pagoIdx = cols.findIndex(c => c.includes("pago") || c.includes("paid"));
  const atrasadoIdx = cols.findIndex(c => c.includes("atrasado") || c.includes("overdue"));
  const canceladoIdx = cols.findIndex(c => c.includes("cancelado") || c.includes("cancel"));
  const esperadoIdx = cols.findIndex(c => c.includes("esperado") || c.includes("expected") || c.includes("pending"));
  
  return card.card_data.rows.map(row => ({
    mes: row[mesIdx],
    pago: Number(row[pagoIdx]) || 0,
    atrasado: Number(row[atrasadoIdx]) || 0,
    cancelado: Number(row[canceladoIdx]) || 0,
    esperado: Number(row[esperadoIdx]) || 0,
  }));
}

function deriveKPIs(
  gmvData: typeof fallback.gmvData,
  gmvComCancelado: typeof fallback.gmvComCancelado,
  faturasPorStatus: typeof fallback.faturasPorStatus,
  topDevedores: typeof fallback.topDevedores,
  crescimentoData: typeof fallback.crescimentoData,
) {
  const gmvPago = gmvData.reduce((s, r) => s + (r.pago || 0), 0);
  const gmvAtrasado = gmvData.reduce((s, r) => s + (r.atrasado || 0), 0);
  const renovacaoEsperada = gmvData.reduce((s, r) => s + (r.esperado || 0), 0);
  const canceladoTotal = gmvComCancelado.reduce((s, r) => s + (r.cancelado || 0), 0);

  const gmvPagoFaturas = faturasPorStatus.reduce((s, r) => s + (r.pago || 0), 0);
  const gmvAtrasadoFaturas = faturasPorStatus.reduce((s, r) => s + (r.atrasado || 0), 0);
  const renovacaoEsperadaFaturas = faturasPorStatus.reduce((s, r) => s + (r.esperado || 0), 0);
  const canceladoFaturas = faturasPorStatus.reduce((s, r) => s + (r.cancelado || 0), 0);

  const totalFaturas = gmvPagoFaturas + gmvAtrasadoFaturas + canceladoFaturas + renovacaoEsperadaFaturas;
  const taxaInadimplencia = totalFaturas > 0 ? Number(((gmvAtrasadoFaturas / (gmvPagoFaturas + gmvAtrasadoFaturas)) * 100).toFixed(1)) : fallback.kpisGlobais.taxaInadimplencia;
  const taxaCancelamento = totalFaturas > 0 ? Number(((canceladoFaturas / totalFaturas) * 100).toFixed(1)) : fallback.kpisGlobais.taxaCancelamento;

  const usuariosInadimplentes = topDevedores.length;
  const ticketMedioAtrasado = usuariosInadimplentes > 0 ? Math.round(gmvAtrasado / usuariosInadimplentes) : fallback.kpisGlobais.ticketMedioAtrasado;

  const lastCresc = crescimentoData.length > 0 ? crescimentoData[crescimentoData.length - 1] : null;
  const prevCresc = crescimentoData.length > 1 ? crescimentoData[crescimentoData.length - 2] : null;

  return {
    gmvPago, gmvPagoFaturas,
    gmvAtrasado, gmvAtrasadoFaturas,
    renovacaoEsperada, renovacaoEsperadaFaturas,
    canceladoTotal, canceladoFaturas,
    taxaInadimplencia, taxaCancelamento,
    usuariosInadimplentes, ticketMedioAtrasado,
    crescimentoFev: lastCresc?.crescimento ?? fallback.kpisGlobais.crescimentoFev,
    crescimentoJan: prevCresc?.crescimento ?? fallback.kpisGlobais.crescimentoJan,
  };
}

export function useParcelamentoDashboardData() {
  const queryClient = useQueryClient();

  const { data: rawCards, isLoading, error } = useQuery({
    queryKey: ["parcelamento-dashboard-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelamento_dashboard_data")
        .select("*");
      if (error) throw error;
      return (data || []) as unknown as CardRow[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("metabase-sync-parcelamento");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelamento-dashboard-data"] });
    },
  });

  const hasData = (rawCards?.length ?? 0) > 0;

  // Transform or fallback
  const gmvData = hasData ? transformGmvData(rawCards!) : fallback.gmvData;
  const gmvComCancelado = hasData ? transformGmvComCancelado(rawCards!) : fallback.gmvComCancelado;
  const topDevedoresData = hasData ? transformTopDevedores(rawCards!) : fallback.topDevedores;
  const faturasPorStatusData = hasData ? transformFaturasPorStatus(rawCards!) : fallback.faturasPorStatus;
  
  const { inadimplenciaData, crescimentoData } = hasData
    ? transformInadimplenciaData(rawCards!)
    : { inadimplenciaData: fallback.inadimplenciaData, crescimentoData: fallback.crescimentoData };

  const kpisGlobais = hasData
    ? deriveKPIs(gmvData, gmvComCancelado, faturasPorStatusData, topDevedoresData, crescimentoData)
    : fallback.kpisGlobais;

  const lastSyncedAt = rawCards?.reduce((latest, c) => {
    const d = new Date(c.synced_at);
    return d > latest ? d : latest;
  }, new Date(0)) ?? null;

  return {
    gmvData,
    inadimplenciaData,
    crescimentoData,
    faturasPorStatus: faturasPorStatusData,
    gmvComCancelado,
    topDevedores: topDevedoresData,
    kpisGlobais,
    // Static data (not from Metabase)
    distribuicaoFaixa: fallback.distribuicaoFaixa,
    distribuicaoFaturas: fallback.distribuicaoFaturas,
    insightsInadimplencia: fallback.insightsInadimplencia,
    insightsCancelamentos: fallback.insightsCancelamentos,
    insightsDevedores: fallback.insightsDevedores,
    resumoExecutivo: fallback.resumoExecutivo,
    riscosCriticos: fallback.riscosCriticos,
    oportunidades: fallback.oportunidades,
    recomendacoes: fallback.recomendacoes,
    cenarios: fallback.cenarios,
    // Utilities
    formatCurrencyBR: fallback.formatCurrencyBR,
    formatCurrencyCompact: fallback.formatCurrencyCompact,
    // State
    isLoading,
    error,
    hasData,
    lastSyncedAt,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}
