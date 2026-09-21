import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, lastDayOfMonth } from "date-fns";

export interface BudgetVsActualRow {
  month: string;
  receita_prevista: number;
  receita_realizada: number;
  receita_meta: number;
  despesa_prevista: number;
  despesa_realizada: number;
  despesa_meta: number;
}

interface UseBudgetVsActualParams {
  year: number;
  month?: string | null; // "YYYY-MM" or null for full year
}

export function useBudgetVsActual({ year, month }: UseBudgetVsActualParams) {
  const startDate = month
    ? `${month}-01`
    : `${year}-01-01`;
  const endDate = month
    ? format(lastDayOfMonth(new Date(`${month}-01T00:00:00`)), "yyyy-MM-dd")
    : `${year}-12-31`;

  const query = useQuery({
    queryKey: ["budget-vs-actual", year, month],
    queryFn: async (): Promise<BudgetVsActualRow[]> => {
      const { data, error } = await supabase.rpc("get_budget_vs_actual", {
        p_start_date: startDate,
        p_end_date: endDate,
      });
      if (error) throw new Error(error.message);
      return (data as BudgetVsActualRow[]) ?? [];
    },
  });

  const lastSyncQuery = useQuery({
    queryKey: ["marvee-last-sync"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marvee_extrato")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data?.synced_at ?? null;
    },
  });

  const initialBalanceQuery = useQuery({
    queryKey: ["initial-balance", startDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_initial_balance_from_extrato", {
        p_cutoff_date: startDate,
      });
      if (error) throw new Error(error.message);
      return (data as number) ?? 0;
    },
  });

  // Compute totals
  const totals = query.data?.reduce(
    (acc, row) => ({
      receita_prevista: acc.receita_prevista + Number(row.receita_prevista),
      receita_realizada: acc.receita_realizada + Number(row.receita_realizada),
      receita_meta: acc.receita_meta + Number(row.receita_meta),
      despesa_prevista: acc.despesa_prevista + Number(row.despesa_prevista),
      despesa_realizada: acc.despesa_realizada + Number(row.despesa_realizada),
      despesa_meta: acc.despesa_meta + Number(row.despesa_meta),
    }),
    {
      receita_prevista: 0,
      receita_realizada: 0,
      receita_meta: 0,
      despesa_prevista: 0,
      despesa_realizada: 0,
      despesa_meta: 0,
    }
  );

  return {
    data: query.data,
    totals,
    initialBalance: initialBalanceQuery.data ?? 0,
    isLoading: query.isLoading || initialBalanceQuery.isLoading,
    isError: query.isError,
    error: query.error,
    lastSyncedAt: lastSyncQuery.data ?? null,
  };
}
