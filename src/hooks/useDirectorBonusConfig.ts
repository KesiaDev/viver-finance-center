import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DirectorBonusConfig {
  id: string;
  director_id: string;
  year: number;
  quarterly_base: number;
  annual_base: number;
}

export const useDirectorBonusConfig = (year: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações customizadas do ano
  const { data: configs, isLoading } = useQuery({
    queryKey: ["director-bonus-config", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("director_bonus_config")
        .select("*")
        .eq("year", year);

      if (error) throw error;
      return (data || []) as DirectorBonusConfig[];
    },
  });

  // Upsert configuração (apenas quarterly_base - annual_base é calculado como quarterly * 4)
  const updateConfigMutation = useMutation({
    mutationFn: async ({
      directorId,
      quarterlyBase,
    }: {
      directorId: string;
      quarterlyBase: number;
      annualBase?: number; // Ignorado - calculado dinamicamente
    }) => {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from("director_bonus_config")
        .select("id")
        .eq("director_id", directorId)
        .eq("year", year)
        .single();

      if (existing) {
        // Update - apenas quarterly_base
        const { error } = await supabase
          .from("director_bonus_config")
          .update({
            quarterly_base: quarterlyBase,
            annual_base: quarterlyBase * 4, // Calculado automaticamente
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert - annual_base calculado automaticamente
        const { error } = await supabase
          .from("director_bonus_config")
          .insert({
            director_id: directorId,
            year,
            quarterly_base: quarterlyBase,
            annual_base: quarterlyBase * 4, // Calculado automaticamente
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["director-bonus-config", year] });
      toast({
        title: "Configuração salva",
        description: "O valor base foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o valor base.",
        variant: "destructive",
      });
    },
  });

  // Deletar configuração (restaurar padrão)
  const resetConfigMutation = useMutation({
    mutationFn: async (directorId: string) => {
      const { error } = await supabase
        .from("director_bonus_config")
        .delete()
        .eq("director_id", directorId)
        .eq("year", year);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["director-bonus-config", year] });
      toast({
        title: "Configuração restaurada",
        description: "O valor base foi restaurado ao padrão.",
      });
    },
    onError: (error) => {
      console.error("Erro ao restaurar configuração:", error);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar o valor padrão.",
        variant: "destructive",
      });
    },
  });

  // Função helper para obter configuração customizada ou padrão
  const getCustomConfig = (directorId: string) => {
    return configs?.find((c) => c.director_id === directorId);
  };

  return {
    configs,
    isLoading,
    updateConfig: updateConfigMutation.mutate,
    isUpdating: updateConfigMutation.isPending,
    resetConfig: resetConfigMutation.mutate,
    isResetting: resetConfigMutation.isPending,
    getCustomConfig,
  };
};
