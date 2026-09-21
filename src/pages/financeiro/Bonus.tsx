import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Users, DollarSign, TrendingUp } from "lucide-react";
import { useBonusCalculator, DIRECTOR_BONUSES, ML_TARGET, getBonusPercentage } from "@/hooks/useBonusCalculator";
import type { QuarterBonusData } from "@/hooks/useBonusCalculator";
import { useDirectorBonusConfig } from "@/hooks/useDirectorBonusConfig";
import QuarterlyMLCard from "@/components/finance/bonus/QuarterlyMLCard";
import BonusTable from "@/components/finance/bonus/BonusTable";

import { formatCurrency } from "@/lib/taxCalculations";
import { Skeleton } from "@/components/ui/skeleton";

const Bonus = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { canEditFinance } = useAuth();

  const { quarterlyData, directorsData, summary, isLoading } =
    useBonusCalculator(selectedYear);
  
  const { 
    configs: customConfigs, 
    updateConfig, 
    resetConfig, 
    isUpdating,
    getCustomConfig 
  } = useDirectorBonusConfig(selectedYear);

  // Função para recalcular bônus de um quarter com novo base (usando faixas)
  const recalculateQuarterBonus = (original: QuarterBonusData, newQuarterlyBase: number): QuarterBonusData => {
    // Usar faixas: <80% = 0%, 80-89% = 25%, 90-99% = 50%, >=100% = 100% (teto)
    const bonusPercentage = getBonusPercentage(original.ml);
    const bonusPercentageForecast = getBonusPercentage(original.mlForecast);
    
    return {
      ...original,
      bonus: Math.round(newQuarterlyBase * bonusPercentage * 100) / 100,
      bonusForecast: Math.round(newQuarterlyBase * bonusPercentageForecast * 100) / 100,
    };
  };

  // Mesclar dados com configurações customizadas
  // Base Anual é sempre calculada como Trimestral × 4
  // Recalcula quarters e totais quando há config customizada
  const directorsWithCustomBase = directorsData.map(director => {
    const customConfig = getCustomConfig(director.directorId);
    if (customConfig) {
      const quarterlyBase = customConfig.quarterly_base;
      const annualBase = quarterlyBase * 4;
      
      // Recalcular bônus de cada quarter com o novo base
      const quarters = {
        q1: recalculateQuarterBonus(director.quarters.q1, quarterlyBase),
        q2: recalculateQuarterBonus(director.quarters.q2, quarterlyBase),
        q3: recalculateQuarterBonus(director.quarters.q3, quarterlyBase),
        q4: recalculateQuarterBonus(director.quarters.q4, quarterlyBase),
      };
      
      // Recalcular totais
      const totalPaid = quarters.q1.bonus + quarters.q2.bonus + 
                        quarters.q3.bonus + quarters.q4.bonus;
      const totalPaidForecast = quarters.q1.bonusForecast + quarters.q2.bonusForecast + 
                                 quarters.q3.bonusForecast + quarters.q4.bonusForecast;
      
      // Recalcular retroativo
      const retroactive = summary.annualML >= ML_TARGET 
        ? Math.max(0, annualBase - totalPaid) 
        : 0;
      const retroactiveForecast = summary.annualMLForecast >= ML_TARGET 
        ? Math.max(0, annualBase - totalPaidForecast) 
        : 0;
      
      return {
        ...director,
        quarterlyBase,
        annualBase,
        quarters,
        totalPaid,
        totalPaidForecast,
        retroactive,
        retroactiveForecast,
      };
    }
    return director;
  });

  // Recalcular summary com bases customizadas e totais recalculados
  const customSummary = {
    ...summary,
    totalQuarterlyBase: directorsWithCustomBase.reduce((sum, d) => sum + d.quarterlyBase, 0),
    totalAnnualBase: directorsWithCustomBase.reduce((sum, d) => sum + d.annualBase, 0),
    totalPaid: directorsWithCustomBase.reduce((sum, d) => sum + d.totalPaid, 0),
    totalPaidForecast: directorsWithCustomBase.reduce((sum, d) => sum + d.totalPaidForecast, 0),
    totalRetroactive: directorsWithCustomBase.reduce((sum, d) => sum + d.retroactive, 0),
    totalRetroactiveForecast: directorsWithCustomBase.reduce((sum, d) => sum + d.retroactiveForecast, 0),
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Calculadora de Bônus dos Diretores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bônus proporcional à Margem Líquida trimestral • Meta base: {ML_TARGET}%
          </p>
        </div>

        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diretores</p>
                <p className="text-2xl font-bold">{DIRECTOR_BONUSES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(summary.totalPaid)}
                </p>
                {summary.totalPaidForecast > summary.totalPaid && (
                  <p className="text-xs text-primary font-medium">
                    Prev: {formatCurrency(summary.totalPaidForecast)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ML Anual</p>
                <p className="text-xl font-bold">{summary.annualML.toFixed(1)}%</p>
                {summary.annualMLForecast !== summary.annualML && (
                  <p className="text-xs text-primary font-medium">
                    Prev: {summary.annualMLForecast.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan/10">
                <Award className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retroativo</p>
                <p
                  className={`text-xl font-bold ${
                    summary.isRetroactiveEligible ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {summary.isRetroactiveEligible
                    ? formatCurrency(summary.totalRetroactive)
                    : "--"}
                </p>
                {summary.isRetroactiveEligibleForecast && !summary.isRetroactiveEligible && (
                  <p className="text-xs text-primary font-medium">
                    Prev: {formatCurrency(summary.totalRetroactiveForecast)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-primary font-medium">Total Previsto</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(summary.totalPaidForecast + (summary.isRetroactiveEligibleForecast ? summary.totalRetroactiveForecast : 0))}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  incluindo retroativo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly ML Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Margem Líquida por Trimestre</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {quarterlyData.map((quarter) => (
            <QuarterlyMLCard
              key={quarter.quarter}
              quarter={quarter}
              mlTarget={ML_TARGET}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bônus por Diretor</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusTable
            directors={directorsWithCustomBase}
            summary={customSummary}
            mlTarget={ML_TARGET}
            defaultBonuses={DIRECTOR_BONUSES}
            onUpdateBase={(directorId, quarterlyBase, annualBase) => 
              updateConfig({ directorId, quarterlyBase, annualBase })
            }
            onResetBase={resetConfig}
            isUpdating={isUpdating}
            canEdit={canEditFinance}
          />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-4 w-full">
              <p className="text-sm font-medium">Como funciona o cálculo</p>
              
              {/* Tabela de Faixas */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">% da Meta</th>
                      <th className="text-left py-2 font-medium">ML Correspondente</th>
                      <th className="text-left py-2 font-medium">Bônus Pago</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-dashed">
                      <td className="py-1.5">&lt; 80%</td>
                      <td className="py-1.5">ML &lt; 24%</td>
                      <td className="py-1.5 text-destructive font-medium">Sem bônus</td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-1.5">80% - 89%</td>
                      <td className="py-1.5">ML 24% - 26.9%</td>
                      <td className="py-1.5 text-amber-500 font-medium">25% da base</td>
                    </tr>
                    <tr className="border-b border-dashed">
                      <td className="py-1.5">90% - 99%</td>
                      <td className="py-1.5">ML 27% - 29.9%</td>
                      <td className="py-1.5 text-yellow-500 font-medium">50% da base</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">≥ 100%</td>
                      <td className="py-1.5">ML ≥ 30%</td>
                      <td className="py-1.5 text-success font-medium">100% da base (teto)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Regras Adicionais */}
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Teto Máximo</p>
                  <p className="text-xs text-muted-foreground">
                    O bônus trimestral é limitado a 100% da base, mesmo que o ML ultrapasse 30%.
                  </p>
                </div>
                <div className="p-2 rounded bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-primary">Retroativo Anual</p>
                  <p className="text-xs text-muted-foreground">
                    Se a ML anual atingir ≥ 30%, a diferença entre o bônus integral e o já pago é paga ao final do ano.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bonus;
