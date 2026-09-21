import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ModeloContrato {
  id: string;
  nome: string;
  cargo_funcao: string;
  conteudo: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useModelosContrato = () => {
  const queryClient = useQueryClient();

  const { data: modelos, isLoading } = useQuery({
    queryKey: ["modelos-contrato"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modelos_contrato")
        .select("*")
        .order("is_default", { ascending: false })
        .order("nome");
      if (error) throw error;
      return (data as unknown as ModeloContrato[]) || [];
    },
  });

  const createModelo = useMutation({
    mutationFn: async (modelo: { nome: string; cargo_funcao: string; conteudo: string; is_default?: boolean }) => {
      const { error } = await supabase.from("modelos_contrato").insert(modelo as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos-contrato"] });
      toast.success("Modelo criado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao criar modelo: " + e.message),
  });

  const updateModelo = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ModeloContrato> }) => {
      const { error } = await supabase.from("modelos_contrato").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos-contrato"] });
      toast.success("Modelo atualizado!");
    },
    onError: (e) => toast.error("Erro ao atualizar: " + e.message),
  });

  const deleteModelo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modelos_contrato").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos-contrato"] });
      toast.success("Modelo excluído!");
    },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  return {
    modelos,
    isLoading,
    createModelo: createModelo.mutate,
    isCreating: createModelo.isPending,
    updateModelo: updateModelo.mutate,
    isUpdating: updateModelo.isPending,
    deleteModelo: deleteModelo.mutate,
    isDeleting: deleteModelo.isPending,
  };
};
