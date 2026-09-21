import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MonthlyPlanning } from "@/types/financial";

export interface InsightItem {
  titulo: string;
  descricao: string;
}

export interface RecommendationItem {
  acao: string;
  impacto: string;
  prazo: string;
}

export interface AIInsights {
  resumoExecutivo: string;
  pontosFortes: InsightItem[];
  pontosMelhoria: InsightItem[];
  pontosAtencao: InsightItem[];
  recomendacoes: RecommendationItem[];
}

export interface InsightsMetadata {
  periodo: string;
  dataAnalise: string;
  mesesAnalisados: number;
  mesesRealizados: number;
  mesVigente: string | null;
  diasRestantes: number | null;
  mesesProjetados: number;
  avisoContexto: string;
  geradoEm: string;
}

export interface InsightsResponse {
  success: boolean;
  insights: AIInsights;
  metadata: InsightsMetadata;
}

export const useAIInsights = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (
    planningData: MonthlyPlanning[] | null,
    selectedPeriod: string,
    months: string[]
  ) => {
    if (!planningData || planningData.length === 0) {
      toast.error("Não há dados de planejamento para analisar");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("planning-insights", {
        body: {
          planningData,
          selectedPeriod,
          months,
          currentDate: new Date().toISOString(),
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setInsights(data as InsightsResponse);
      toast.success("Insights gerados com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar insights";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearInsights = () => {
    setInsights(null);
    setError(null);
  };

  return {
    insights,
    isLoading,
    error,
    generateInsights,
    clearInsights,
  };
};
