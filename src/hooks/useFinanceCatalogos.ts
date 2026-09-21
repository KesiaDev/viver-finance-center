import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContaFinanceira {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: "banco" | "cartao" | "plataforma" | "investimento" | "socio";
  moeda: "BRL" | "EUR" | "USD";
  conta_no_disponivel: boolean;
  final_cartao: string | null;
  dia_vencimento: number | null;
  conta_pagamento_id: string | null;
  ativo: boolean;
}

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  grupo_dre: "receita" | "deducao" | "despesa_operacional" | "fora_dre";
  entra_no_dre: boolean;
  ordem: number;
  ativo: boolean;
}

export interface CentroCusto {
  id: string;
  nome: string;
  codigo: string | null;
  ativo: boolean;
}

export function useContasFinanceiras() {
  return useQuery({
    queryKey: ["contas-financeiras"],
    queryFn: async (): Promise<ContaFinanceira[]> => {
      const { data, error } = await supabase
        .from("contas_financeiras")
        .select("id, empresa_id, nome, tipo, moeda, conta_no_disponivel, final_cartao, dia_vencimento, conta_pagamento_id, ativo")
        .eq("ativo", true)
        .order("tipo")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as ContaFinanceira[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoriasFinanceiras() {
  return useQuery({
    queryKey: ["categorias-financeiras"],
    queryFn: async (): Promise<CategoriaFinanceira[]> => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("id, nome, grupo_dre, entra_no_dre, ordem, ativo")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as CategoriaFinanceira[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCentrosCusto() {
  return useQuery({
    queryKey: ["centros-custo-financeiro"],
    queryFn: async (): Promise<CentroCusto[]> => {
      const { data, error } = await supabase
        .from("centros_custo")
        .select("id, nome, codigo, ativo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as CentroCusto[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export const GRUPO_DRE_LABEL: Record<CategoriaFinanceira["grupo_dre"], string> = {
  receita: "Receita",
  deducao: "Dedução",
  despesa_operacional: "Despesa operacional",
  fora_dre: "Fora do resultado",
};
