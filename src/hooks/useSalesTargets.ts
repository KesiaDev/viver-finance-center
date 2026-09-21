import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  SalesTarget, 
  SalesTargetInsert, 
  SalesTargetUpdate,
  SalesTargetMonthly,
  SalesTargetMonthlyInsert,
  SalesTargetWithMonthly
} from "@/types/financial";

interface UseSalesTargetsOptions {
  periodId?: string;
}

export const useSalesTargets = (options: UseSalesTargetsOptions = {}) => {
  const queryClient = useQueryClient();
  const { periodId } = options;

  const { data: salesTargets, isLoading } = useQuery({
    queryKey: ["sales-targets", periodId],
    queryFn: async () => {
      let query = supabase
        .from("sales_targets")
        .select(`
          *,
          monthly_data:sales_target_monthly(*)
        `)
        .order("created_at", { ascending: false });

      if (periodId) {
        query = query.eq("period_id", periodId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SalesTargetWithMonthly[];
    },
  });

  const createSalesTarget = useMutation({
    mutationFn: async (target: SalesTargetInsert) => {
      const { data, error } = await supabase
        .from("sales_targets")
        .insert(target)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-targets"] });
      toast.success("Meta de vendas criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  const updateSalesTarget = useMutation({
    mutationFn: async ({ id, ...updates }: SalesTargetUpdate & { id: string }) => {
      const { error } = await supabase
        .from("sales_targets")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-targets"] });
      toast.success("Meta de vendas atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar meta: " + error.message);
    },
  });

  const deleteSalesTarget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales_targets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-targets"] });
      toast.success("Meta de vendas excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir meta: " + error.message);
    },
  });

  // Mutations para dados mensais
  const upsertMonthlyData = useMutation({
    mutationFn: async (monthlyData: SalesTargetMonthlyInsert) => {
      const { data, error } = await supabase
        .from("sales_target_monthly")
        .upsert(monthlyData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-targets"] });
      toast.success("Dados mensais atualizados!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dados mensais: " + error.message);
    },
  });

  // Calcular totais
  const calculateTotals = (target: SalesTargetWithMonthly) => {
    const monthlyData = target.monthly_data || [];
    return {
      totalTarget: monthlyData.reduce((acc, m) => acc + (Number(m.monthly_target) || 0), 0),
      totalAchieved: monthlyData.reduce((acc, m) => acc + (Number(m.achieved_value) || 0), 0),
      totalCash: monthlyData.reduce((acc, m) => acc + (Number(m.cash_achieved) || 0), 0),
      totalRecurring: monthlyData.reduce((acc, m) => acc + (Number(m.recurring_achieved) || 0), 0),
    };
  };

  return {
    salesTargets,
    isLoading,
    calculateTotals,
    createSalesTarget: createSalesTarget.mutate,
    updateSalesTarget: updateSalesTarget.mutate,
    deleteSalesTarget: deleteSalesTarget.mutate,
    upsertMonthlyData: upsertMonthlyData.mutate,
    // Async versions for awaiting completion
    createSalesTargetAsync: createSalesTarget.mutateAsync,
    updateSalesTargetAsync: updateSalesTarget.mutateAsync,
    isCreating: createSalesTarget.isPending,
    isUpdating: updateSalesTarget.isPending,
    isDeleting: deleteSalesTarget.isPending,
  };
};
