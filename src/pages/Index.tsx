import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { QuickActionCard } from "@/components/Dashboard/QuickActionCard";
import { InfoCard } from "@/components/Dashboard/InfoCard";
import { MetricCard } from "@/components/Dashboard/MetricCard";
import { DollarSign, TrendingUp, FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { stats, isLoading } = useDashboardStats();
  const { isAdmin } = useAuth();

  const displayStats = stats || {
    pendentes: 0,
    aprovadas: 0,
    valorTotal: "R$ 0,00",
    prazoNF: "Dia 25"
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="gradient-cyan text-white rounded-2xl p-8 shadow-lg shadow-primary/20">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold mb-3">Central Financeira</h2>
            <p className="text-white/90 text-lg">
              Gestão à Vista - Controle total das suas finanças
            </p>
          </div>
        </section>

        {/* Metrics */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <MetricCard 
                label="Pendentes"
                value={isLoading ? "..." : displayStats.pendentes.toString()}
                sublabel={isAdmin ? "Aguardando análise" : "Suas solicitações"}
                colorClass="text-primary"
              />
            </Card>
            <Card className="p-6">
              <MetricCard 
                label="Aprovadas"
                value={isLoading ? "..." : displayStats.aprovadas.toString()}
                sublabel={isAdmin ? "Este mês" : "Suas aprovações"}
                colorClass="text-neon-green"
              />
            </Card>
            <Card className="p-6">
              <MetricCard 
                label="Valor Total"
                value={isLoading ? "..." : displayStats.valorTotal}
                sublabel={isAdmin ? "Processado" : "Seus reembolsos"}
                colorClass="text-primary"
                size="lg"
              />
            </Card>
            <Card className="p-6">
              <MetricCard 
                label="Prazo NF"
                value={displayStats.prazoNF}
                sublabel="Envio mensal"
                colorClass="text-orange"
              />
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              icon={DollarSign}
              title="Solicitar Reembolso"
              description="Envie sua solicitação de reembolso com comprovante"
              link="/solicitacoes?tipo=reembolso"
            />
            <QuickActionCard
              icon={TrendingUp}
              title="Devolução ao Cliente"
              description="Registre devoluções e reembolsos para clientes"
              link="/solicitacoes?tipo=devolucao"
              variant="success"
            />
            <QuickActionCard
              icon={FileText}
              title="Enviar Nota Fiscal"
              description="Prestadores e fornecedores: envie suas NFs"
              link="/notas-fiscais"
              variant="warning"
            />
          </div>
        </section>

        {/* Important Info */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Informações Importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              icon={Clock}
              title="Prazos de Pagamento"
              description="Pagamentos são processados toda sexta-feira, conforme cronograma interno. Reembolsos aprovados levam até 10 dias úteis."
            />
            <InfoCard
              icon={FileText}
              title="Documentação Necessária"
              description="Toda solicitação deve incluir comprovante válido e estar devidamente preenchida para ser processada."
            />
            <InfoCard
              icon={CheckCircle}
              title="Aprovação e Validação"
              description="Reembolsos precisam de autorização prévia. Devoluções a clientes necessitam validação da diretoria."
            />
            <InfoCard
              icon={AlertCircle}
              title="Notas Fiscais"
              description="Prestadores e fornecedores devem enviar NFs até dia 25 de cada mês com todos os dados bancários."
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
