import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { extractStoragePath } from "@/lib/storageUtils";

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

export const useDevolucoes = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: devolucoes, isLoading } = useQuery({
    queryKey: ["devolucoes", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("devolucoes")
        .select("*, devolucao_anexos(*)")
        .order("created_at", { ascending: false });

      if (!isAdmin && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as DevolucaoWithAnexos[]) || [];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, comentario }: { id: string; status: string; comentario?: string }) => {
      const updateData: { status: string; status_comentario?: string } = { status };
      if (status === "rejeitado" && comentario) {
        updateData.status_comentario = comentario;
      } else if (status !== "rejeitado") {
        // Clear comment when changing to other status
        updateData.status_comentario = null as any;
      }
      
      const { error } = await supabase
        .from("devolucoes")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devolucoes"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteDevolucao = useMutation({
    mutationFn: async (id: string) => {
      // Buscar anexos para deletar os arquivos
      const { data: anexos } = await supabase
        .from("devolucao_anexos")
        .select("arquivo_url")
        .eq("devolucao_id", id);

      // Buscar comprovante legacy
      const { data: devolucao } = await supabase
        .from("devolucoes")
        .select("comprovante_original_url")
        .eq("id", id)
        .single();

      // Deletar arquivos dos anexos
      if (anexos && anexos.length > 0) {
        const paths = anexos.map(a => extractStoragePath(a.arquivo_url));
        await supabase.storage.from('devolucoes').remove(paths);
      }

      // Deletar comprovante legacy
      if (devolucao?.comprovante_original_url) {
        const path = extractStoragePath(devolucao.comprovante_original_url);
        await supabase.storage.from('devolucoes').remove([path]);
      }

      const { error } = await supabase
        .from("devolucoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devolucoes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Devolução excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir devolução: " + error.message);
    },
  });

  return {
    devolucoes,
    isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
    deleteDevolucao: deleteDevolucao.mutate,
    isDeleting: deleteDevolucao.isPending,
  };
};
