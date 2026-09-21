import type { Database } from '@/integrations/supabase/types';

// ========== Enums (aliases do banco) ==========
export type TransactionType = Database['public']['Enums']['transaction_type'];
export type GoalType = Database['public']['Enums']['goal_type'];
export type TaxRegime = Database['public']['Enums']['tax_regime'];
export type PeriodStatus = Database['public']['Enums']['period_status'];

// ========== Tipos base das tabelas ==========
export type FinancialPeriod = Database['public']['Tables']['financial_periods']['Row'];
export type TransactionCategory = Database['public']['Tables']['transaction_categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type TaxRule = Database['public']['Tables']['tax_rules']['Row'];
export type Scenario = Database['public']['Tables']['scenarios']['Row'];
export type MonthlyPlanning = Database['public']['Tables']['monthly_planning']['Row'];
export type SalesTarget = Database['public']['Tables']['sales_targets']['Row'];
export type SalesTargetMonthly = Database['public']['Tables']['sales_target_monthly']['Row'];
export type MonthlyTarget = Database['public']['Tables']['monthly_targets']['Row'];

// ========== Tipos para Insert ==========
export type FinancialPeriodInsert = Database['public']['Tables']['financial_periods']['Insert'];
export type TransactionCategoryInsert = Database['public']['Tables']['transaction_categories']['Insert'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type TaxRuleInsert = Database['public']['Tables']['tax_rules']['Insert'];
export type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert'];
export type MonthlyPlanningInsert = Database['public']['Tables']['monthly_planning']['Insert'];
export type SalesTargetInsert = Database['public']['Tables']['sales_targets']['Insert'];
export type SalesTargetMonthlyInsert = Database['public']['Tables']['sales_target_monthly']['Insert'];
export type MonthlyTargetInsert = Database['public']['Tables']['monthly_targets']['Insert'];

// ========== Tipos para Update ==========
export type FinancialPeriodUpdate = Database['public']['Tables']['financial_periods']['Update'];
export type TransactionCategoryUpdate = Database['public']['Tables']['transaction_categories']['Update'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];
export type TaxRuleUpdate = Database['public']['Tables']['tax_rules']['Update'];
export type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update'];
export type MonthlyPlanningUpdate = Database['public']['Tables']['monthly_planning']['Update'];
export type SalesTargetUpdate = Database['public']['Tables']['sales_targets']['Update'];
export type SalesTargetMonthlyUpdate = Database['public']['Tables']['sales_target_monthly']['Update'];
export type MonthlyTargetUpdate = Database['public']['Tables']['monthly_targets']['Update'];

// ========== Tipos expandidos (com relacionamentos) ==========
export interface TransactionWithCategory extends Transaction {
  category?: TransactionCategory | null;
}

export interface GoalWithPeriod extends Goal {
  period?: FinancialPeriod | null;
}

export interface ScenarioWithPeriod extends Scenario {
  period?: FinancialPeriod | null;
}

export interface SalesTargetWithMonthly extends SalesTarget {
  monthly_data?: SalesTargetMonthly[];
}

// ========== Tipos calculados/auxiliares ==========
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalTaxes: number;
  netMargin: number;
  netMarginPercentage: number;
  cashBalance: number;
}

export interface MonthlyFinancialData {
  month: string;
  revenue: number;
  expenses: number;
  taxes: number;
  netMargin: number;
}

export interface GoalProgress {
  goal: Goal;
  percentage: number;
  remaining: number;
}

// ========== Constantes úteis ==========
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  revenue: 'Receita',
  expense: 'Despesa',
  tax: 'Imposto',
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  sales_volume: 'Volume de Vendas',
  sales_value: 'Valor de Vendas',
  net_margin_percentage: 'Margem Líquida (%)',
};

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

export const PERIOD_STATUS_LABELS: Record<PeriodStatus, string> = {
  open: 'Aberto',
  closed: 'Fechado',
};
