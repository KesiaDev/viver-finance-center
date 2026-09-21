import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotaFiscalAnexo {
  id: string;
  nota_fiscal_id: string;
  descricao: string;
  arquivo_url: string;
  ordem: number;
  created_at: string;
}

interface NotaFiscal {
  id: string;
  user_id: string;
  nome: string;
  cnpj: string;
  descricao?: string;
  periodo_referencia: string;
  mes_pagamento?: string;
  valor: number;
  nota_url: string;
  chave_pix: string;
  status: string;
  status_comentario?: string | null;
  created_at: string;
  updated_at: string;
  nota_fiscal_anexos?: NotaFiscalAnexo[];
}

export const useMyNotasFiscais = () => {
  const { user } = useAuth();

  const { data: notasFiscais, isLoading } = useQuery({
    queryKey: ["my-notas-fiscais", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 [useMyNotasFiscais] Buscando notas fiscais para user_id:', user.id);
      
      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*, nota_fiscal_anexos(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ [useMyNotasFiscais] Erro:', error);
        throw error;
      }
      
      console.log('✅ [useMyNotasFiscais] Encontradas:', data?.length || 0, 'notas fiscais');
      return (data as NotaFiscal[]) || [];
    },
    enabled: !!user,
  });

  return {
    notasFiscais,
    isLoading,
  };
};