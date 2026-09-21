import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMyMateriais = () => {
  const { user } = useAuth();

  const { data: materiais, isLoading } = useQuery({
    queryKey: ["my-materiais", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 [useMyMateriais] Buscando materiais para user_id:', user.id);
      
      const { data, error } = await supabase
        .from("materiais")
        .select("*, material_itens(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ [useMyMateriais] Erro:', error);
        throw error;
      }
      
      console.log('✅ [useMyMateriais] Encontrados:', data?.length || 0, 'materiais');
      return data || [];
    },
    enabled: !!user,
  });

  return {
    materiais,
    isLoading,
  };
};
