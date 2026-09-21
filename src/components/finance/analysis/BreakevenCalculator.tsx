import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

interface BreakevenCalculatorProps {
  calculateBreakeven: (targetML: number) => {
    requiredRevenue: number;
    currentRevenue: number;
    gap: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const BreakevenCalculator = ({ calculateBreakeven }: BreakevenCalculatorProps) => {
  const [targetML, setTargetML] = useState(15);
  
  const breakeven = calculateBreakeven(targetML);
  const isAchieved = breakeven.gap <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4" />
          Calculadora de Break-even
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Margem Líquida Alvo</span>
            <span className="text-lg font-bold text-primary">{targetML}%</span>
          </div>
          <Slider
            value={[targetML]}
            onValueChange={(value) => setTargetML(value[0])}
            min={5}
            max={40}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5%</span>
            <span>20%</span>
            <span>40%</span>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">
              Para atingir ML de {targetML}%, você precisa de:
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(breakeven.requiredRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">em receita anual</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Receita Atual</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(breakeven.currentRevenue)}
              </p>
            </div>
            
            <div className={`p-3 rounded-lg ${isAchieved ? 'bg-green-50 dark:bg-green-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">Gap</p>
              {isAchieved ? (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-lg font-semibold text-green-600">Meta Atingida!</p>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-lg font-semibold text-amber-600">
                    {formatCurrency(breakeven.gap)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tip */}
        <p className="text-xs text-muted-foreground">
          💡 Ajuste o slider para simular diferentes metas de margem líquida
        </p>
      </CardContent>
    </Card>
  );
};
