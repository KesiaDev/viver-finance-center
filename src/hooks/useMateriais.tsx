import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useMateriais = () => {
  const { user, isAdmin, canApprove } = useAuth();
  const queryClient = useQueryClient();

  const canViewAll = isAdmin || canApprove('materiais');

  const { data: materiais, isLoading } = useQuery({
    queryKey: ["materiais", user?.id, canViewAll],
    queryFn: async () => {
      let query = supabase
        .from("materiais")
        .select("*, material_itens(*)")
        .order("created_at", { ascending: false });

      if (!canViewAll && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
        .from("materiais")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("materiais")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Material excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir material: " + error.message);
    },
  });

  return {
    materiais,
    isLoading,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending,
    deleteMaterial: deleteMaterial.mutate,
    isDeleting: deleteMaterial.isPending,
  };
};
