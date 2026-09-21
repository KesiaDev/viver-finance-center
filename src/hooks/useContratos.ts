import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SolicitacaoContrato } from "./useMyContratos";

export const useContratos = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: contratos, isLoading } = useQuery({
    queryKey: ["contratos", user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_contrato")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as SolicitacaoContrato[]) || [];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, comentario }: { id: string; status: string; comentario?: string }) => {
      const updateData: Partial<SolicitacaoContrato> = { status };
      if (status === "rejeitado" && comentario) {
        updateData.status_comentario = comentario;
      } else if (status !== "rejeitado") {
        updateData.status_comentario = null;
      }

      const { error } = await supabase
        .from("solicitacoes_contrato")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["my-contratos"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteContrato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("solicitacoes_contrato")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["my-contratos"] });
      toast.success("Solicitação excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const sendToSignature = useMutation({
    mutationFn: async (id: string) => {
      const { error: fnError } = await supabase.functions.invoke("generate-contract", {
        body: { solicitacaoId: id },
      });
      if (fnError) throw fnError;

      const { error } = await supabase
        .from("solicitacoes_contrato")
        .update({ status: "assinatura" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["my-contratos"] });
      toast.success("Contrato enviado para assinatura!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar para assinatura: " + error.message);
    },
  });

  const editContrato = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SolicitacaoContrato> }) => {
      const { error } = await supabase
        .from("solicitacoes_contrato")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["my-contratos"] });
      toast.success("Solicitação atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  return {
    contratos,
    isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
    deleteContrato: deleteContrato.mutate,
    isDeleting: deleteContrato.isPending,
    sendToSignature: sendToSignature.mutate,
    isSending: sendToSignature.isPending,
    editContrato: editContrato.mutate,
    isEditing: editContrato.isPending,
  };
};
