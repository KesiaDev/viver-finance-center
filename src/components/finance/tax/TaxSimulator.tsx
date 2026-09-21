import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { TAX_CONFIG } from "@/lib/taxCalculations";

export const TaxSimulator = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(50000);
  const [quarterlyRevenue, setQuarterlyRevenue] = useState<number>(150000);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  // Cálculos Mensais
  const pis = monthlyRevenue * TAX_CONFIG.monthly.pis;
  const cofins = monthlyRevenue * TAX_CONFIG.monthly.cofins;
  const iss = monthlyRevenue * TAX_CONFIG.monthly.iss;
  const totalMonthly = pis + cofins + iss;

  // Cálculos Trimestrais
  const presumedBase = quarterlyRevenue * TAX_CONFIG.presumption_rate;
  const irpj = presumedBase * TAX_CONFIG.quarterly.irpj;
  const limiteTrimestrall = TAX_CONFIG.quarterly.irpj_threshold * 3;
  const irpjAdditional = presumedBase > limiteTrimestrall 
    ? (presumedBase - limiteTrimestrall) * TAX_CONFIG.quarterly.irpj_additional 
    : 0;
  const csll = presumedBase * TAX_CONFIG.quarterly.csll;
  const totalQuarterly = irpj + irpjAdditional + csll;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador de Impostos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna 1 - Impostos Mensais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              📅 IMPOSTOS MENSAIS
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="monthlyRevenue">Receita Mensal</Label>
              <Input
                id="monthlyRevenue"
                type="number"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  PIS ({formatPercent(TAX_CONFIG.monthly.pis)})
                </span>
                <span className="font-mono">{formatCurrency(pis)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  COFINS ({formatPercent(TAX_CONFIG.monthly.cofins)})
                </span>
                <span className="font-mono">{formatCurrency(cofins)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  ISS ({formatPercent(TAX_CONFIG.monthly.iss)})
                </span>
                <span className="font-mono">{formatCurrency(iss)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Mensal</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatCurrency(totalMonthly)}
                </span>
              </div>
            </div>
          </div>

          {/* Coluna 2 - Impostos Trimestrais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              📊 IMPOSTOS TRIMESTRAIS
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="quarterlyRevenue">Receita Trimestral</Label>
              <Input
                id="quarterlyRevenue"
                type="number"
                value={quarterlyRevenue}
                onChange={(e) => setQuarterlyRevenue(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Base Presumida ({formatPercent(TAX_CONFIG.presumption_rate)})
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  {formatCurrency(presumedBase)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  IRPJ ({formatPercent(TAX_CONFIG.quarterly.irpj)})
                </span>
                <span className="font-mono">{formatCurrency(irpj)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  IRPJ Adicional ({formatPercent(TAX_CONFIG.quarterly.irpj_additional)})
                </span>
                <span className="font-mono">{formatCurrency(irpjAdditional)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  CSLL ({formatPercent(TAX_CONFIG.quarterly.csll)})
                </span>
                <span className="font-mono">{formatCurrency(csll)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Trimestral</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatCurrency(totalQuarterly)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nota */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>📝 Nota:</strong> Os impostos mensais são calculados sobre a receita do mês anterior. 
            Os impostos trimestrais são pagos nos meses 1, 4, 7 e 10 sobre a receita acumulada dos 3 meses anteriores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
