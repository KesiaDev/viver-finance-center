import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ColaboradorNota {
  id: string;
  colaborador_id: string;
  conteudo: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export const useColaboradorNotas = (colaboradorId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: notas, isLoading } = useQuery({
    queryKey: ["colaborador-notas", colaboradorId],
    queryFn: async () => {
      if (!colaboradorId) return [];
      
      const { data, error } = await supabase
        .from("colaborador_notas")
        .select("*")
        .eq("colaborador_id", colaboradorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch author names
      const authorIds = [...new Set(data.filter(n => n.created_by).map(n => n.created_by))];
      
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, nome_completo")
          .in("id", authorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.nome_completo || p.email]) || []);
        
        return data.map(nota => ({
          ...nota,
          author_name: nota.created_by ? profileMap.get(nota.created_by) || "Usuário" : undefined
        })) as ColaboradorNota[];
      }
      
      return data as ColaboradorNota[];
    },
    enabled: !!colaboradorId,
  });

  const createNota = useMutation({
    mutationFn: async (conteudo: string) => {
      if (!colaboradorId) throw new Error("ID do colaborador não informado");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("colaborador_notas")
        .insert({
          colaborador_id: colaboradorId,
          conteudo,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaborador-notas", colaboradorId] });
      toast.success("Nota adicionada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar nota: " + error.message);
    },
  });

  const updateNota = useMutation({
    mutationFn: async ({ id, conteudo }: { id: string; conteudo: string }) => {
      const { data, error } = await supabase
        .from("colaborador_notas")
        .update({ conteudo })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaborador-notas", colaboradorId] });
      toast.success("Nota atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar nota: " + error.message);
    },
  });

  const deleteNota = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("colaborador_notas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaborador-notas", colaboradorId] });
      toast.success("Nota excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir nota: " + error.message);
    },
  });

  return {
    notas,
    isLoading,
    createNota: createNota.mutate,
    updateNota: updateNota.mutate,
    deleteNota: deleteNota.mutate,
    isCreating: createNota.isPending,
    isUpdating: updateNota.isPending,
    isDeleting: deleteNota.isPending,
  };
};
