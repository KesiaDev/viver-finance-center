import { RefreshCw, Settings, Clock, Database, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMarveeSync } from "@/hooks/useMarveeSync";

interface MarveeSyncButtonProps {
  year: number;
  onOpenMappings?: () => void;
}

export function MarveeSyncButton({ year, onOpenMappings }: MarveeSyncButtonProps) {
  const { 
    syncCashFlow, 
    isSyncing, 
    syncCashFlowDetailed,
    isSyncingDetailed,
    syncRawTransactions,
    isSyncingRaw,
    syncExtrato,
    isSyncingExtrato,
    populateCashFlowTables,
    isPopulating,
    aggregateRawToDetailed,
    isAggregating,
    lastSync, 
    isLoadingLastSync 
  } = useMarveeSync();

  const handleSyncAll = () => {
    syncCashFlow({ syncAll: true });
  };

  const handleSyncYear = () => {
    syncCashFlow({ year });
  };

  const handleSyncMonth = (month: number) => {
    syncCashFlow({ year, month });
  };

  const handleSyncDetailedAll = () => {
    syncCashFlowDetailed({ syncAll: true });
  };

  const handleSyncDetailedYear = () => {
    syncCashFlowDetailed({ year });
  };

  const handleSyncRawAll = () => {
    syncRawTransactions({ syncAll: true });
  };

  const handleSyncRawYear = () => {
    syncRawTransactions({ year });
  };

  const handlePopulateAll = () => {
    populateCashFlowTables({});
  };

  const handlePopulateYear = () => {
    populateCashFlowTables({ year });
  };

  const handleAggregateAll = () => {
    aggregateRawToDetailed({});
  };

  const handleAggregateYear = () => {
    aggregateRawToDetailed({ year });
  };

  const handleSyncExtratoAll = () => {
    syncExtrato({ syncAll: true });
  };

  const handleSyncExtratoYear = () => {
    syncExtrato({ year });
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const formatLastSync = () => {
    if (isLoadingLastSync) return "Carregando...";
    if (!lastSync) return "Nunca sincronizado";
    
    const rawDate = lastSync.completed_at || lastSync.started_at;
    if (!rawDate) return "Nunca sincronizado";
    
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getStatusColor = () => {
    if (!lastSync) return "text-muted-foreground";
    switch (lastSync.status) {
      case "success": return "text-green-600";
      case "partial": return "text-yellow-600";
      case "error": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const isAnyLoading = isSyncing || isSyncingDetailed || isSyncingRaw || isSyncingExtrato || isAggregating || isPopulating;

  const getButtonLabel = () => {
    if (isSyncing) return "Sincronizando...";
    if (isSyncingDetailed) return "Sync Detalhado...";
    if (isSyncingRaw) return "Sync Raw...";
    if (isSyncingExtrato) return "Sync Extrato...";
    if (isPopulating) return "Populando Tabelas...";
    if (isAggregating) return "Agregando...";
    return "Sincronizar Marvee";
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className={getStatusColor()}>
              {formatLastSync()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Última sincronização Marvee</p>
          {lastSync?.status === "error" && lastSync.error_message && (
            <p className="text-red-400 text-xs mt-1">{lastSync.error_message}</p>
          )}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isAnyLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnyLoading ? "animate-spin" : ""}`} />
            {getButtonLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleSyncAll} className="font-medium">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Tudo (desde 2020)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSyncYear}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar ano {year}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Sincronizar mês específico
          </div>
          {months.map((month, index) => (
            <DropdownMenuItem 
              key={index} 
              onClick={() => handleSyncMonth(index + 1)}
              className="text-sm"
            >
              {month}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            📊 Sincronização Detalhada (3 níveis)
          </div>
          <DropdownMenuItem 
            onClick={handleSyncDetailedAll}
            disabled={isSyncingDetailed || isSyncing}
            className="font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingDetailed ? "animate-spin" : ""}`} />
            Sync Detalhado - Tudo (desde 2020)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSyncDetailedYear}
            disabled={isSyncingDetailed || isSyncing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Detalhado - Ano {year}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            🔍 Debug - Dados Brutos
          </div>
          <DropdownMenuItem 
            onClick={handleSyncRawAll}
            disabled={isSyncingRaw || isSyncing || isSyncingDetailed}
            className="font-medium"
          >
            <Database className={`h-4 w-4 mr-2 ${isSyncingRaw ? "animate-spin" : ""}`} />
            Sync Raw - Tudo (desde 2020)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSyncRawYear}
            disabled={isAnyLoading}
          >
            <Database className="h-4 w-4 mr-2" />
            Sync Raw - Ano {year}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            📊 Popular Tabelas (Despesas + Receitas)
          </div>
          <DropdownMenuItem 
            onClick={handlePopulateAll}
            disabled={isAnyLoading}
            className="font-medium"
          >
            <Calculator className={`h-4 w-4 mr-2 ${isPopulating ? "animate-spin" : ""}`} />
            Popular Tudo (todos os anos)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handlePopulateYear}
            disabled={isAnyLoading}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Popular Ano {year}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            🏦 Sincronizar Extrato Bancário
          </div>
          <DropdownMenuItem 
            onClick={handleSyncExtratoAll}
            disabled={isAnyLoading}
            className="font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingExtrato ? "animate-spin" : ""}`} />
            Sync Extrato - Tudo (desde 2020)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSyncExtratoYear}
            disabled={isAnyLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Extrato - Ano {year}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            📈 Agregar Raw → Detailed (legado)
          </div>
          <DropdownMenuItem 
            onClick={handleAggregateAll}
            disabled={isAnyLoading}
          >
            <Calculator className={`h-4 w-4 mr-2 ${isAggregating ? "animate-spin" : ""}`} />
            Agregar Tudo (legado)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleAggregateYear}
            disabled={isAnyLoading}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Agregar Ano {year} (legado)
          </DropdownMenuItem>
          {onOpenMappings && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenMappings}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar mapeamentos
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
