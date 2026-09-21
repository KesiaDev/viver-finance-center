import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReembolsosList } from "@/components/Dashboard/ReembolsosList";
import { DevolucoesList } from "@/components/Dashboard/DevolucoesList";
import { NotasFiscaisList } from "@/components/Dashboard/NotasFiscaisList";
import { MateriaisList } from "@/components/Dashboard/MateriaisList";
import { ApprovalSectionStats, ApprovalStats } from "@/components/Dashboard/ApprovalSectionStats";
import { ApprovalFilters, filterItemsByDate, filterItemsByStatus } from "@/components/Dashboard/ApprovalFilters";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useReembolsos } from "@/hooks/useReembolsos";
import { useDevolucoes } from "@/hooks/useDevolucoes";
import { useMateriais } from "@/hooks/useMateriais";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, Receipt, Package, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ContratosList } from "@/components/Dashboard/ContratosList";
import { useContratos } from "@/hooks/useContratos";
import { useMemo, useEffect } from "react";

// Helper para calcular estatísticas de uma lista
const calculateStats = (items: any[] | undefined, hasValue: boolean = true): ApprovalStats => {
  if (!items) return { 
    pendentes: 0, aprovados: 0, rejeitados: 0, total: 0,
    valorPendente: 0, valorAprovado: 0, valorRejeitado: 0, valorTotal: 0,
    hasValue
  };
  
  const pendentes = items.filter(i => i.status === 'pendente');
  const aprovados = items.filter(i => i.status === 'aprovado');
  const rejeitados = items.filter(i => i.status === 'rejeitado');
  
  return {
    pendentes: pendentes.length,
    aprovados: aprovados.length,
    rejeitados: rejeitados.length,
    total: items.length,
    valorPendente: pendentes.reduce((sum, i) => sum + (i.valor || 0), 0),
    valorAprovado: aprovados.reduce((sum, i) => sum + (i.valor || 0), 0),
    valorRejeitado: rejeitados.reduce((sum, i) => sum + (i.valor || 0), 0),
    valorTotal: items.reduce((sum, i) => sum + (i.valor || 0), 0),
    hasValue
  };
};

const AdminDashboard = () => {
  useAdminStats(); // Keep hook for potential future use
  const { approvalFilters, setApprovalFilter, clearApprovalFilters, adminDashboardTab, setAdminDashboardTab } = useAppPreferences();
  const { approvalPermissions, isAdmin, hasAdminViewOnly } = useAuth();
  
  // Buscar dados para contadores de pendentes
  const { reembolsos } = useReembolsos();
  const { devolucoes } = useDevolucoes();
  const { materiais } = useMateriais();
  const { notasFiscais } = useNotasFiscais();
  const { contratos } = useContratos();

  // Aplicar filtros
  const applyFilters = <T extends { created_at: string; status: string | null }>(items: T[] | undefined): T[] => {
    const { statusFilter, periodFilter, dateFrom, dateTo } = approvalFilters;
    const dateFiltered = filterItemsByDate(items, periodFilter, dateFrom, dateTo);
    return filterItemsByStatus(dateFiltered, statusFilter);
  };

  const filteredReembolsos = applyFilters(reembolsos);
  const filteredDevolucoes = applyFilters(devolucoes);
  const filteredMateriais = applyFilters(materiais);
  const filteredNotas = applyFilters(notasFiscais);
  const filteredContratos = applyFilters(contratos);

  // Calcular estatísticas por categoria (usando dados filtrados)
  const statsReembolsos = calculateStats(filteredReembolsos, true);
  const statsDevolucoes = calculateStats(filteredDevolucoes, true);
  const statsMateriais = calculateStats(filteredMateriais, false); // Materiais não tem valor
  const statsContratos = calculateStats(filteredContratos, true);
  const statsNotas = calculateStats(filteredNotas, true);

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setApprovalFilter('dateFrom', range.from?.toISOString() || null);
    setApprovalFilter('dateTo', range.to?.toISOString() || null);
  };

  const allTabs = [
    {
      value: "notas" as const,
      label: "Notas Fiscais",
      icon: Receipt,
      colorClass: "text-magenta",
      bgClass: "bg-magenta/10",
      pendentes: statsNotas.pendentes,
      stats: statsNotas,
      content: <NotasFiscaisList embedded data={filteredNotas} />,
    },
    {
      value: "reembolsos" as const,
      label: "Reembolsos",
      icon: DollarSign,
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
      pendentes: statsReembolsos.pendentes,
      stats: statsReembolsos,
      content: <ReembolsosList embedded data={filteredReembolsos} />,
    },
    {
      value: "devolucoes" as const,
      label: "Devoluções",
      icon: TrendingUp,
      colorClass: "text-cyan",
      bgClass: "bg-cyan/10",
      pendentes: statsDevolucoes.pendentes,
      stats: statsDevolucoes,
      content: <DevolucoesList embedded data={filteredDevolucoes} />,
    },
    {
      value: "materiais" as const,
      label: "Materiais",
      icon: Package,
      colorClass: "text-neon-green",
      bgClass: "bg-neon-green/10",
      pendentes: statsMateriais.pendentes,
      stats: statsMateriais,
      content: <MateriaisList embedded data={filteredMateriais} />,
    },
    {
      value: "contratos" as const,
      label: "Contratos",
      icon: FileSignature,
      colorClass: "text-amber-400",
      bgClass: "bg-amber-400/10",
      pendentes: statsContratos.pendentes,
      stats: statsContratos,
      content: <ContratosList embedded data={filteredContratos} />,
    },
  ];

  // Filtrar abas baseado nas permissões do usuário
  const visibleTabs = useMemo(() => {
    if (isAdmin || hasAdminViewOnly) {
      return allTabs;
    }
    // Non-admin users don't see contratos tab (admin-only feature)
    return allTabs.filter(tab => {
      if (tab.value === "contratos") return false;
      return approvalPermissions.includes(tab.value as any);
    });
  }, [isAdmin, hasAdminViewOnly, approvalPermissions, allTabs]);

  // Redirecionar para primeira aba permitida se a aba atual não for visível
  useEffect(() => {
    if (visibleTabs.length > 0) {
      const currentTabVisible = visibleTabs.some(t => t.value === adminDashboardTab);
      if (!currentTabVisible) {
        setAdminDashboardTab(visibleTabs[0].value);
      }
    }
  }, [visibleTabs, adminDashboardTab, setAdminDashboardTab]);

  // Encontrar aba ativa para mostrar estatísticas
  const activeTab = visibleTabs.find(t => t.value === adminDashboardTab) || visibleTabs[0];

  // Calcular total de pendentes apenas das abas visíveis
  const totalPendentes = visibleTabs.reduce((sum, tab) => sum + tab.pendentes, 0);

  // Se não há abas visíveis, mostrar mensagem
  if (visibleTabs.length === 0) {
    return (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Sem Permissões</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para visualizar nenhuma categoria de aprovação.
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-foreground">Aprovações</h2>
            {totalPendentes > 0 && (
              <p className="text-muted-foreground">
                {totalPendentes} solicitação(ões) pendente(s) de aprovação
              </p>
            )}
          </div>
        </div>

        {/* Barra de Filtros */}
        <ApprovalFilters
          filters={approvalFilters}
          onStatusChange={(v) => setApprovalFilter('statusFilter', v)}
          onPeriodChange={(v) => setApprovalFilter('periodFilter', v)}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={clearApprovalFilters}
        />

        {/* Tabs de Aprovações */}
        <Tabs 
          value={adminDashboardTab} 
          onValueChange={setAdminDashboardTab}
          className="space-y-4"
        >
          <TabsList className={`grid w-full h-auto p-1 gap-1`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 py-3 px-4 data-[state=active]:shadow-md"
                >
                  <div className={`p-1.5 rounded-md ${tab.bgClass}`}>
                    <Icon className={`w-4 h-4 ${tab.colorClass}`} />
                  </div>
                  <span className="hidden sm:inline font-medium">{tab.label}</span>
                  {tab.pendentes > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {tab.pendentes}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Estatísticas da aba ativa */}
          {activeTab && (
            <div className="border border-subtle rounded-lg bg-card p-4">
              <ApprovalSectionStats stats={activeTab.stats} variant="expanded" />
            </div>
          )}

          {/* Conteúdo das abas */}
          {visibleTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <div className="border border-subtle rounded-lg bg-card p-4">
                {tab.content}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
