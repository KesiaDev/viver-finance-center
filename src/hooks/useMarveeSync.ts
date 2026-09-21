import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncResult {
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  contasReceber: number;
  contasPagar: number;
}

interface SyncRawStats {
  contasReceberPaid: number;
  contasReceberPending: number;
  contasPagarPaid: number;
  contasPagarPending: number;
  total: number;
  inserted: number;
  updated: number;
  errors: string[];
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  triggered_by: string;
  created_at: string;
}

interface CategoryMapping {
  id: string;
  marvee_cost_center_id: string | null;
  marvee_cost_center_name: string | null;
  marvee_category_structure: string | null;
  marvee_category_description: string | null;
  cash_flow_category_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredCategory {
  id: string; // structure (e.g., "01.01.01")
  name: string; // formatted as "structure - description"
  description: string;
  source: "receivable" | "payable" | "both";
  count: number;
  isMapped: boolean;
}

export function useMarveeSync() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingDetailed, setIsSyncingDetailed] = useState(false);
  const [isSyncingRaw, setIsSyncingRaw] = useState(false);
  const [isSyncingExtrato, setIsSyncingExtrato] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Fetch last sync log
  const { data: lastSync, isLoading: isLoadingLastSync } = useQuery({
    queryKey: ["marvee-last-sync"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marvee_sync_logs")
        .select("*")
        .eq("sync_type", "cash_flow")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data as SyncLog | null;
    },
  });

  // Fetch sync logs history
  const { data: syncLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["marvee-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marvee_sync_logs")
        .select("*")
        .eq("sync_type", "cash_flow")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SyncLog[];
    },
  });

  // Fetch category mappings
  const { data: mappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["marvee-category-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marvee_category_mapping")
        .select("*")
        .order("marvee_category_structure");

      if (error) throw error;
      return data as CategoryMapping[];
    },
  });

  // Sync cash flow data
  const syncCashFlow = useMutation({
    mutationFn: async ({ year, month, syncAll }: { year?: number; month?: number; syncAll?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("marvee-sync", {
        body: {
          sync_type: "cash_flow",
          triggered_by: "manual",
          year,
          month,
          sync_all: syncAll,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as SyncResult;
    },
    onMutate: () => {
      setIsSyncing(true);
    },
    onSuccess: (data) => {
      setIsSyncing(false);
      queryClient.invalidateQueries({ queryKey: ["marvee-last-sync"] });
      queryClient.invalidateQueries({ queryKey: ["marvee-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow-data"] });

      if (data.errors.length > 0) {
        toast.warning("Sincronização concluída com alertas", {
          description: `${data.created} criados, ${data.updated} atualizados. ${data.errors.length} erros.`,
        });
      } else {
        toast.success("Sincronização concluída!", {
          description: `${data.created} criados, ${data.updated} atualizados.`,
        });
      }
    },
    onError: (error) => {
      setIsSyncing(false);
      toast.error("Erro na sincronização", {
        description: error.message,
      });
    },
  });

  // Sync detailed cash flow data (3 levels)
  const syncCashFlowDetailed = useMutation({
    mutationFn: async ({ year, month, syncAll }: { year?: number; month?: number; syncAll?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("marvee-sync-detailed", {
        body: {
          sync_type: "cash_flow_detailed",
          triggered_by: "manual",
          year,
          month,
          sync_all: syncAll,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as SyncResult;
    },
    onMutate: () => {
      setIsSyncingDetailed(true);
    },
    onSuccess: (data) => {
      setIsSyncingDetailed(false);
      queryClient.invalidateQueries({ queryKey: ["cash-flow-data-detailed"] });

      if (data.errors.length > 0) {
        toast.warning("Sincronização detalhada concluída com alertas", {
          description: `${data.created} criados, ${data.updated} atualizados. ${data.errors.length} erros.`,
        });
      } else {
        toast.success("Sincronização detalhada concluída!", {
          description: `${data.created} criados, ${data.updated} atualizados.`,
        });
      }
    },
    onError: (error) => {
      setIsSyncingDetailed(false);
      toast.error("Erro na sincronização detalhada", {
        description: error.message,
      });
    },
  });

  // Sync raw transactions (no aggregation)
  const syncRawTransactions = useMutation({
    mutationFn: async ({ year, syncAll }: { year?: number; syncAll?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("marvee-sync-raw", {
        body: {
          year,
          sync_all: syncAll,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as {
        success: boolean;
        stats: SyncRawStats;
        dateRange: { startDate: string; endDate: string };
      };
    },
    onMutate: () => {
      setIsSyncingRaw(true);
    },
    onSuccess: (data) => {
      setIsSyncingRaw(false);
      queryClient.invalidateQueries({ queryKey: ["marvee-transactions"] });

      const { stats } = data;
      if (stats.errors.length > 0) {
        toast.warning("Dados brutos sincronizados com alertas", {
          description: `${stats.total} registros processados, ${stats.errors.length} erros.`,
        });
      } else {
        toast.success("Dados brutos sincronizados!", {
          description: `${stats.total} registros: ${stats.contasReceberPaid + stats.contasReceberPending} receitas, ${stats.contasPagarPaid + stats.contasPagarPending} despesas.`,
        });
      }
    },
    onError: (error) => {
      setIsSyncingRaw(false);
      toast.error("Erro na sincronização de dados brutos", {
        description: error.message,
      });
    },
  });

  // Populate cash flow tables (expenses + revenues) from raw data
  const populateCashFlowTables = useMutation({
    mutationFn: async ({ year }: { year?: number }) => {
      const { data, error } = await supabase.rpc("populate_cash_flow_tables", {
        p_year: year || null,
      });

      if (error) throw error;
      return data as { expenses_count: number; revenues_count: number; expenses_deleted: number; revenues_deleted: number }[];
    },
    onMutate: () => {
      setIsAggregating(true);
    },
    onSuccess: (data) => {
      setIsAggregating(false);
      queryClient.invalidateQueries({ queryKey: ["cash-flow-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow-revenues"] });
      queryClient.invalidateQueries({ queryKey: ["cash-flow-data-detailed"] });

      const result = data?.[0];
      toast.success("Tabelas populadas!", {
        description: `Despesas: ${result?.expenses_count || 0}, Receitas: ${result?.revenues_count || 0}`,
      });
    },
    onError: (error) => {
      setIsAggregating(false);
      toast.error("Erro ao popular tabelas", {
        description: error.message,
      });
    },
  });

  // Sync extrato (endpoint /v1/extrato)
  const syncExtrato = useMutation({
    mutationFn: async ({ year, syncAll }: { year?: number; syncAll?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("marvee-sync-extrato", {
        body: { year, sync_all: syncAll },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data as { success: boolean; stats: { total: number; upserted: number; errors: string[] }; sourceCounts: Record<string, number> };
    },
    onMutate: () => setIsSyncingExtrato(true),
    onSuccess: (data) => {
      setIsSyncingExtrato(false);
      queryClient.invalidateQueries({ queryKey: ["marvee-extrato"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-cash-flow-db"] });
      queryClient.invalidateQueries({ queryKey: ["marvee-last-sync"] });
      const { stats } = data;
      if (stats.errors.length > 0) {
        toast.warning("Extrato sincronizado com alertas", {
          description: `${stats.upserted} registros upsertados, ${stats.errors.length} erros.`,
        });
      } else {
        toast.success("Extrato sincronizado!", {
          description: `${stats.upserted} registros de ${stats.total} processados.`,
        });
      }
    },
    onError: (error) => {
      setIsSyncingExtrato(false);
      toast.error("Erro ao sincronizar extrato", { description: error.message });
    },
  });

  // Keep old aggregate function for backward compatibility
  const aggregateRawToDetailed = useMutation({
    mutationFn: async ({ year }: { year?: number }) => {
      const { data, error } = await supabase.rpc("aggregate_raw_to_detailed", {
        p_year: year || null,
      });
      if (error) throw error;
      return data as { processed: number; created: number; updated: number }[];
    },
    onMutate: () => setIsAggregating(true),
    onSuccess: (data) => {
      setIsAggregating(false);
      queryClient.invalidateQueries({ queryKey: ["cash-flow-data-detailed"] });
      const result = data?.[0];
      toast.success("Agregação concluída!", {
        description: `${result?.processed || 0} registros processados.`,
      });
    },
    onError: (error) => {
      setIsAggregating(false);
      toast.error("Erro na agregação", { description: error.message });
    },
  });

  // Discover categories from Marvee
  const discoverCategories = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("marvee-discover-categories");

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data as {
        categories: DiscoveredCategory[];
        totalReceivables: number;
        totalPayables: number;
      };
    },
    onMutate: () => {
      setIsDiscovering(true);
    },
    onSuccess: (data) => {
      setIsDiscovering(false);
      const unmapped = data.categories.filter(cat => !cat.isMapped).length;
      toast.success("Categorias descobertas!", {
        description: `${data.categories.length} encontradas, ${unmapped} não mapeadas.`,
      });
    },
    onError: (error) => {
      setIsDiscovering(false);
      toast.error("Erro ao descobrir categorias", {
        description: error.message,
      });
    },
  });

  // Add/update category mapping (using new structure fields)
  const upsertMapping = useMutation({
    mutationFn: async (mapping: {
      marvee_category_structure: string;
      marvee_category_description: string;
      cash_flow_category_code: string;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from("marvee_category_mapping")
        .upsert(
          {
            marvee_category_structure: mapping.marvee_category_structure,
            marvee_category_description: mapping.marvee_category_description,
            cash_flow_category_code: mapping.cash_flow_category_code,
            is_active: mapping.is_active,
          },
          { onConflict: "marvee_category_structure" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marvee-category-mappings"] });
      toast.success("Mapeamento salvo!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar mapeamento", {
        description: error.message,
      });
    },
  });

  // Delete category mapping
  const deleteMapping = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marvee_category_mapping")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marvee-category-mappings"] });
      toast.success("Mapeamento removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover mapeamento", {
        description: error.message,
      });
    },
  });

  return {
    // Sync
    syncCashFlow: syncCashFlow.mutate,
    isSyncing,

    // Sync Detailed
    syncCashFlowDetailed: syncCashFlowDetailed.mutate,
    isSyncingDetailed,

    // Sync Raw
    syncRawTransactions: syncRawTransactions.mutate,
    isSyncingRaw,

    // Sync Extrato
    syncExtrato: syncExtrato.mutate,
    isSyncingExtrato,

    // Populate Cash Flow Tables (new)
    populateCashFlowTables: populateCashFlowTables.mutate,
    isPopulating: populateCashFlowTables.isPending,

    // Aggregate Raw to Detailed (legacy)
    aggregateRawToDetailed: aggregateRawToDetailed.mutate,
    isAggregating,

    // Discovery
    discoverCategories: discoverCategories.mutateAsync,
    isDiscovering,

    // Last sync info
    lastSync,
    isLoadingLastSync,

    // Logs
    syncLogs,
    isLoadingLogs,

    // Mappings
    mappings,
    isLoadingMappings,
    upsertMapping: upsertMapping.mutate,
    deleteMapping: deleteMapping.mutate,
    isUpdatingMapping: upsertMapping.isPending,
  };
}
