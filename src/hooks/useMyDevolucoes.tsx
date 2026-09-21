import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DevolucaoAnexo {
  id: string;
  descricao: string;
  arquivo_url: string;
  ordem: number;
}

export interface DevolucaoWithAnexos {
  id: string;
  user_id: string;
  nome_cliente: string;
  valor: number;
  motivo: string;
  link_venda_hubla: string;
  responsavel: string;
  tipo_chave_pix: string;
  chave_pix: string;
  comprovante_original_url: string | null;
  status: string;
  status_comentario: string | null;
  data_prevista_pagamento: string | null;
  created_at: string;
  updated_at: string;
  devolucao_anexos: DevolucaoAnexo[];
}

export const useMyDevolucoes = () => {
  const { user } = useAuth();

  const { data: devolucoes, isLoading } = useQuery({
    queryKey: ["my-devolucoes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 [useMyDevolucoes] Buscando devoluções para user_id:', user.id);
      
      const { data, error } = await supabase
        .from("devolucoes")
        .select("*, devolucao_anexos(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ [useMyDevolucoes] Erro:', error);
        throw error;
      }
      
      console.log('✅ [useMyDevolucoes] Encontradas:', data?.length || 0, 'devoluções');
      return (data as unknown as DevolucaoWithAnexos[]) || [];
    },
    enabled: !!user,
  });

  return {
    devolucoes,
    isLoading,
  };
};
