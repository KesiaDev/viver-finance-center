import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabVisaoGeral } from "@/components/finance/parcelamento/TabVisaoGeral";
import { TabInadimplencia } from "@/components/finance/parcelamento/TabInadimplencia";
import { TabCancelamentos } from "@/components/finance/parcelamento/TabCancelamentos";
import { TabDevedores } from "@/components/finance/parcelamento/TabDevedores";
import { TabInsights } from "@/components/finance/parcelamento/TabInsights";
import { ParcelamentoProvider, useParcelamentoContext } from "@/components/finance/parcelamento/ParcelamentoContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLegacyIntegrations } from "@/hooks/useLegacyIntegrations";
import { LegacyDataSourceNotice } from "@/components/finance/legacy/LegacyDataSourceNotice";

function SyncButton() {
  const { sync, isSyncing, lastSyncedAt, hasData } = useParcelamentoContext();

  return (
    <div className="flex items-center gap-3">
      {lastSyncedAt && lastSyncedAt.getTime() > 0 && (
        <span className="text-xs text-slate-500">
          Última sync: {lastSyncedAt.toLocaleString("pt-BR")}
        </span>
      )}
      {!hasData && (
        <span className="text-xs text-amber-400">⚠️ Usando dados estáticos</span>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => sync()}
        disabled={isSyncing}
        className="gap-2"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Sincronizando..." : "Sincronizar"}
      </Button>
    </div>
  );
}

export default function ParcelamentoInteligente() {
  const { legacyIntegrationsEnabled } = useLegacyIntegrations();

  return (
    <ParcelamentoProvider>
      <div className="space-y-6">
        {!legacyIntegrationsEnabled && <LegacyDataSourceNotice />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Parcelamento Inteligente</h1>
            <p className="text-slate-400 text-sm mt-1">
              Dashboard analítico de pagamentos recorrentes
            </p>
          </div>
          <SyncButton />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="visao-geral" className="w-full">
          <TabsList className="bg-[#111827] border border-[#1e293b] p-1 rounded-lg flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="visao-geral" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white rounded-md text-slate-400 text-sm px-4 py-2">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="inadimplencia" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white rounded-md text-slate-400 text-sm px-4 py-2">
              Inadimplência
            </TabsTrigger>
            <TabsTrigger value="cancelamentos" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white rounded-md text-slate-400 text-sm px-4 py-2">
              Cancelamentos
            </TabsTrigger>
            <TabsTrigger value="devedores" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white rounded-md text-slate-400 text-sm px-4 py-2">
              Devedores
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-white rounded-md text-slate-400 text-sm px-4 py-2">
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral"><TabVisaoGeral /></TabsContent>
          <TabsContent value="inadimplencia"><TabInadimplencia /></TabsContent>
          <TabsContent value="cancelamentos"><TabCancelamentos /></TabsContent>
          <TabsContent value="devedores"><TabDevedores /></TabsContent>
          <TabsContent value="insights"><TabInsights /></TabsContent>
        </Tabs>
      </div>
    </ParcelamentoProvider>
  );
}
