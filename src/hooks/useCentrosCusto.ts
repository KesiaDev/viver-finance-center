import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CentroCusto {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export function useCentrosCusto() {
  const queryClient = useQueryClient();

  const { data: centrosCusto, isLoading } = useQuery({
    queryKey: ["centros_custo_ferramentas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centros_custo_ferramentas")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as CentroCusto[];
    },
  });

  const createCentroCusto = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("centros_custo_ferramentas")
        .insert({ nome })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros_custo_ferramentas"] });
      toast.success("Centro de custo criado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar centro de custo: " + error.message);
    },
  });

  const updateCentroCusto = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { data, error } = await supabase
        .from("centros_custo_ferramentas")
        .update({ nome })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["centros_custo_ferramentas"] });
      toast.success("Centro de custo atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  return {
    centrosCusto: centrosCusto || [],
    isLoading,
    createCentroCusto: createCentroCusto.mutateAsync,
    updateCentroCusto: updateCentroCusto.mutateAsync,
    isCreating: createCentroCusto.isPending,
    isUpdating: updateCentroCusto.isPending,
  };
}
