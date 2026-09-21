import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useColaboradorFuncao = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["colaborador-funcao", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("colaboradores")
        .select("funcao")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const funcao = data?.funcao || "";
  const isDiretorOuHead = /diretor|head/i.test(funcao);

  return { funcao, isDiretorOuHead, isLoading };
};
