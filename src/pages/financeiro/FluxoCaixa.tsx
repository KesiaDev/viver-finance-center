import { useState } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnderConstructionBanner } from "@/components/ui/under-construction-banner";
import { CashFlowFilters } from "@/components/finance/cash-flow/CashFlowFilters";
import { CashFlowTable } from "@/components/finance/cash-flow/CashFlowTable";
import { CashFlowDetailedTable } from "@/components/finance/cash-flow/CashFlowDetailedTable";
import { CashFlowExportButton } from "@/components/finance/cash-flow/CashFlowExportButton";
import { MarveeSyncButton } from "@/components/finance/cash-flow/MarveeSyncButton";
import { MarveeMappingDialog } from "@/components/finance/cash-flow/MarveeMappingDialog";
import { useCashFlowData } from "@/hooks/useCashFlowData";
import { useCashFlowDataDetailed } from "@/hooks/useCashFlowDataDetailed";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

const FluxoCaixa = () => {
  const {
    financialYear,
    setFinancialYear,
    cashFlowPresentation: presentation,
    setCashFlowPresentation: setPresentation,
    cashFlowStatusFilter: statusFilter,
    setCashFlowStatusFilter: setStatusFilter,
    cashFlowShowPercentage: showPercentage,
    setCashFlowShowPercentage: setShowPercentage,
  } = useAppPreferences();

  const year = parseInt(financialYear);
  const setYear = (y: number) => setFinancialYear(y.toString());
  
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("aggregated");

  const { rows, months, isLoading, upsertData } = useCashFlowData(year);
  const { 
    rows: detailedRows, 
    months: detailedMonths, 
    isLoading: isLoadingDetailed 
  } = useCashFlowDataDetailed(year);

  const handleCellEdit = (
    code: string,
    month: string,
    value: number,
    type: "realized" | "projected"
  ) => {
    upsertData({
      month,
      category_code: code,
      [type === "realized" ? "realized_value" : "projected_value"]: value,
    });
  };

  return (
    <div className="space-y-6">
        <UnderConstructionBanner />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
              <p className="text-sm text-muted-foreground">
                Visão detalhada do fluxo de caixa por categoria
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <MarveeSyncButton 
              year={year} 
              onOpenMappings={() => setShowMappingDialog(true)} 
            />
            <CashFlowExportButton
              rows={rows}
              months={months}
              year={year}
              statusFilter={statusFilter}
            />
          </div>
        </div>

        <MarveeMappingDialog 
          open={showMappingDialog} 
          onOpenChange={setShowMappingDialog} 
        />

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <CashFlowFilters
              presentation={presentation}
              onPresentationChange={setPresentation}
              showPercentage={showPercentage}
              onShowPercentageChange={setShowPercentage}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              year={year}
              onYearChange={setYear}
            />
          </CardContent>
        </Card>

        {/* Tabs for Aggregated vs Detailed view */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="aggregated">Visão Agregada</TabsTrigger>
            <TabsTrigger value="detailed">Visão Detalhada (3 níveis)</TabsTrigger>
          </TabsList>

          <TabsContent value="aggregated" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Demonstrativo de Fluxo de Caixa</CardTitle>
                <CardDescription>
                  {statusFilter === "realized" && "Valores realizados"}
                  {statusFilter === "projected" && "Valores previstos"}
                  {statusFilter === "both" && "Comparativo Realizado (R) vs Previsto (P)"}
                  {" - "}Ano {year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CashFlowTable
                  rows={rows}
                  months={months}
                  isLoading={isLoading}
                  statusFilter={statusFilter}
                  showPercentage={showPercentage}
                  presentation={presentation}
                  onCellEdit={handleCellEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fluxo de Caixa Detalhado (3 Níveis)</CardTitle>
                <CardDescription>
                  Dados sincronizados do Marvee com hierarquia completa de categorias
                  {" - "}Ano {year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CashFlowDetailedTable
                  rows={detailedRows}
                  months={detailedMonths}
                  isLoading={isLoadingDetailed}
                  statusFilter={statusFilter}
                  showPercentage={showPercentage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default FluxoCaixa;
