import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EquipamentoFoto {
  id: string;
  equipamento_id: string;
  arquivo_url: string;
  descricao: string | null;
  ordem: number | null;
  created_at: string | null;
  uploaded_by: string | null;
}

export const useEquipamentoFotos = (equipamentoId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ["equipamento-fotos", equipamentoId],
    queryFn: async () => {
      if (!equipamentoId) return [];
      
      const { data, error } = await supabase
        .from("equipamento_fotos")
        .select("*")
        .eq("equipamento_id", equipamentoId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as EquipamentoFoto[];
    },
    enabled: !!equipamentoId,
  });

  const uploadFoto = useMutation({
    mutationFn: async ({
      file,
      descricao,
    }: {
      file: File;
      descricao?: string;
    }) => {
      if (!equipamentoId) throw new Error("ID do equipamento não informado");

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Gerar nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${equipamentoId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from("equipamentos-fotos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter próxima ordem
      const maxOrdem = fotos.reduce((max, foto) => Math.max(max, foto.ordem || 0), 0);

      // Registrar no banco
      const { data, error } = await supabase
        .from("equipamento_fotos")
        .insert({
          equipamento_id: equipamentoId,
          arquivo_url: fileName,
          descricao: descricao || null,
          ordem: maxOrdem + 1,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamento-fotos", equipamentoId] });
      toast.success("Foto adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da foto");
    },
  });

  const deleteFoto = useMutation({
    mutationFn: async (foto: EquipamentoFoto) => {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from("equipamentos-fotos")
        .remove([foto.arquivo_url]);

      if (storageError) {
        console.error("Erro ao deletar do storage:", storageError);
      }

      // Deletar do banco
      const { error } = await supabase
        .from("equipamento_fotos")
        .delete()
        .eq("id", foto.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamento-fotos", equipamentoId] });
      toast.success("Foto removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao deletar foto:", error);
      toast.error("Erro ao remover a foto");
    },
  });

  const getPhotoUrl = (arquivoUrl: string) => {
    const { data } = supabase.storage
      .from("equipamentos-fotos")
      .getPublicUrl(arquivoUrl);
    return data.publicUrl;
  };

  return {
    fotos,
    isLoading,
    uploadFoto,
    deleteFoto,
    getPhotoUrl,
    isUploading: uploadFoto.isPending,
    isDeleting: deleteFoto.isPending,
  };
};
