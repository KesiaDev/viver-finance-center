import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Equipamento {
  id: string;
  colaborador_id: string | null;
  nome: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  patrimonio: string | null;
  estado: string;
  data_aquisicao: string | null;
  valor: number | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  colaborador?: {
    id: string;
    nome: string;
  } | null;
}

export interface EquipamentoInput {
  colaborador_id?: string | null;
  nome: string;
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  patrimonio?: string | null;
  estado: string;
  data_aquisicao?: string | null;
  valor?: number | null;
  observacoes?: string | null;
  ativo?: boolean;
}

export const TIPOS_EQUIPAMENTO = [
  "Notebook",
  "Monitor",
  "Mouse",
  "Teclado",
  "Headset",
  "Webcam",
  "Celular",
  "Tablet",
  "Cadeira",
  "Mesa",
  "Outros",
] as const;

export const ESTADOS_EQUIPAMENTO = [
  { value: "novo", label: "Novo" },
  { value: "bom", label: "Bom" },
  { value: "regular", label: "Regular" },
  { value: "danificado", label: "Danificado" },
] as const;

export function useEquipamentos() {
  const queryClient = useQueryClient();

  const { data: equipamentos, isLoading } = useQuery({
    queryKey: ["equipamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos")
        .select(`
          *,
          colaborador:colaboradores(id, nome)
        `)
        .order("nome");

      if (error) throw error;
      return data as Equipamento[];
    },
  });

  const createEquipamento = useMutation({
    mutationFn: async (equipamento: EquipamentoInput) => {
      const { data, error } = await supabase
        .from("equipamentos")
        .insert(equipamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      toast.success("Equipamento cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cadastrar equipamento: " + error.message);
    },
  });

  const updateEquipamento = useMutation({
    mutationFn: async ({
      id,
      ...equipamento
    }: EquipamentoInput & { id: string }) => {
      const { data, error } = await supabase
        .from("equipamentos")
        .update(equipamento)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      toast.success("Equipamento atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar equipamento: " + error.message);
    },
  });

  const deleteEquipamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipamentos"] });
      toast.success("Equipamento excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir equipamento: " + error.message);
    },
  });

  return {
    equipamentos,
    isLoading,
    createEquipamento: createEquipamento.mutate,
    updateEquipamento: updateEquipamento.mutate,
    deleteEquipamento: deleteEquipamento.mutate,
    isCreating: createEquipamento.isPending,
    isUpdating: updateEquipamento.isPending,
    isDeleting: deleteEquipamento.isPending,
  };
}

export function useEquipamentosByColaborador(colaboradorId: string) {
  return useQuery({
    queryKey: ["equipamentos", "colaborador", colaboradorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos")
        .select("*")
        .eq("colaborador_id", colaboradorId)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data as Equipamento[];
    },
    enabled: !!colaboradorId,
  });
}
