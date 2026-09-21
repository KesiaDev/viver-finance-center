import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LancamentoRow {
  id: string;
  empresa_id: string;
  conta_id: string | null;
  data_caixa: string | null;
  data_competencia: string | null;
  descricao: string;
  contraparte: string | null;
  valor_original: number;
  moeda_original: "BRL" | "EUR" | "USD";
  cotacao: number | null;
  valor_brl: number | null;
  categoria_id: string | null;
  centro_custo_id: string | null;
  produto: string | null;
  tipo: "receita" | "despesa" | "transferencia" | null;
  pago_por_socio: string | null;
  status: "previsto" | "realizado" | "conciliado" | "cancelado";
  status_classificacao: "pendente" | "regra" | "manual";
  regra_id: string | null;
  source: string;
  observacao: string | null;
  conta?: { id: string; nome: string; tipo: string; moeda: string } | null;
  categoria?: { id: string; nome: string } | null;
  centro?: { id: string; nome: string } | null;
}

export interface LancamentosFiltro {
  empresaId?: string | null;
  mes: string; // YYYY-MM
  contaId?: string | null;
  statusClassificacao?: string | null;
}

const SELECT =
  "id, empresa_id, conta_id, data_caixa, data_competencia, descricao, contraparte, valor_original, moeda_original, cotacao, valor_brl, categoria_id, centro_custo_id, produto, tipo, pago_por_socio, status, status_classificacao, regra_id, source, observacao, conta:contas_financeiras(id, nome, tipo, moeda), categoria:categorias_financeiras(id, nome), centro:centros_custo(id, nome)";

export function mesRange(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, m - 1, 1));
  const fim = new Date(Date.UTC(ano, m, 1));
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export function useLancamentos(filtro: LancamentosFiltro) {
  return useQuery({
    queryKey: ["lancamentos", filtro],
    queryFn: async (): Promise<LancamentoRow[]> => {
      const { inicio, fim } = mesRange(filtro.mes);
      let query = supabase
        .from("lancamentos")
        .select(SELECT)
        .gte("data_caixa", inicio)
        .lt("data_caixa", fim)
        .order("data_caixa", { ascending: false })
        .limit(2000);

      if (filtro.empresaId) query = query.eq("empresa_id", filtro.empresaId);
      if (filtro.contaId) query = query.eq("conta_id", filtro.contaId);
      if (filtro.statusClassificacao) query = query.eq("status_classificacao", filtro.statusClassificacao);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as LancamentoRow[];
    },
  });
}

export function formatMoeda(valor: number | null | undefined, moeda = "BRL") {
  if (valor == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(valor);
}
