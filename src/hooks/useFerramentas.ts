import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Ferramenta {
  id: string;
  nome: string;
  link_acesso: string | null;
  usuario: string | null;
  senha: string | null;
  login_gmail: boolean;
  cartao_cadastrado: string | null;
  centro_custo: string | null;
  valor: number | null;
  tipo_pagamento: string | null;
  responsavel_id: string | null;
  data_inicio: string | null;
  data_cancelamento: string | null;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  responsavel?: {
    id: string;
    nome: string;
  } | null;
}

export interface FerramentaInput {
  nome: string;
  link_acesso?: string | null;
  usuario?: string | null;
  senha?: string | null;
  login_gmail?: boolean;
  cartao_cadastrado?: string | null;
  centro_custo?: string | null;
  valor?: number | null;
  tipo_pagamento?: string | null;
  responsavel_id?: string | null;
  data_inicio?: string | null;
  data_cancelamento?: string | null;
  ativo?: boolean;
  observacoes?: string | null;
}

export function useFerramentas() {
  const queryClient = useQueryClient();

  const { data: ferramentas, isLoading } = useQuery({
    queryKey: ["ferramentas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferramentas")
        .select(`
          *,
          responsavel:colaboradores(id, nome)
        `)
        .order("nome");

      if (error) throw error;
      return data as Ferramenta[];
    },
  });

  const createFerramenta = useMutation({
    mutationFn: async (ferramenta: FerramentaInput) => {
      const { data, error } = await supabase
        .from("ferramentas")
        .insert(ferramenta)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferramentas"] });
      toast.success("Ferramenta cadastrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cadastrar ferramenta: " + error.message);
    },
  });

  const updateFerramenta = useMutation({
    mutationFn: async ({ id, ...ferramenta }: FerramentaInput & { id: string }) => {
      const { data, error } = await supabase
        .from("ferramentas")
        .update(ferramenta)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferramentas"] });
      toast.success("Ferramenta atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar ferramenta: " + error.message);
    },
  });

  const deleteFerramenta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ferramentas")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferramentas"] });
      toast.success("Ferramenta excluída com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir ferramenta: " + error.message);
    },
  });

  return {
    ferramentas,
    isLoading,
    createFerramenta: createFerramenta.mutate,
    updateFerramenta: updateFerramenta.mutate,
    deleteFerramenta: deleteFerramenta.mutate,
    isCreating: createFerramenta.isPending,
    isUpdating: updateFerramenta.isPending,
    isDeleting: deleteFerramenta.isPending,
  };
}
