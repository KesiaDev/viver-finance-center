import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { extractStoragePath } from "@/lib/storageUtils";

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
  created_at: string;
  updated_at: string;
  nota_fiscal_anexos?: NotaFiscalAnexo[];
}

export const useNotasFiscais = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notasFiscais, isLoading } = useQuery({
    queryKey: ["notas_fiscais", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("notas_fiscais")
        .select("*, nota_fiscal_anexos(*)")
        .order("created_at", { ascending: false });

      if (!isAdmin && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as NotaFiscal[]) || [];
    },
    enabled: !!user,
  });

  const exportToDrive = async (notaFiscal: NotaFiscal) => {
    try {
      // Get all attachment URLs
      const arquivoUrls: string[] = [];
      
      if (notaFiscal.nota_fiscal_anexos && notaFiscal.nota_fiscal_anexos.length > 0) {
        for (const anexo of notaFiscal.nota_fiscal_anexos) {
          arquivoUrls.push(anexo.arquivo_url);
        }
      } else if (notaFiscal.nota_url) {
        arquivoUrls.push(notaFiscal.nota_url);
      }

      if (arquivoUrls.length === 0) {
        console.log('No attachments to export');
        return;
      }

      console.log('Exporting to Drive:', {
        id: notaFiscal.id,
        cnpj: notaFiscal.cnpj,
        nome: notaFiscal.nome,
        mesPagamento: notaFiscal.mes_pagamento,
        arquivoUrls
      });

      const { data, error } = await supabase.functions.invoke('google-drive-export', {
        body: {
          notaFiscalId: notaFiscal.id,
          cnpj: notaFiscal.cnpj,
          nome: notaFiscal.nome,
          mesPagamento: notaFiscal.mes_pagamento || 'sem_mes',
          arquivoUrls
        }
      });

      if (error) {
        console.error('Drive export error:', error);
        toast.error('Erro ao exportar para o Drive: ' + error.message);
        return;
      }

      if (data?.success) {
        toast.success(`Nota fiscal exportada para o Drive (${data.message})`);
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
        .from("notas_fiscais")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // If status is "aprovado", export to Google Drive
      if (status === "aprovado") {
        const notaFiscal = notasFiscais?.find(nf => nf.id === id);
        if (notaFiscal) {
          await exportToDrive(notaFiscal);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteNotaFiscal = useMutation({
    mutationFn: async (id: string) => {
      // Get nota and its attachments
      const { data: nota } = await supabase
        .from("notas_fiscais")
        .select("nota_url, nota_fiscal_anexos(*)")
        .eq("id", id)
        .single();

      // Delete attachments from storage
      if (nota?.nota_fiscal_anexos && nota.nota_fiscal_anexos.length > 0) {
        for (const anexo of nota.nota_fiscal_anexos) {
          const path = extractStoragePath(anexo.arquivo_url);
          await supabase.storage.from('notas-fiscais').remove([path]);
        }
      } else if (nota?.nota_url) {
        // Fallback for legacy notas without separate attachments
        const path = extractStoragePath(nota.nota_url);
        await supabase.storage.from('notas-fiscais').remove([path]);
      }

      const { error } = await supabase
        .from("notas_fiscais")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      queryClient.invalidateQueries({ queryKey: ["my-notas-fiscais"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Nota fiscal excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir nota fiscal: " + error.message);
    },
  });

  return {
    notasFiscais,
    isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
    deleteNotaFiscal: deleteNotaFiscal.mutate,
    isDeleting: deleteNotaFiscal.isPending,
  };
};