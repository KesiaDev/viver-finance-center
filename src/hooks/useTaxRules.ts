import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  TaxRule, 
  TaxRuleInsert, 
  TaxRuleUpdate,
  TaxRegime
} from "@/types/financial";
import { TAX_CONFIG } from "@/lib/taxCalculations";

interface UseTaxRulesOptions {
  activeOnly?: boolean;
  regime?: TaxRegime;
}

export interface MonthlyTaxCalculation {
  pis: number;
  cofins: number;
  iss: number;
  total: number;
}

export interface QuarterlyTaxCalculation {
  presumedBase: number;
  irpj: number;
  irpjAdditional: number;
  csll: number;
  total: number;
}

export const useTaxRules = (options: UseTaxRulesOptions = {}) => {
  const queryClient = useQueryClient();
  const { activeOnly = false, regime } = options;

  const { data: taxRules, isLoading } = useQuery({
    queryKey: ["tax-rules", activeOnly, regime],
    queryFn: async () => {
      let query = supabase
        .from("tax_rules")
        .select("*")
        .order("min_revenue", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      if (regime) {
        query = query.eq("regime", regime);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaxRule[];
    },
  });

  const createTaxRule = useMutation({
    mutationFn: async (rule: TaxRuleInsert) => {
      const { data, error } = await supabase
        .from("tax_rules")
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rules"] });
      toast.success("Regra tributária criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar regra: " + error.message);
    },
  });

  const updateTaxRule = useMutation({
    mutationFn: async ({ id, ...updates }: TaxRuleUpdate & { id: string }) => {
      const { error } = await supabase
        .from("tax_rules")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rules"] });
      toast.success("Regra tributária atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar regra: " + error.message);
    },
  });

  const deleteTaxRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tax_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-rules"] });
      toast.success("Regra tributária excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir regra: " + error.message);
    },
  });

  // Encontrar regra aplicável baseada na receita
  const findApplicableRule = (revenue: number, targetRegime?: TaxRegime) => {
    const applicableRules = taxRules?.filter(rule => {
      if (!rule.is_active) return false;
      if (targetRegime && rule.regime !== targetRegime) return false;
      if (revenue < (Number(rule.min_revenue) || 0)) return false;
      if (rule.max_revenue && revenue > Number(rule.max_revenue)) return false;
      return true;
    });
    return applicableRules?.[0];
  };

  // Calcular imposto baseado na receita (legado)
  const calculateTax = (revenue: number, targetRegime?: TaxRegime) => {
    const rule = findApplicableRule(revenue, targetRegime);
    if (!rule) return 0;
    return revenue * (Number(rule.aliquot_percentage) / 100);
  };

  // Calcular impostos mensais (PIS, COFINS, ISS)
  const calculateMonthlyTaxes = (previousMonthRevenue: number): MonthlyTaxCalculation => {
    const pis = previousMonthRevenue * TAX_CONFIG.monthly.pis;
    const cofins = previousMonthRevenue * TAX_CONFIG.monthly.cofins;
    const iss = previousMonthRevenue * TAX_CONFIG.monthly.iss;
    
    return {
      pis,
      cofins,
      iss,
      total: pis + cofins + iss,
    };
  };

  // Calcular impostos trimestrais (IRPJ, CSLL)
  const calculateQuarterlyTaxes = (quarterlyRevenue: number): QuarterlyTaxCalculation => {
    const presumedBase = quarterlyRevenue * TAX_CONFIG.presumption_rate;
    const irpj = presumedBase * TAX_CONFIG.quarterly.irpj;
    
    // IRPJ Adicional: 10% sobre excedente de R$ 60.000/trimestre (R$ 20.000 × 3 meses)
    const limiteTrimestrall = TAX_CONFIG.quarterly.irpj_threshold * 3;
    const irpjAdditional = presumedBase > limiteTrimestrall 
      ? (presumedBase - limiteTrimestrall) * TAX_CONFIG.quarterly.irpj_additional 
      : 0;
    
    const csll = presumedBase * TAX_CONFIG.quarterly.csll;
    
    return {
      presumedBase,
      irpj,
      irpjAdditional,
      csll,
      total: irpj + irpjAdditional + csll,
    };
  };

  // Verifica se é um mês de pagamento trimestral (Jan, Abr, Jul, Out)
  const isQuarterlyPaymentMonth = (month: number): boolean => {
    return [1, 4, 7, 10].includes(month);
  };

  // Verifica se está no regime Lucro Presumido
  const isLucroPresumido = (year: number, month: number): boolean => {
    if (year < TAX_CONFIG.regime_change.cutoff_year) return false;
    if (year > TAX_CONFIG.regime_change.cutoff_year) return true;
    return month > TAX_CONFIG.regime_change.cutoff_month;
  };

  // Calcular impostos mensais com verificação de regime
  const calculateMonthlyTaxesWithRegime = (
    previousMonthRevenue: number, 
    year: number, 
    month: number
  ): MonthlyTaxCalculation => {
    if (!isLucroPresumido(year, month)) {
      // Simples Nacional - usa regra da tabela tax_rules
      const rule = findApplicableRule(previousMonthRevenue, 'simples_nacional');
      if (rule) {
        const total = previousMonthRevenue * (Number(rule.aliquot_percentage) / 100);
        return { pis: 0, cofins: 0, iss: 0, total };
      }
      return { pis: 0, cofins: 0, iss: 0, total: 0 };
    }
    return calculateMonthlyTaxes(previousMonthRevenue);
  };

  // Calcular imposto total do mês
  const calculateTotalTax = (
    currentMonthRevenue: number,
    previousMonthRevenue: number,
    quarterlyAccumulatedRevenue: number,
    month: number
  ): number => {
    const monthlyTaxes = calculateMonthlyTaxes(previousMonthRevenue);
    let totalTax = monthlyTaxes.total;
    
    if (isQuarterlyPaymentMonth(month)) {
      const quarterlyTaxes = calculateQuarterlyTaxes(quarterlyAccumulatedRevenue);
      totalTax += quarterlyTaxes.total;
    }
    
    return totalTax;
  };

  return {
    taxRules,
    isLoading,
    findApplicableRule,
    calculateTax,
    calculateMonthlyTaxes,
    calculateMonthlyTaxesWithRegime,
    calculateQuarterlyTaxes,
    calculateTotalTax,
    isQuarterlyPaymentMonth,
    isLucroPresumido,
    TAX_CONFIG,
    createTaxRule: createTaxRule.mutate,
    updateTaxRule: updateTaxRule.mutate,
    deleteTaxRule: deleteTaxRule.mutate,
    isCreating: createTaxRule.isPending,
    isUpdating: updateTaxRule.isPending,
    isDeleting: deleteTaxRule.isPending,
  };
};
