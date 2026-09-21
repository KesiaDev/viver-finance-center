import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export type StatusFilter = "realized" | "projected" | "both";

export interface DetailedCashFlowRow {
  code: string;
  name: string;
  type: "revenue" | "expense" | "balance" | "result";
  level: 0 | 1 | 2; // 0=parent, 1=child, 2=grandchild
  isCalculated: boolean;
  values: { [month: string]: { realized: number; projected: number } };
  total: { realized: number; projected: number };
  children?: DetailedCashFlowRow[];
}

interface ViewRecord {
  month: string;
  category_structure: string;
  category_description: string | null;
  source_type: string;
  total_value: number;
  transaction_count: number;
}

interface CategoryRecord {
  code: string;
  name: string;
  type: string;
  parent_code: string | null;
}

export function useCashFlowDataDetailed(year: number) {
  // Fetch aggregated data from the view (much fewer records!)
  const { data: viewData, isLoading: isLoadingView } = useQuery({
    queryKey: ["cash-flow-detailed-view", year],
    queryFn: async () => {
      const startMonth = `${year}-01`;
      const endMonth = `${year}-12`;

      const { data, error } = await supabase
        .from("cash_flow_detailed_view")
        .select("*")
        .gte("month", startMonth)
        .lte("month", endMonth)
        .order("category_structure");

      if (error) throw error;
      return data as ViewRecord[];
    },
  });

  // Fetch categories for level 1 and 2 names
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["cash-flow-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_flow_categories")
        .select("code, name, type, parent_code")
        .order("sort_order");

      if (error) throw error;
      return data as CategoryRecord[];
    },
  });

  // Generate months array
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, "0");
      return `${year}-${month}`;
    });
  }, [year]);

  // Build hierarchical rows from aggregated view data
  const rows = useMemo(() => {
    if (!viewData || !categories) return [];

    // Create category name lookup
    const categoryNames: Record<string, string> = {};
    categories.forEach((cat) => {
      categoryNames[cat.code] = cat.name;
    });

    // Group data by structure - already aggregated by month!
    const dataByStructure: Record<string, ViewRecord[]> = {};
    viewData.forEach((record) => {
      const structure = record.category_structure;
      if (!dataByStructure[structure]) {
        dataByStructure[structure] = [];
      }
      dataByStructure[structure].push(record);
    });

    // Extract unique structures and organize by levels
    const structures = Object.keys(dataByStructure).sort();

    // Build hierarchy maps
    const level1Map: Record<
      string,
      {
        name: string;
        type: string;
        level2: Record<
          string,
          {
            name: string;
            level3: string[];
          }
        >;
      }
    > = {};

    structures.forEach((structure) => {
      const parts = structure.split(".");
      if (parts.length < 3) return;

      const level1Code = parts[0];
      const level2Code = `${parts[0]}.${parts[1]}`;
      const level3Code = structure;

      // Get source type from first record
      const sourceType = dataByStructure[structure][0]?.source_type || "despesa";
      const type = sourceType === "receita" ? "revenue" : "expense";

      if (!level1Map[level1Code]) {
        level1Map[level1Code] = {
          name: categoryNames[level1Code] || `Categoria ${level1Code}`,
          type,
          level2: {},
        };
      }

      if (!level1Map[level1Code].level2[level2Code]) {
        level1Map[level1Code].level2[level2Code] = {
          name: categoryNames[level2Code] || `Subcategoria ${level2Code}`,
          level3: [],
        };
      }

      if (!level1Map[level1Code].level2[level2Code].level3.includes(level3Code)) {
        level1Map[level1Code].level2[level2Code].level3.push(level3Code);
      }
    });

    // Helper to calculate values for a structure (now using pre-aggregated total_value!)
    const getValues = (structure: string) => {
      const records = dataByStructure[structure] || [];
      const values: Record<string, { realized: number; projected: number }> = {};
      let totalRealized = 0;
      let totalProjected = 0;

      months.forEach((month) => {
        values[month] = { realized: 0, projected: 0 };
      });

      records.forEach((record) => {
        if (values[record.month]) {
          // Use the pre-aggregated total_value from the view
          values[record.month].realized += record.total_value || 0;
          totalRealized += record.total_value || 0;
        }
      });

      return { values, total: { realized: totalRealized, projected: totalProjected } };
    };

    // Build rows
    const result: DetailedCashFlowRow[] = [];

    // Sort level 1 codes
    const level1Codes = Object.keys(level1Map).sort();

    level1Codes.forEach((level1Code) => {
      const level1Data = level1Map[level1Code];
      const level1Children: DetailedCashFlowRow[] = [];

      // Initialize level 1 totals
      const level1Values: Record<string, { realized: number; projected: number }> = {};
      months.forEach((month) => {
        level1Values[month] = { realized: 0, projected: 0 };
      });
      let level1TotalRealized = 0;
      let level1TotalProjected = 0;

      // Sort level 2 codes
      const level2Codes = Object.keys(level1Data.level2).sort();

      level2Codes.forEach((level2Code) => {
        const level2Data = level1Data.level2[level2Code];
        const level2Children: DetailedCashFlowRow[] = [];

        // Initialize level 2 totals
        const level2Values: Record<string, { realized: number; projected: number }> = {};
        months.forEach((month) => {
          level2Values[month] = { realized: 0, projected: 0 };
        });
        let level2TotalRealized = 0;
        let level2TotalProjected = 0;

        // Sort level 3 codes
        const level3Codes = level2Data.level3.sort();

        level3Codes.forEach((level3Code) => {
          const { values, total } = getValues(level3Code);
          const description =
            dataByStructure[level3Code]?.[0]?.category_description || level3Code;

          // Add to level 2 totals
          months.forEach((month) => {
            level2Values[month].realized += values[month].realized;
            level2Values[month].projected += values[month].projected;
          });
          level2TotalRealized += total.realized;
          level2TotalProjected += total.projected;

          level2Children.push({
            code: level3Code,
            name: description,
            type: level1Data.type as "revenue" | "expense",
            level: 2,
            isCalculated: false,
            values,
            total,
          });
        });

        // Add to level 1 totals
        months.forEach((month) => {
          level1Values[month].realized += level2Values[month].realized;
          level1Values[month].projected += level2Values[month].projected;
        });
        level1TotalRealized += level2TotalRealized;
        level1TotalProjected += level2TotalProjected;

        level1Children.push({
          code: level2Code,
          name: level2Data.name,
          type: level1Data.type as "revenue" | "expense",
          level: 1,
          isCalculated: true,
          values: level2Values,
          total: { realized: level2TotalRealized, projected: level2TotalProjected },
          children: level2Children,
        });
      });

      result.push({
        code: level1Code,
        name: level1Data.name,
        type: level1Data.type as "revenue" | "expense",
        level: 0,
        isCalculated: true,
        values: level1Values,
        total: { realized: level1TotalRealized, projected: level1TotalProjected },
        children: level1Children,
      });
    });

    // Calculate summary rows
    const revenueRows = result.filter((r) => r.type === "revenue");
    const expenseRows = result.filter((r) => r.type === "expense");

    // Total Receitas
    const totalRevenueValues: Record<string, { realized: number; projected: number }> = {};
    months.forEach((month) => {
      totalRevenueValues[month] = { realized: 0, projected: 0 };
    });
    let totalRevRealized = 0;
    let totalRevProjected = 0;

    revenueRows.forEach((row) => {
      months.forEach((month) => {
        totalRevenueValues[month].realized += row.values[month]?.realized || 0;
        totalRevenueValues[month].projected += row.values[month]?.projected || 0;
      });
      totalRevRealized += row.total.realized;
      totalRevProjected += row.total.projected;
    });

    // Total Despesas
    const totalExpenseValues: Record<string, { realized: number; projected: number }> = {};
    months.forEach((month) => {
      totalExpenseValues[month] = { realized: 0, projected: 0 };
    });
    let totalExpRealized = 0;
    let totalExpProjected = 0;

    expenseRows.forEach((row) => {
      months.forEach((month) => {
        totalExpenseValues[month].realized += row.values[month]?.realized || 0;
        totalExpenseValues[month].projected += row.values[month]?.projected || 0;
      });
      totalExpRealized += row.total.realized;
      totalExpProjected += row.total.projected;
    });

    // GCO (Resultado Operacional)
    const gcoValues: Record<string, { realized: number; projected: number }> = {};
    months.forEach((month) => {
      gcoValues[month] = {
        realized: totalRevenueValues[month].realized - totalExpenseValues[month].realized,
        projected: totalRevenueValues[month].projected - totalExpenseValues[month].projected,
      };
    });

    // Build final structure
    const finalRows: DetailedCashFlowRow[] = [
      ...revenueRows,
      {
        code: "TOTAL_RECEITAS",
        name: "Total Receitas",
        type: "revenue",
        level: 0,
        isCalculated: true,
        values: totalRevenueValues,
        total: { realized: totalRevRealized, projected: totalRevProjected },
      },
      ...expenseRows,
      {
        code: "TOTAL_DESPESAS",
        name: "Total Despesas",
        type: "expense",
        level: 0,
        isCalculated: true,
        values: totalExpenseValues,
        total: { realized: totalExpRealized, projected: totalExpProjected },
      },
      {
        code: "GCO",
        name: "Resultado Operacional (GCO)",
        type: "result",
        level: 0,
        isCalculated: true,
        values: gcoValues,
        total: {
          realized: totalRevRealized - totalExpRealized,
          projected: totalRevProjected - totalExpProjected,
        },
      },
    ];

    return finalRows;
  }, [viewData, categories, months]);

  return {
    rows,
    months,
    isLoading: isLoadingView || isLoadingCategories,
  };
}
