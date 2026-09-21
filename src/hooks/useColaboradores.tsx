import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Colaborador {
  id: string;
  user_id: string | null;
  nome: string;
  cnpj: string | null;
  cpf: string;
  endereco: string | null;
  chave_pix_cnpj: string | null;
  email: string;
  data_inicio_contrato: string;
  data_fim_contrato: string | null;
  area: string;
  remuneracao: number;
  funcao: string;
  is_admin: boolean;
  has_finance_access: boolean;
  ativo: boolean;
  variavel: string | null;
  regra_ote: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportResult {
  nome: string;
  email: string;
  sucesso: boolean;
  erro?: string;
}

export const useColaboradores = () => {
  const queryClient = useQueryClient();

  const { data: colaboradores, isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Colaborador[];
    },
  });

  const createColaborador = useMutation({
    mutationFn: async (colaborador: Omit<Colaborador, "id" | "created_at" | "updated_at" | "user_id">) => {
      // Criar colaborador SEM criar usuário auth
      // O usuário criará sua própria conta ao acessar o sistema
      const { data, error } = await supabase
        .from("colaboradores")
        .insert({
          ...colaborador,
          user_id: null, // Será vinculado quando o colaborador se cadastrar
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador criado! O colaborador deve acessar /auth para criar sua senha.");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar colaborador: " + error.message);
    },
  });

  const updateColaborador = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Colaborador> & { id: string }) => {
      // O trigger sync_admin_role no banco sincroniza automaticamente
      // as alterações de is_admin com a tabela user_roles
      const { data, error } = await supabase
        .from("colaboradores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar colaborador: " + error.message);
    },
  });

  const deleteColaborador = useMutation({
    mutationFn: async (id: string) => {
      const { data: colaborador } = await supabase
        .from("colaboradores")
        .select("user_id")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("colaboradores")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Deletar usuário auth se existir
      if (colaborador?.user_id) {
        await supabase.functions.invoke('cleanup-colaboradores', {
          body: { userIds: [colaborador.user_id] }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir colaborador: " + error.message);
    },
  });

  const resetPassword = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId, newPassword },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Senha resetada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao resetar senha: " + error.message);
    },
  });

  const importColaboradores = useMutation({
    mutationFn: async (colaboradores: any[]) => {
      const { data, error } = await supabase.functions.invoke('import-colaboradores', {
        body: { colaboradores },
      });

      if (error) throw error;
      return data as { results: ImportResult[]; sucessos: number; falhas: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(`Importação concluída: ${data.sucessos} sucessos, ${data.falhas} falhas`);
    },
    onError: (error: any) => {
      toast.error("Erro na importação: " + error.message);
    },
  });

  const cleanupColaboradores = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cleanup-colaboradores');

      if (error) throw error;
      return data as { success: boolean; colaboradoresDeletados: number; usuariosDeletados: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(`Limpeza concluída: ${data.colaboradoresDeletados} colaboradores e ${data.usuariosDeletados} usuários removidos`);
    },
    onError: (error: any) => {
      toast.error("Erro na limpeza: " + error.message);
    },
  });

  const batchUpdateColaboradores = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Colaborador> }) => {
      const { data, error } = await supabase
        .from("colaboradores")
        .update(updates)
        .in("id", ids)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaboradores atualizados com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar colaboradores: " + error.message);
    },
  });

  const batchDeleteColaboradores = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: colaboradoresData } = await supabase
        .from("colaboradores")
        .select("user_id")
        .in("id", ids);

      const { error } = await supabase
        .from("colaboradores")
        .delete()
        .in("id", ids);

      if (error) throw error;

      const userIds = colaboradoresData?.filter(c => c.user_id).map(c => c.user_id) || [];
      if (userIds.length > 0) {
        await supabase.functions.invoke('cleanup-colaboradores', {
          body: { userIds }
        });
      }

      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(`${count} colaborador(es) excluído(s) com sucesso!`);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir colaboradores: " + error.message);
    },
  });

  return {
    colaboradores,
    isLoading,
    createColaborador: createColaborador.mutate,
    updateColaborador: updateColaborador.mutate,
    deleteColaborador: deleteColaborador.mutate,
    resetPassword: resetPassword.mutate,
    importColaboradores: importColaboradores.mutateAsync,
    cleanupColaboradores: cleanupColaboradores.mutateAsync,
    batchUpdateColaboradores: batchUpdateColaboradores.mutate,
    batchDeleteColaboradores: batchDeleteColaboradores.mutate,
    isCreating: createColaborador.isPending,
    isUpdating: updateColaborador.isPending,
    isDeleting: deleteColaborador.isPending,
    isResetting: resetPassword.isPending,
    isImporting: importColaboradores.isPending,
    isCleaning: cleanupColaboradores.isPending,
    isBatchUpdating: batchUpdateColaboradores.isPending,
    isBatchDeleting: batchDeleteColaboradores.isPending,
  };
};
