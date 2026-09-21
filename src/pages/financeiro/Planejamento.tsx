import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanningTable } from "@/components/finance/planning/PlanningTable";
import { BalanceCard } from "@/components/finance/planning/BalanceCard";
import { AIInsightsDialog } from "@/components/finance/planning/AIInsightsDialog";
import { useMonthlyPlanning } from "@/hooks/useMonthlyPlanning";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { useFinancialConfig } from "@/hooks/useFinancialConfig";
import { TrendingUp, Sparkles } from "lucide-react";
import { calculateTaxForMonth, getMonthType, MonthData } from "@/lib/taxCalculations";
import { parseISO, subMonths, format } from "date-fns";

const MONTHS = [
  { value: "all", label: "Todos os Meses" },
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const YEARS = ["2025", "2026", "2027", "2028"];

const Planejamento = () => {
  const { 
    financialYear: selectedYear, 
    setFinancialYear: setSelectedYear,
    financialMonth: selectedMonth,
    setFinancialMonth: setSelectedMonth
  } = useAppPreferences();
  const [insightsOpen, setInsightsOpen] = useState(false);
  const { planningData, isLoading, upsertPlanning } = useMonthlyPlanning();
  const { 
    hublaFeePercentage, 
    updateHublaFee, 
    isUpdating: isUpdatingHublaFee,
    saldoLivre,
    saldoRetido,
    updateSaldoLivre,
    updateSaldoRetido,
    isUpdatingSaldoLivre,
    isUpdatingSaldoRetido,
  } = useFinancialConfig();
  const { insights, isLoading: isLoadingInsights, error, generateInsights, clearInsights } = useAIInsights();

  // Gerar meses baseado no período selecionado
  const months = useMemo(() => {
    if (selectedMonth === "all") {
      // Retorna todos os meses do ano selecionado
      return Array.from({ length: 12 }, (_, i) => 
        `${selectedYear}-${String(i + 1).padStart(2, '0')}-01`
      );
    } else {
      // Retorna apenas o mês específico selecionado
      return [`${selectedYear}-${selectedMonth}-01`];
    }
  }, [selectedYear, selectedMonth]);

  // Construir string de período para o dialog
  const selectedPeriod = selectedMonth === "all" 
    ? selectedYear 
    : `${selectedYear}-${selectedMonth}`;

  const handleOpenInsights = () => {
    setInsightsOpen(true);
    generateInsights(planningData ?? null, selectedPeriod, months);
  };

  const handleRegenerate = () => {
    clearInsights();
    generateInsights(planningData ?? null, selectedPeriod, months);
  };

  // Preparar dados de meses para cálculo de impostos (inclui meses anteriores para trimestrais)
  const monthsDataForTax: MonthData[] = useMemo(() => {
    if (!planningData) return [];
    
    const allMonthsSet = new Set(months);
    
    // Adicionar até 3 meses anteriores para cálculos trimestrais
    if (months.length > 0) {
      const firstMonth = parseISO(months[0]);
      for (let i = 1; i <= 3; i++) {
        const prevMonth = format(subMonths(firstMonth, i), 'yyyy-MM-dd');
        allMonthsSet.add(prevMonth);
      }
    }
    
    return Array.from(allMonthsSet).map(monthStr => {
      const data = planningData.find(p => p.month === monthStr);
      return {
        month: monthStr,
        revenue: Number(data?.revenue) || 0,
        planned_revenue: Number(data?.planned_revenue) || 0,
        other_revenue: Number(data?.other_revenue) || 0,
        forecast_revenue: Number(data?.forecast_revenue) || 0,
      };
    });
  }, [months, planningData]);

  // Calcular totais do período
  const periodTotals = useMemo(() => {
    if (!planningData) return null;

    const monthsSet = new Set(months);
    const filteredData = planningData.filter(p => monthsSet.has(p.month));

    return filteredData.reduce((acc, p) => {
      const monthDate = parseISO(p.month);
      const monthType = getMonthType(monthDate);
      
      // Calcular receita total do mês
      const totalRevenue = (Number(p.revenue) || 0) + 
                           (Number(p.planned_revenue) || 0) + 
                           (Number(p.other_revenue) || 0) + 
                           (Number(p.forecast_revenue) || 0);
      
      // Para meses futuros, calcular imposto e taxa dinamicamente
      let tax: number;
      let platformFee: number;
      
      if (monthType === 'future') {
        const taxBreakdown = calculateTaxForMonth(monthDate, monthsDataForTax);
        tax = taxBreakdown.total;
        platformFee = totalRevenue * (hublaFeePercentage / 100);
      } else {
        tax = Number(p.tax) || 0;
        platformFee = Number(p.platform_fee) || 0;
      }

      return {
        revenue: acc.revenue + totalRevenue,
        expense: acc.expense + (Number(p.expense) || 0) + (Number(p.planned_expense) || 0) + (Number(p.other_expense) || 0) + (Number(p.forecast_expense) || 0),
        platformFee: acc.platformFee + platformFee,
        tax: acc.tax + tax,
        distribution: acc.distribution + (Number(p.distribution) || 0),
      };
    }, {
      revenue: 0,
      expense: 0,
      platformFee: 0,
      tax: 0,
      distribution: 0,
    });
  }, [planningData, months, monthsDataForTax, hublaFeePercentage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Planejamento
            </h1>
            <p className="text-muted-foreground">
              Planejamento financeiro mensal
            </p>
          </div>
          <Button
            onClick={handleOpenInsights}
            className="ml-4"
            variant="outline"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>

        {/* Seletor de Período */}
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      {periodTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Receitas Totais</div>
            <div className="text-lg font-bold text-green-500">
              {formatCurrency(periodTotals.revenue)}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Despesas Totais</div>
            <div className="text-lg font-bold text-red-500">
              {formatCurrency(periodTotals.expense + periodTotals.platformFee + periodTotals.tax)}
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Resultado Líquido</div>
            <div className={`text-lg font-bold ${
              periodTotals.revenue - periodTotals.expense - periodTotals.platformFee - periodTotals.tax - periodTotals.distribution >= 0 
                ? 'text-violet-500' 
                : 'text-red-500'
            }`}>
              {formatCurrency(periodTotals.revenue - periodTotals.expense - periodTotals.platformFee - periodTotals.tax - periodTotals.distribution)}
            </div>
          </div>
        </div>
      )}

      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceCard
          label="Saldo Livre"
          value={saldoLivre}
          colorClass="text-blue-500"
          editable
          onSave={updateSaldoLivre}
          isLoading={isUpdatingSaldoLivre}
        />
        <BalanceCard
          label="Saldo Retido"
          value={saldoRetido}
          colorClass="text-amber-500"
          editable
          onSave={updateSaldoRetido}
          isLoading={isUpdatingSaldoRetido}
        />
        <BalanceCard
          label="Saldo Total"
          value={saldoLivre + saldoRetido}
          colorClass="text-cyan-500"
          editable={false}
        />
      </div>

      {/* Tabela Principal */}
      <PlanningTable
        months={months}
        planningData={planningData}
        isLoading={isLoading}
        onUpsert={upsertPlanning}
        hublaFeePercentage={hublaFeePercentage}
        onHublaFeeChange={updateHublaFee}
        isUpdatingHublaFee={isUpdatingHublaFee}
      />

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>real - Dados realizados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>atual - Mês corrente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30" />
          <span>prev - Previsão (impostos e distribuição calculados)</span>
        </div>
      </div>

      {/* AI Insights Dialog */}
      <AIInsightsDialog
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        insights={insights}
        isLoading={isLoadingInsights}
        error={error}
        onRegenerate={handleRegenerate}
        selectedPeriod={selectedPeriod}
      />
    </div>
  );
};

export default Planejamento;
