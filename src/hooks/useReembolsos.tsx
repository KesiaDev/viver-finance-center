import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { extractStoragePath } from "@/lib/storageUtils";

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

export const useReembolsos = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: reembolsos, isLoading } = useQuery({
    queryKey: ["reembolsos", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("reembolsos")
        .select("*, reembolso_anexos(*)")
        .order("created_at", { ascending: false });

      if (!isAdmin && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as ReembolsoWithAnexos[]) || [];
    },
    enabled: !!user,
  });

  const exportToDrive = async (reembolso: ReembolsoWithAnexos) => {
    try {
      // Get all attachment URLs
      const arquivoUrls: string[] = [];
      
      if (reembolso.reembolso_anexos && reembolso.reembolso_anexos.length > 0) {
        for (const anexo of reembolso.reembolso_anexos) {
          arquivoUrls.push(anexo.arquivo_url);
        }
      } else if (reembolso.comprovante_url) {
        arquivoUrls.push(reembolso.comprovante_url);
      }

      if (arquivoUrls.length === 0) {
        console.log('No attachments to export for reembolso');
        return;
      }

      console.log('Exporting reembolso to Drive:', {
        id: reembolso.id,
        nome: reembolso.nome,
        data: reembolso.created_at,
        valor: reembolso.valor,
        arquivoUrls
      });

      const { data, error } = await supabase.functions.invoke('google-drive-export-reembolsos', {
        body: {
          reembolsoId: reembolso.id,
          nome: reembolso.nome,
          data: reembolso.created_at,
          valor: reembolso.valor,
          arquivoUrls
        }
      });

      if (error) {
        console.error('Drive export error:', error);
        toast.error('Erro ao exportar para o Drive: ' + error.message);
        return;
      }

      if (data?.success) {
        toast.success(`Reembolso exportado para o Drive (${data.message})`);
      } else {
        toast.error('Erro ao exportar para o Drive: ' + (data?.error || 'Erro desconhecido'));
      }
    } catch (err: any) {
      console.error('Export to Drive failed:', err);
      toast.error('Falha ao exportar para o Drive');
    }
  };

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
        .from("reembolsos")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // If status is "aprovado", export to Google Drive
      if (status === "aprovado") {
        const reembolso = reembolsos?.find(r => r.id === id);
        if (reembolso) {
          await exportToDrive(reembolso);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reembolsos"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteReembolso = useMutation({
    mutationFn: async (id: string) => {
      // Buscar anexos para deletar os arquivos
      const { data: anexos } = await supabase
        .from("reembolso_anexos")
        .select("arquivo_url")
        .eq("reembolso_id", id);

      // Buscar comprovante legacy
      const { data: reembolso } = await supabase
        .from("reembolsos")
        .select("comprovante_url")
        .eq("id", id)
        .single();

      // Deletar arquivos dos anexos
      if (anexos && anexos.length > 0) {
        const paths = anexos.map(a => extractStoragePath(a.arquivo_url));
        await supabase.storage.from('reembolsos').remove(paths);
      }

      // Deletar comprovante legacy
      if (reembolso?.comprovante_url) {
        const path = extractStoragePath(reembolso.comprovante_url);
        await supabase.storage.from('reembolsos').remove([path]);
      }

      const { error } = await supabase
        .from("reembolsos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reembolsos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Reembolso excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir reembolso: " + error.message);
    },
  });

  return {
    reembolsos,
    isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
    deleteReembolso: deleteReembolso.mutate,
    isDeleting: deleteReembolso.isPending,
  };
};
