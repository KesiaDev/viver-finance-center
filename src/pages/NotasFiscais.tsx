import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { NotaFiscalForm } from "@/components/Forms/NotaFiscalForm";
import { MyNotasFiscaisList } from "@/components/Dashboard/MyNotasFiscaisList";

const NotasFiscais = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Envio de Notas Fiscais</h2>
          <p className="text-muted-foreground">
            Para prestadores de serviço e fornecedores
          </p>
        </div>

        <div className="mb-8">
          <NotaFiscalForm />
        </div>

        <div>
          <MyNotasFiscaisList />
        </div>
      </main>
    </div>
  );
};

export default NotasFiscais;
