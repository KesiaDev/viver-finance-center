import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "./MetricCard";
import { DollarSign, TrendingUp, Package, Receipt } from "lucide-react";
import type { AdminStatsData } from "@/hooks/useAdminStats";

interface AdminStatsCardsProps {
  stats: AdminStatsData;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  const totalReembolsos = 
    stats.reembolsos.pendentes.count + 
    stats.reembolsos.aprovadas.count + 
    stats.reembolsos.rejeitadas.count;
  
  const totalValorReembolsos = 
    stats.reembolsos.pendentes.total + 
    stats.reembolsos.aprovadas.total + 
    stats.reembolsos.rejeitadas.total;

  const totalDevolucoes = 
    stats.devolucoes.pendentes.count + 
    stats.devolucoes.aprovadas.count + 
    stats.devolucoes.rejeitadas.count;
  
  const totalValorDevolucoes = 
    stats.devolucoes.pendentes.total + 
    stats.devolucoes.aprovadas.total + 
    stats.devolucoes.rejeitadas.total;

  const totalMateriais = 
    stats.materiais.pendentes.count + 
    stats.materiais.aprovadas.count + 
    stats.materiais.rejeitadas.count;

  const totalNotasFiscais = 
    stats.notasFiscais.pendentes.count + 
    stats.notasFiscais.aprovadas.count + 
    stats.notasFiscais.rejeitadas.count;
  
  const totalValorNotasFiscais = 
    stats.notasFiscais.pendentes.total + 
    stats.notasFiscais.aprovadas.total + 
    stats.notasFiscais.rejeitadas.total;

  return (
    <div className="space-y-6">
      {/* Reembolsos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Reembolsos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard 
              label="Pendentes"
              value={stats.reembolsos.pendentes.count.toString()}
              sublabel={formatCurrency(stats.reembolsos.pendentes.total)}
              colorClass="text-primary"
              size="md"
            />
            <MetricCard 
              label="Aprovadas"
              value={stats.reembolsos.aprovadas.count.toString()}
              sublabel={formatCurrency(stats.reembolsos.aprovadas.total)}
              colorClass="text-neon-green"
              size="md"
            />
            <MetricCard 
              label="Rejeitadas"
              value={stats.reembolsos.rejeitadas.count.toString()}
              sublabel={formatCurrency(stats.reembolsos.rejeitadas.total)}
              colorClass="text-red-500"
              size="md"
            />
            <MetricCard 
              label="Total"
              value={totalReembolsos.toString()}
              sublabel={formatCurrency(totalValorReembolsos)}
              colorClass="text-foreground"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Devoluções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Devoluções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard 
              label="Pendentes"
              value={stats.devolucoes.pendentes.count.toString()}
              sublabel={formatCurrency(stats.devolucoes.pendentes.total)}
              colorClass="text-primary"
              size="md"
            />
            <MetricCard 
              label="Aprovadas"
              value={stats.devolucoes.aprovadas.count.toString()}
              sublabel={formatCurrency(stats.devolucoes.aprovadas.total)}
              colorClass="text-neon-green"
              size="md"
            />
            <MetricCard 
              label="Rejeitadas"
              value={stats.devolucoes.rejeitadas.count.toString()}
              sublabel={formatCurrency(stats.devolucoes.rejeitadas.total)}
              colorClass="text-red-500"
              size="md"
            />
            <MetricCard 
              label="Total"
              value={totalDevolucoes.toString()}
              sublabel={formatCurrency(totalValorDevolucoes)}
              colorClass="text-foreground"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Materiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Materiais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard 
              label="Pendentes"
              value={stats.materiais.pendentes.count.toString()}
              sublabel="Aguardando análise"
              colorClass="text-primary"
              size="md"
            />
            <MetricCard 
              label="Aprovadas"
              value={stats.materiais.aprovadas.count.toString()}
              sublabel="Solicitações aprovadas"
              colorClass="text-neon-green"
              size="md"
            />
            <MetricCard 
              label="Rejeitadas"
              value={stats.materiais.rejeitadas.count.toString()}
              sublabel="Solicitações negadas"
              colorClass="text-red-500"
              size="md"
            />
            <MetricCard 
              label="Total"
              value={totalMateriais.toString()}
              sublabel="Todas as solicitações"
              colorClass="text-purple-500"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notas Fiscais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            Notas Fiscais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard 
              label="Pendentes"
              value={stats.notasFiscais.pendentes.count.toString()}
              sublabel={formatCurrency(stats.notasFiscais.pendentes.total)}
              colorClass="text-primary"
              size="md"
            />
            <MetricCard 
              label="Aprovadas"
              value={stats.notasFiscais.aprovadas.count.toString()}
              sublabel={formatCurrency(stats.notasFiscais.aprovadas.total)}
              colorClass="text-neon-green"
              size="md"
            />
            <MetricCard 
              label="Rejeitadas"
              value={stats.notasFiscais.rejeitadas.count.toString()}
              sublabel={formatCurrency(stats.notasFiscais.rejeitadas.total)}
              colorClass="text-red-500"
              size="md"
            />
            <MetricCard 
              label="Total"
              value={totalNotasFiscais.toString()}
              sublabel={formatCurrency(totalValorNotasFiscais)}
              colorClass="text-blue-500"
              size="md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};