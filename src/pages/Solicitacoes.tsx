import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReembolsoForm } from "@/components/Forms/ReembolsoForm";
import { DevolucaoForm } from "@/components/Forms/DevolucaoForm";
import { MaterialForm } from "@/components/Forms/MaterialForm";
import { ContratoForm } from "@/components/Forms/ContratoForm";
import { MyReembolsosList } from "@/components/Dashboard/MyReembolsosList";
import { MyDevolucoesList } from "@/components/Dashboard/MyDevolucoesList";
import { MyMateriaisList } from "@/components/Dashboard/MyMateriaisList";
import { MyContratosList } from "@/components/Dashboard/MyContratosList";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { useColaboradorFuncao } from "@/hooks/useColaboradorFuncao";
import { DollarSign, TrendingUp, Package, List, FileSignature } from "lucide-react";

const Solicitacoes = () => {
  const { solicitacoesTab: activeTab, setSolicitacoesTab: setActiveTab } = useAppPreferences();
  const { isDiretorOuHead } = useColaboradorFuncao();

  const gridCols = isDiretorOuHead ? 5 : 4;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Solicitações Financeiras</h2>
          <p className="text-muted-foreground">
            Preencha o formulário adequado para fazer sua solicitação
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full max-w-2xl bg-card-dark border border-subtle`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
            <TabsTrigger value="reembolso" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4" />
              Reembolso
            </TabsTrigger>
            <TabsTrigger value="devolucao" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="w-4 h-4" />
              Devolução
            </TabsTrigger>
            <TabsTrigger value="materiais" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4" />
              Materiais
            </TabsTrigger>
            {isDiretorOuHead && (
              <TabsTrigger value="contratos" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileSignature className="w-4 h-4" />
                Contratos
              </TabsTrigger>
            )}
            <TabsTrigger value="minhas" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="w-4 h-4" />
              Minhas Solicitações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reembolso" className="space-y-4">
            <ReembolsoForm />
          </TabsContent>

          <TabsContent value="devolucao" className="space-y-4">
            <DevolucaoForm />
          </TabsContent>

          <TabsContent value="materiais" className="space-y-4">
            <MaterialForm />
          </TabsContent>

          {isDiretorOuHead && (
            <TabsContent value="contratos" className="space-y-4">
              <ContratoForm />
            </TabsContent>
          )}

          <TabsContent value="minhas" className="space-y-4">
            <div className="space-y-6">
              <MyReembolsosList />
              <MyDevolucoesList />
              <MyMateriaisList />
              {isDiretorOuHead && <MyContratosList />}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Solicitacoes;
