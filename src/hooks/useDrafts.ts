import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DraftType = 'reembolso' | 'devolucao' | 'nota_fiscal' | 'material' | 'contrato';

export interface Draft {
  id: string;
  user_id: string;
  type: DraftType;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useDrafts = (type: DraftType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: draft, isLoading } = useQuery({
    queryKey: ["draft", type, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", type)
        .maybeSingle();
      if (error) throw error;
      return data as Draft | null;
    },
    enabled: !!user,
  });

  const saveDraft = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("drafts")
        .upsert({
          user_id: user.id,
          type,
          data: formData,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id,type',
          ignoreDuplicates: false 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["draft", type] });
      toast.success("Rascunho salvo!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar rascunho: " + error.message);
    }
  });

  const deleteDraft = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase
        .from("drafts")
        .delete()
        .eq("user_id", user.id)
        .eq("type", type);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["draft", type] });
    },
  });

  return {
    draft,
    isLoading,
    saveDraft: saveDraft.mutate,
    isSaving: saveDraft.isPending,
    deleteDraft: deleteDraft.mutate,
    hasDraft: !!draft,
  };
};
