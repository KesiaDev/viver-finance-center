import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  Goal, 
  GoalInsert, 
  GoalUpdate,
  GoalProgress 
} from "@/types/financial";

interface UseGoalsOptions {
  periodId?: string;
}

export const useGoals = (options: UseGoalsOptions = {}) => {
  const queryClient = useQueryClient();
  const { periodId } = options;

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals", periodId],
    queryFn: async () => {
      let query = supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (periodId) {
        query = query.eq("period_id", periodId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Goal[];
    },
  });

  const createGoal = useMutation({
    mutationFn: async (goal: GoalInsert) => {
      const { data, error } = await supabase
        .from("goals")
        .insert(goal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar meta: " + error.message);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: GoalUpdate & { id: string }) => {
      const { error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar meta: " + error.message);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir meta: " + error.message);
    },
  });

  // Calcula progresso de cada meta
  const goalsWithProgress: GoalProgress[] = goals?.map(goal => {
    const achieved = Number(goal.achieved_value) || 0;
    const target = Number(goal.target_value) || 1;
    const percentage = Math.min((achieved / target) * 100, 100);
    const remaining = Math.max(target - achieved, 0);

    return {
      goal,
      percentage,
      remaining,
    };
  }) || [];

  return {
    goals,
    goalsWithProgress,
    isLoading,
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    isCreating: createGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
};
