import { useMutation } from "@tanstack/react-query";
import { subMonths, format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { MarveeRecord } from "@/components/financeiro/MarveeResultHelpers";

interface CashFlowParams {
  dateStart: string;
  dateEnd: string;
  dateOption: string;
}

interface CashFlowResult {
  receitas: MarveeRecord[];
  despesas: MarveeRecord[];
}

export const useMarveeCashFlowTest = () => {
  return useMutation({
    mutationFn: async ({ dateStart, dateEnd, dateOption }: CashFlowParams): Promise<CashFlowResult> => {
      // Fetch one month before to calculate opening balance
      const bufferStart = format(subMonths(parse(dateStart, "yyyy-MM-dd", new Date()), 1), "yyyy-MM-dd");
      const commonParams: Record<string, string> = {
        dateStart: bufferStart,
        dateEnd,
        status: "paid",
      };
      if (dateOption) commonParams.date_option = dateOption;

      const [receber, pagar] = await Promise.all([
        supabase.functions.invoke("marvee-api-test", {
          body: {
            endpoint: "contas-a-receber",
            params: { ...commonParams },
            fetchAll: true,
          },
        }),
        supabase.functions.invoke("marvee-api-test", {
          body: {
            endpoint: "contas-a-pagar",
            params: { ...commonParams },
            fetchAll: true,
          },
        }),
      ]);

      if (receber.error) throw receber.error;
      if (pagar.error) throw pagar.error;

      const receitas = (receber.data?.response as any)?.data ?? [];
      const despesas = (pagar.data?.response as any)?.data ?? [];

      return { receitas, despesas };
    },
  });
};
