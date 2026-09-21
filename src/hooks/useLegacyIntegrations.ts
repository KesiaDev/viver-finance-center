import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Feature flag "legacy_integrations_enabled" (financial_config).
 * Controla a exibição das integrações legadas: Hubla, Marvee e Metabase.
 * Guardada como numérico: 0 = desligado, 1 = ligado.
 */
export function useLegacyIntegrations() {
  const { data, isLoading } = useQuery({
    queryKey: ["legacy-integrations-enabled"],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("financial_config")
        .select("value")
        .eq("key", "legacy_integrations_enabled")
        .maybeSingle();

      if (error) {
        console.error("Error fetching legacy integrations flag:", error);
        return false;
      }

      return Number(data?.value ?? 0) === 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    legacyIntegrationsEnabled: data ?? false,
    isLoading,
  };
}
