import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MonthlyFlowRow {
  month: string;
  total_receitas: number;
  total_despesas: number;
}

interface UseMonthlyFlowParams {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export function useMonthlyFlowFromDB({ startDate, endDate }: UseMonthlyFlowParams) {
  const enabled = !!startDate && !!endDate;

  const query = useQuery({
    queryKey: ["monthly-cash-flow-db", startDate?.toISOString(), endDate?.toISOString()],
    enabled,
    queryFn: async (): Promise<MonthlyFlowRow[]> => {
      if (!startDate || !endDate) return [];

      const { data, error } = await supabase.rpc("get_monthly_cash_flow", {
        p_start_date: format(startDate, "yyyy-MM-dd"),
        p_end_date: format(endDate, "yyyy-MM-dd"),
      });

      if (error) throw new Error(error.message);
      return (data as MonthlyFlowRow[]) ?? [];
    },
  });

  const lastSyncQuery = useQuery({
    queryKey: ["marvee-last-sync"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marvee_transactions")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data?.synced_at ?? null;
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    lastSyncedAt: lastSyncQuery.data ?? null,
  };
}
