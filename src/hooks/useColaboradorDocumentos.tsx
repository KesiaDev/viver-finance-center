import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ColaboradorDocumento {
  id: string;
  colaborador_id: string;
  nome: string;
  tipo: string;
  arquivo_url: string;
  uploaded_by: string | null;
  created_at: string;
  uploader_email?: string;
}

const sanitizeFileName = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
};

export const useColaboradorDocumentos = (colaboradorId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: documentos, isLoading } = useQuery({
    queryKey: ["colaborador-documentos", colaboradorId],
    queryFn: async () => {
      if (!colaboradorId) return [];
      
      const { data, error } = await supabase
        .from("colaborador_documentos")
        .select("*")
        .eq("colaborador_id", colaboradorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch uploader emails
      const uploaderIds = [...new Set(data.filter(d => d.uploaded_by).map(d => d.uploaded_by))];
      
      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, nome_completo")
          .in("id", uploaderIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.nome_completo || p.email]) || []);
        
        return data.map(doc => ({
          ...doc,
          uploader_email: doc.uploaded_by ? profileMap.get(doc.uploaded_by) || "Usuário" : undefined
        })) as ColaboradorDocumento[];
      }
      
      return data as ColaboradorDocumento[];
    },
    enabled: !!colaboradorId,
  });

  const uploadDocumento = useMutation({
    mutationFn: async ({ file, nome, tipo }: { file: File; nome: string; tipo: string }) => {
      if (!colaboradorId) throw new Error("ID do colaborador não informado");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const sanitizedNome = sanitizeFileName(nome);
      const fileName = `${colaboradorId}/${Date.now()}-${sanitizedNome}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("colaboradores-docs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("colaboradores-docs")
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from("colaborador_documentos")
        .insert({
          colaborador_id: colaboradorId,
          nome,
          tipo,
          arquivo_url: fileName,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaborador-documentos", colaboradorId] });
      toast.success("Documento enviado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar documento: " + error.message);
    },
  });

  const deleteDocumento = useMutation({
    mutationFn: async (documento: ColaboradorDocumento) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("colaboradores-docs")
        .remove([documento.arquivo_url]);

      if (storageError) console.error("Erro ao remover arquivo:", storageError);

      // Delete from database
      const { error } = await supabase
        .from("colaborador_documentos")
        .delete()
        .eq("id", documento.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaborador-documentos", colaboradorId] });
      toast.success("Documento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir documento: " + error.message);
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("colaboradores-docs")
      .createSignedUrl(filePath, 60);

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documentos,
    isLoading,
    uploadDocumento: uploadDocumento.mutate,
    deleteDocumento: deleteDocumento.mutate,
    getDownloadUrl,
    isUploading: uploadDocumento.isPending,
    isDeleting: deleteDocumento.isPending,
  };
};
