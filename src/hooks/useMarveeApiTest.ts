import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MarveeApiTestParams {
  endpoint: "contas-a-pagar" | "contas-a-receber" | "extrato";
  params: Record<string, string>;
  fetchAll?: boolean;
}

interface MarveeApiTestResult {
  success: boolean;
  status: number;
  elapsed_ms: number;
  response: unknown;
  error?: string;
}

export const useMarveeApiTest = () => {
  return useMutation({
    mutationFn: async ({ endpoint, params, fetchAll }: MarveeApiTestParams): Promise<MarveeApiTestResult> => {
      const { data, error } = await supabase.functions.invoke("marvee-api-test", {
        body: { endpoint, params, fetchAll },
      });

      if (error) throw error;
      return data as MarveeApiTestResult;
    },
  });
};
