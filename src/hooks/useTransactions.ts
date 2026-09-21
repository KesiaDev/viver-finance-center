import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  Transaction,
  TransactionInsert, 
  TransactionUpdate,
  TransactionWithCategory,
  TransactionCategory
} from "@/types/financial";

interface UseTransactionsOptions {
  periodId?: string;
  type?: 'revenue' | 'expense' | 'tax';
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const queryClient = useQueryClient();
  const { periodId, type } = options;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", periodId, type],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          category:transaction_categories(*)
        `)
        .order("date", { ascending: false });

      if (periodId) {
        query = query.eq("period_id", periodId);
      }
      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TransactionWithCategory[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as TransactionCategory[];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: TransactionUpdate & { id: string }) => {
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir transação: " + error.message);
    },
  });

  // Totais por tipo
  const totals = transactions?.reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + Number(t.amount);
      return acc;
    },
    { revenue: 0, expense: 0, tax: 0 } as Record<string, number>
  ) || { revenue: 0, expense: 0, tax: 0 };

  return {
    transactions,
    categories,
    totals,
    isLoading,
    createTransaction: createTransaction.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isCreating: createTransaction.isPending,
    isUpdating: updateTransaction.isPending,
    isDeleting: deleteTransaction.isPending,
  };
};
