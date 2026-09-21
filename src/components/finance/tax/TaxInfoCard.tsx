import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { TAX_CONFIG } from "@/lib/taxCalculations";

const monthlyTaxes = [
  { 
    name: "PIS", 
    rate: TAX_CONFIG.monthly.pis, 
    description: "Calculado sobre receita bruta do mês anterior" 
  },
  { 
    name: "COFINS", 
    rate: TAX_CONFIG.monthly.cofins, 
    description: "Calculado sobre receita bruta do mês anterior" 
  },
  { 
    name: "ISS", 
    rate: TAX_CONFIG.monthly.iss, 
    description: "Calculado sobre receita bruta (varia por município)" 
  },
];

const quarterlyTaxes = [
  { 
    name: "IRPJ", 
    rate: TAX_CONFIG.quarterly.irpj, 
    description: "Sobre base presumida (32% da receita trimestral)" 
  },
  { 
    name: "IRPJ Adicional", 
    rate: TAX_CONFIG.quarterly.irpj_additional, 
    description: `Sobre o que exceder R$ ${TAX_CONFIG.quarterly.irpj_threshold.toLocaleString('pt-BR')}/mês da base presumida` 
  },
  { 
    name: "CSLL", 
    rate: TAX_CONFIG.quarterly.csll, 
    description: "Sobre base presumida (32% da receita trimestral)" 
  },
];

const totalMonthlyRate = TAX_CONFIG.monthly.pis + TAX_CONFIG.monthly.cofins + TAX_CONFIG.monthly.iss;

export const TaxInfoCard = () => {
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <div>
            <span>Regime: Lucro Presumido</span>
            <p className="text-sm font-normal text-muted-foreground mt-1">
              Base de presunção de 32% para serviços
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Impostos Mensais */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Impostos Mensais</h3>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              Mensal
            </Badge>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Imposto</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Alíquota</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTaxes.map((tax) => (
                  <tr key={tax.name} className="border-b border-border/50">
                    <td className="py-2 font-medium">{tax.name}</td>
                    <td className="py-2 text-center font-mono text-amber-600">{formatPercent(tax.rate)}</td>
                    <td className="py-2 text-muted-foreground">{tax.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <span className="font-medium text-green-600">
              ✅ Total Mensal: {formatPercent(totalMonthlyRate)} sobre receita bruta
            </span>
          </div>
        </div>

        {/* Impostos Trimestrais */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Impostos Trimestrais</h3>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              Trimestral (Jan, Abr, Jul, Out)
            </Badge>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Imposto</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Alíquota</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyTaxes.map((tax) => (
                  <tr key={tax.name} className="border-b border-border/50">
                    <td className="py-2 font-medium">{tax.name}</td>
                    <td className="py-2 text-center font-mono text-amber-600">{formatPercent(tax.rate)}</td>
                    <td className="py-2 text-muted-foreground">{tax.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Defasagem de Pagamento */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            💡 Defasagem de Pagamento
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Impostos mensais são calculados sobre a <strong>receita do mês anterior</strong></li>
            <li>Impostos trimestrais são calculados sobre a <strong>receita acumulada dos 3 meses anteriores</strong></li>
            <li>Pagamentos trimestrais ocorrem apenas nos meses 1, 4, 7 e 10</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
