import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RegraMatch } from "@/lib/classificacao/normalize";

export interface RegraClassificacao extends RegraMatch {
  nome: string;
  categoria_id: string | null;
  centro_custo_id: string | null;
  empresa_id_destino: string | null;
  tipo: "receita" | "despesa" | "transferencia" | null;
}

export interface LoteImportado {
  id: string;
  conta_id: string;
  mes_referencia: string;
  formato: string;
  nome_ficheiro: string | null;
  linhas_total: number;
  linhas_gravadas: number;
  linhas_duplicadas: number;
  total_entradas: number;
  total_saidas: number;
  saldo_final_extrato: number | null;
  desfeito_em: string | null;
  created_at: string;
  conta?: { nome: string; moeda: string } | null;
}

/** Regras ativas, ordenadas por prioridade — usadas na pré-visualização da importação. */
export function useRegrasAtivas() {
  return useQuery({
    queryKey: ["regras-classificacao-ativas"],
    queryFn: async (): Promise<RegraClassificacao[]> => {
      const { data, error } = await supabase
        .from("regras_classificacao")
        .select(
          "id, nome, prioridade, ativo, campo, operador, padrao, sinal, conta_id, tipo_conta, valor_min, valor_max, categoria_id, centro_custo_id, empresa_id_destino, tipo, created_at",
        )
        .eq("ativo", true)
        .order("prioridade");
      if (error) throw error;
      return (data ?? []) as unknown as RegraClassificacao[];
    },
    staleTime: 60 * 1000,
  });
}

export function useCotacoes(moedas: string[] = ["EUR", "USD"]) {
  return useQuery({
    queryKey: ["cotacoes", moedas],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotacoes")
        .select("data, moeda, taxa_brl, fonte")
        .in("moeda", moedas)
        .order("data", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useLotes() {
  return useQuery({
    queryKey: ["import-batches"],
    queryFn: async (): Promise<LoteImportado[]> => {
      const { data, error } = await supabase
        .from("import_batches")
        .select(
          "id, conta_id, mes_referencia, formato, nome_ficheiro, linhas_total, linhas_gravadas, linhas_duplicadas, total_entradas, total_saidas, saldo_final_extrato, desfeito_em, created_at, conta:contas_financeiras(nome, moeda)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as LoteImportado[];
    },
  });
}

export function useDesfazerLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      const { data, error } = await supabase.rpc("desfazer_lote", { p_batch_id: batchId });
      if (error) throw error;
      const linha = Array.isArray(data) ? (data[0] as { apagados: number } | undefined) : undefined;
      return linha?.apagados ?? 0;
    },
    onSuccess: (apagados) => {
      toast.success(`${apagados} lançamentos removidos`);
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Extrai o texto de um PDF através da edge function (uma string por página). */
export async function extrairTextoPdf(ficheiro: File): Promise<string> {
  const buffer = await ficheiro.arrayBuffer();
  let binario = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 8192) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const { data, error } = await supabase.functions.invoke("pdf-extrair-texto", {
    body: { ficheiro_base64: btoa(binario) },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? "Não consegui ler este PDF");
  return (data.paginas as string[]).join("\n");
}
