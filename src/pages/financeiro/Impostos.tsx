import { Scale } from "lucide-react";
import { TaxInfoCard } from "@/components/finance/tax/TaxInfoCard";
import { TaxSimulator } from "@/components/finance/tax/TaxSimulator";

const Impostos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Regime de Impostos</h1>
          <p className="text-muted-foreground">
            Lucro Presumido - Cálculo automático de impostos
          </p>
        </div>
      </div>
      
      <TaxInfoCard />
      <TaxSimulator />
    </div>
  );
};

export default Impostos;
