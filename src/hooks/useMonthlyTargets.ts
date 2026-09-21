import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  MonthlyTarget, 
  MonthlyTargetInsert, 
  MonthlyTargetUpdate 
} from "@/types/financial";

export const useMonthlyTargets = () => {
  const queryClient = useQueryClient();

  const { data: targets, isLoading } = useQuery({
    queryKey: ["monthly-targets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .select("*")
        .order("month", { ascending: true });
      if (error) throw error;
      return data as MonthlyTarget[];
    },
  });

  const upsertTarget = useMutation({
    mutationFn: async (target: MonthlyTargetInsert) => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .upsert(target, { onConflict: 'month' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-targets"] });
      toast.success("Meta mensal salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar meta: " + error.message);
    },
  });

  const updateTarget = useMutation({
    mutationFn: async ({ id, ...updates }: MonthlyTargetUpdate & { id: string }) => {
      const { error } = await supabase
        .from("monthly_targets")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-targets"] });
      toast.success("Meta atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar meta: " + error.message);
    },
  });

  const deleteTarget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monthly_targets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-targets"] });
      toast.success("Meta excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir meta: " + error.message);
    },
  });

  // Buscar meta por mês específico
  const getTargetByMonth = (month: string) => {
    return targets?.find(t => t.month === month);
  };

  // Total de metas de receita
  const totalRevenueTarget = targets?.reduce(
    (acc, t) => acc + (Number(t.revenue_target) || 0),
    0
  ) || 0;

  return {
    targets,
    totalRevenueTarget,
    isLoading,
    getTargetByMonth,
    upsertTarget: upsertTarget.mutate,
    updateTarget: updateTarget.mutate,
    deleteTarget: deleteTarget.mutate,
    isSaving: upsertTarget.isPending,
    isUpdating: updateTarget.isPending,
    isDeleting: deleteTarget.isPending,
  };
};
