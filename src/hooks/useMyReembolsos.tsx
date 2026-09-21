import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReembolsoAnexo {
  id: string;
  descricao: string;
  arquivo_url: string;
  ordem: number;
}

export interface ReembolsoWithAnexos {
  id: string;
  user_id: string;
  nome: string;
  data: string;
  motivo: string;
  valor: number;
  centro_custo: string;
  tipo_chave_pix: string;
  chave_pix: string;
  comprovante_url: string | null;
  status: string;
  status_comentario: string | null;
  data_prevista_pagamento: string | null;
  created_at: string;
  updated_at: string;
  reembolso_anexos: ReembolsoAnexo[];
}

export const useMyReembolsos = () => {
  const { user } = useAuth();

  const { data: reembolsos, isLoading } = useQuery({
    queryKey: ["my-reembolsos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 [useMyReembolsos] Buscando reembolsos para user_id:', user.id);
      
      const { data, error } = await supabase
        .from("reembolsos")
        .select("*, reembolso_anexos(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ [useMyReembolsos] Erro:', error);
        throw error;
      }
      
      console.log('✅ [useMyReembolsos] Encontrados:', data?.length || 0, 'reembolsos');
      return (data as unknown as ReembolsoWithAnexos[]) || [];
    },
    enabled: !!user,
  });

  return {
    reembolsos,
    isLoading,
  };
};
