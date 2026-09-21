import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  MonthlyPlanning, 
  MonthlyPlanningInsert, 
  MonthlyPlanningUpdate 
} from "@/types/financial";

export const useMonthlyPlanning = () => {
  const queryClient = useQueryClient();

  const { data: planningData, isLoading } = useQuery({
    queryKey: ["monthly-planning"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_planning")
        .select("*")
        .order("month", { ascending: true });
      if (error) throw error;
      return data as MonthlyPlanning[];
    },
  });

  const upsertPlanning = useMutation({
    mutationFn: async (planning: MonthlyPlanningInsert) => {
      // Buscar dados existentes primeiro para mesclar
      const { data: existing } = await supabase
        .from("monthly_planning")
        .select("*")
        .eq("month", planning.month)
        .maybeSingle();
      
      // Mesclar com dados existentes (novos valores sobrescrevem)
      const mergedData = existing ? { ...existing, ...planning } : planning;
      
      const { data, error } = await supabase
        .from("monthly_planning")
        .upsert(mergedData, { onConflict: 'month' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-planning"] });
    },
    onError: (error) => {
      toast.error("Erro ao salvar planejamento: " + error.message);
    },
  });

  // Upsert silencioso para sincronização em batch (sem toast)
  const upsertPlanningBatch = useMutation({
    mutationFn: async (plannings: MonthlyPlanningInsert[]) => {
      const results = [];
      for (const planning of plannings) {
        const { data: existing } = await supabase
          .from("monthly_planning")
          .select("*")
          .eq("month", planning.month)
          .maybeSingle();
        
        const mergedData = existing ? { ...existing, ...planning } : planning;
        
        const { data, error } = await supabase
          .from("monthly_planning")
          .upsert(mergedData, { onConflict: 'month' })
          .select()
          .single();
        if (error) throw error;
        results.push(data);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-planning"] });
      toast.success("Planejamento sincronizado!");
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar planejamento: " + error.message);
    },
  });

  const updatePlanning = useMutation({
    mutationFn: async ({ id, ...updates }: MonthlyPlanningUpdate & { id: string }) => {
      const { error } = await supabase
        .from("monthly_planning")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-planning"] });
      toast.success("Planejamento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar planejamento: " + error.message);
    },
  });

  const deletePlanning = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monthly_planning")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-planning"] });
      toast.success("Planejamento excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir planejamento: " + error.message);
    },
  });

  // Buscar planejamento por mês específico
  const getPlanningByMonth = (month: string) => {
    return planningData?.find(p => p.month === month);
  };

  // Calcular totais do planejamento
  const totals = planningData?.reduce(
    (acc, p) => ({
      revenue: acc.revenue + (Number(p.revenue) || 0),
      plannedRevenue: acc.plannedRevenue + (Number(p.planned_revenue) || 0),
      otherRevenue: acc.otherRevenue + (Number(p.other_revenue) || 0),
      forecastRevenue: acc.forecastRevenue + (Number(p.forecast_revenue) || 0),
      revenueNewSales: acc.revenueNewSales + (Number(p.revenue_new_sales) || 0),
      revenueRecurringPrevious: acc.revenueRecurringPrevious + (Number(p.revenue_recurring_previous) || 0),
      expense: acc.expense + (Number(p.expense) || 0),
      plannedExpense: acc.plannedExpense + (Number(p.planned_expense) || 0),
      otherExpense: acc.otherExpense + (Number(p.other_expense) || 0),
      forecastExpense: acc.forecastExpense + (Number(p.forecast_expense) || 0),
      tax: acc.tax + (Number(p.tax) || 0),
      distribution: acc.distribution + (Number(p.distribution) || 0),
    }),
    {
      revenue: 0,
      plannedRevenue: 0,
      otherRevenue: 0,
      forecastRevenue: 0,
      revenueNewSales: 0,
      revenueRecurringPrevious: 0,
      expense: 0,
      plannedExpense: 0,
      otherExpense: 0,
      forecastExpense: 0,
      tax: 0,
      distribution: 0,
    }
  );

  return {
    planningData,
    totals,
    isLoading,
    getPlanningByMonth,
    upsertPlanning: upsertPlanning.mutate,
    upsertPlanningBatch: upsertPlanningBatch.mutateAsync,
    updatePlanning: updatePlanning.mutate,
    deletePlanning: deletePlanning.mutate,
    isSaving: upsertPlanning.isPending,
    isSyncingBatch: upsertPlanningBatch.isPending,
    isUpdating: updatePlanning.isPending,
    isDeleting: deletePlanning.isPending,
  };
};
