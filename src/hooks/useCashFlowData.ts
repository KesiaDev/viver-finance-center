import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo } from "react";

export interface CashFlowCategory {
  id: string;
  code: string;
  name: string;
  type: "revenue" | "expense" | "distribution" | "balance";
  parent_code: string | null;
  sort_order: number;
  is_calculated: boolean;
}

export interface CashFlowDataRecord {
  id: string;
  month: string;
  category_code: string;
  realized_value: number;
  projected_value: number;
  notes: string | null;
  synced_from: string | null;
  synced_at: string | null;
}

export interface CashFlowRow {
  code: string;
  name: string;
  type: "revenue" | "expense" | "distribution" | "balance";
  isParent: boolean;
  isCalculated: boolean;
  level: number;
  values: {
    [month: string]: {
      realized: number;
      projected: number;
    };
  };
  total: {
    realized: number;
    projected: number;
  };
  children?: CashFlowRow[];
}

export type StatusFilter = "realized" | "projected" | "both";

export const useCashFlowData = (year: number) => {
  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["cash-flow-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_flow_categories")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      return data as CashFlowCategory[];
    },
  });

  // Buscar dados do fluxo de caixa para o ano
  const { data: flowData = [], isLoading: isLoadingData } = useQuery({
    queryKey: ["cash-flow-data", year],
    queryFn: async () => {
      const startMonth = `${year}-01`;
      const endMonth = `${year}-12`;
      
      const { data, error } = await supabase
        .from("cash_flow_data")
        .select("*")
        .gte("month", startMonth)
        .lte("month", endMonth);
      
      if (error) throw error;
      return data as CashFlowDataRecord[];
    },
  });

  // Upsert de dados
  const upsertData = useMutation({
    mutationFn: async (data: {
      month: string;
      category_code: string;
      realized_value?: number;
      projected_value?: number;
      notes?: string;
    }) => {
      // Primeiro buscar se já existe
      const { data: existing } = await supabase
        .from("cash_flow_data")
        .select("id, realized_value, projected_value")
        .eq("month", data.month)
        .eq("category_code", data.category_code)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("cash_flow_data")
          .update({
            realized_value: data.realized_value ?? existing.realized_value,
            projected_value: data.projected_value ?? existing.projected_value,
            notes: data.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("cash_flow_data")
          .insert({
            month: data.month,
            category_code: data.category_code,
            realized_value: data.realized_value ?? 0,
            projected_value: data.projected_value ?? 0,
            notes: data.notes,
            synced_from: "manual",
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-flow-data", year] });
    },
    onError: (error) => {
      console.error("Erro ao salvar dados:", error);
      toast.error("Erro ao salvar dados do fluxo de caixa");
    },
  });

  // Gerar meses do ano
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, "0");
      return `${year}-${month}`;
    });
  }, [year]);

  // Construir estrutura hierárquica com totais calculados
  const rows = useMemo((): CashFlowRow[] => {
    if (categories.length === 0) return [];

    // Criar mapa de dados por categoria/mês
    const dataMap = new Map<string, { realized: number; projected: number }>();
    flowData.forEach((record) => {
      const key = `${record.category_code}-${record.month}`;
      dataMap.set(key, {
        realized: Number(record.realized_value) || 0,
        projected: Number(record.projected_value) || 0,
      });
    });

    // Função para obter valor de uma categoria/mês
    const getValue = (code: string, month: string) => {
      const key = `${code}-${month}`;
      return dataMap.get(key) || { realized: 0, projected: 0 };
    };

    // Separar pais e filhos
    const parents = categories.filter((c) => !c.parent_code);
    const childrenMap = new Map<string, CashFlowCategory[]>();
    categories.forEach((c) => {
      if (c.parent_code) {
        const existing = childrenMap.get(c.parent_code) || [];
        existing.push(c);
        childrenMap.set(c.parent_code, existing);
      }
    });

    // Calcular totais para categorias de soma (01, 02, 03, 04, 05)
    const calculateParentTotals = (parentCode: string) => {
      const children = childrenMap.get(parentCode) || [];
      const values: CashFlowRow["values"] = {};
      let totalRealized = 0;
      let totalProjected = 0;

      months.forEach((month) => {
        let monthRealized = 0;
        let monthProjected = 0;
        
        children.forEach((child) => {
          const val = getValue(child.code, month);
          monthRealized += val.realized;
          monthProjected += val.projected;
        });

        values[month] = { realized: monthRealized, projected: monthProjected };
        totalRealized += monthRealized;
        totalProjected += monthProjected;
      });

      return { values, total: { realized: totalRealized, projected: totalProjected } };
    };

    // Calcular linhas especiais
    const getReceitasOperacionais = () => calculateParentTotals("01");
    const getDespesasOperacionais = () => calculateParentTotals("02");
    const getReceitasNaoOp = () => calculateParentTotals("03");
    const getDespesasNaoOp = () => calculateParentTotals("04");
    const getDistribuicao = () => calculateParentTotals("05");

    // Calcular Geração de Caixa Operacional = Receitas Op - Despesas Op
    const calculateGCO = () => {
      const receitas = getReceitasOperacionais();
      const despesas = getDespesasOperacionais();
      const values: CashFlowRow["values"] = {};
      let totalRealized = 0;
      let totalProjected = 0;

      months.forEach((month) => {
        const realized = receitas.values[month].realized - despesas.values[month].realized;
        const projected = receitas.values[month].projected - despesas.values[month].projected;
        values[month] = { realized, projected };
        totalRealized += realized;
        totalProjected += projected;
      });

      return { values, total: { realized: totalRealized, projected: totalProjected } };
    };

    // Calcular Geração de Caixa do Período = GCO + Rec.Não Op - Desp.Não Op - Distribuição
    const calculateGCP = () => {
      const gco = calculateGCO();
      const receitasNaoOp = getReceitasNaoOp();
      const despesasNaoOp = getDespesasNaoOp();
      const distribuicao = getDistribuicao();
      const values: CashFlowRow["values"] = {};
      let totalRealized = 0;
      let totalProjected = 0;

      months.forEach((month) => {
        const realized = 
          gco.values[month].realized +
          receitasNaoOp.values[month].realized -
          despesasNaoOp.values[month].realized -
          distribuicao.values[month].realized;
        const projected = 
          gco.values[month].projected +
          receitasNaoOp.values[month].projected -
          despesasNaoOp.values[month].projected -
          distribuicao.values[month].projected;
        values[month] = { realized, projected };
        totalRealized += realized;
        totalProjected += projected;
      });

      return { values, total: { realized: totalRealized, projected: totalProjected } };
    };

    // Calcular Saldo Inicial e Saldo Final de forma encadeada
    // Janeiro: valor do banco (editável pelo usuário)
    // Fevereiro em diante: Saldo Final do mês anterior
    const calculateSaldosEncadeados = () => {
      const gcp = calculateGCP();
      const saldoInicialValues: CashFlowRow["values"] = {};
      const saldoFinalValues: CashFlowRow["values"] = {};
      
      // Buscar saldo inicial de Janeiro do banco
      const janeiroValue = getValue("00", months[0]);
      let runningRealized = janeiroValue.realized;
      let runningProjected = janeiroValue.projected;
      
      months.forEach((month, index) => {
        if (index === 0) {
          // Janeiro: usar valor do banco
          saldoInicialValues[month] = { realized: runningRealized, projected: runningProjected };
        } else {
          // Demais meses: Saldo Inicial = Saldo Final do mês anterior
          saldoInicialValues[month] = { 
            realized: saldoFinalValues[months[index - 1]].realized, 
            projected: saldoFinalValues[months[index - 1]].projected 
          };
          runningRealized = saldoInicialValues[month].realized;
          runningProjected = saldoInicialValues[month].projected;
        }
        
        // Saldo Final = Saldo Inicial + GCP do mês
        saldoFinalValues[month] = {
          realized: runningRealized + gcp.values[month].realized,
          projected: runningProjected + gcp.values[month].projected,
        };
        
        // Atualizar running para o próximo mês usar como Saldo Inicial
        runningRealized = saldoFinalValues[month].realized;
        runningProjected = saldoFinalValues[month].projected;
      });
      
      const lastMonth = months[months.length - 1];
      return {
        saldoInicial: { values: saldoInicialValues, total: { realized: 0, projected: 0 } },
        saldoFinal: { 
          values: saldoFinalValues, 
          total: { 
            realized: saldoFinalValues[lastMonth]?.realized || 0, 
            projected: saldoFinalValues[lastMonth]?.projected || 0 
          } 
        },
      };
    };
    
    const saldosEncadeados = calculateSaldosEncadeados();

    // Construir linhas
    const result: CashFlowRow[] = [];

    parents.forEach((parent) => {
      const children = childrenMap.get(parent.code) || [];
      
      // Linha do pai
      let parentValues: CashFlowRow["values"] = {};
      let parentTotal = { realized: 0, projected: 0 };

      if (parent.code === "00") {
        parentValues = saldosEncadeados.saldoInicial.values;
        parentTotal = saldosEncadeados.saldoInicial.total;
      } else if (parent.code === "GCO") {
        const data = calculateGCO();
        parentValues = data.values;
        parentTotal = data.total;
      } else if (parent.code === "GCP") {
        const data = calculateGCP();
        parentValues = data.values;
        parentTotal = data.total;
      } else if (parent.code === "SF") {
        parentValues = saldosEncadeados.saldoFinal.values;
        parentTotal = saldosEncadeados.saldoFinal.total;
      } else if (children.length > 0) {
        const data = calculateParentTotals(parent.code);
        parentValues = data.values;
        parentTotal = data.total;
      } else {
        // Categoria pai sem filhos (usar valor direto)
        months.forEach((month) => {
          const val = getValue(parent.code, month);
          parentValues[month] = val;
          parentTotal.realized += val.realized;
          parentTotal.projected += val.projected;
        });
      }

      const parentRow: CashFlowRow = {
        code: parent.code,
        name: parent.name,
        type: parent.type as CashFlowRow["type"],
        isParent: true,
        isCalculated: parent.is_calculated,
        level: 0,
        values: parentValues,
        total: parentTotal,
        children: [],
      };

      // Adicionar filhos
      children.forEach((child) => {
        const childValues: CashFlowRow["values"] = {};
        let childTotal = { realized: 0, projected: 0 };

        months.forEach((month) => {
          const val = getValue(child.code, month);
          childValues[month] = val;
          childTotal.realized += val.realized;
          childTotal.projected += val.projected;
        });

        parentRow.children!.push({
          code: child.code,
          name: child.name,
          type: child.type as CashFlowRow["type"],
          isParent: false,
          isCalculated: child.is_calculated,
          level: 1,
          values: childValues,
          total: childTotal,
        });
      });

      result.push(parentRow);
    });

    return result;
  }, [categories, flowData, months]);

  return {
    categories,
    flowData,
    rows,
    months,
    isLoading: isLoadingCategories || isLoadingData,
    upsertData: upsertData.mutate,
    isSaving: upsertData.isPending,
  };
};
