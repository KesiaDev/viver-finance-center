import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  FinancialPeriod, 
  FinancialPeriodInsert, 
  FinancialPeriodUpdate 
} from "@/types/financial";

export const useFinancialPeriods = () => {
  const queryClient = useQueryClient();

  const { data: periods, isLoading } = useQuery({
    queryKey: ["financial-periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_periods")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as FinancialPeriod[];
    },
  });

  const createPeriod = useMutation({
    mutationFn: async (period: FinancialPeriodInsert) => {
      const { data, error } = await supabase
        .from("financial_periods")
        .insert(period)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-periods"] });
      toast.success("Período criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar período: " + error.message);
    },
  });

  const updatePeriod = useMutation({
    mutationFn: async ({ id, ...updates }: FinancialPeriodUpdate & { id: string }) => {
      const { error } = await supabase
        .from("financial_periods")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-periods"] });
      toast.success("Período atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar período: " + error.message);
    },
  });

  const deletePeriod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_periods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-periods"] });
      toast.success("Período excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir período: " + error.message);
    },
  });

  // Helper para buscar período ativo (aberto)
  const activePeriod = periods?.find(p => p.status === 'open');

  return {
    periods,
    activePeriod,
    isLoading,
    createPeriod: createPeriod.mutate,
    updatePeriod: updatePeriod.mutate,
    deletePeriod: deletePeriod.mutate,
    isCreating: createPeriod.isPending,
    isUpdating: updatePeriod.isPending,
    isDeleting: deletePeriod.isPending,
  };
};
