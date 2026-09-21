import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SolicitacaoContrato {
  id: string;
  user_id: string;
  status: string;
  status_comentario: string | null;
  nome: string;
  cpf: string | null;
  cnpj: string;
  cartao_cnpj_url: string | null;
  documento_foto_url: string | null;
  email: string;
  endereco: string;
  area: string;
  funcao: string;
  remuneracao: number;
  variavel: string | null;
  data_inicio_contrato: string;
  chave_pix: string | null;
  tipo_chave_pix: string | null;
  escopo_trabalho: string;
  remuneracao_extenso: string | null;
  contrato_url: string | null;
  autentique_doc_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useMyContratos = () => {
  const { user } = useAuth();

  const { data: contratos, isLoading } = useQuery({
    queryKey: ["my-contratos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("solicitacoes_contrato")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as SolicitacaoContrato[]) || [];
    },
    enabled: !!user,
  });

  return { contratos, isLoading };
};
