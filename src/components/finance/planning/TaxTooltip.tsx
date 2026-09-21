import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  TaxBreakdown, 
  formatCurrency, 
  formatPercent,
  LP_RATES,
  getPreviousQuarterName
} from "@/lib/taxCalculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Info } from "lucide-react";

interface TaxTooltipProps {
  breakdown: TaxBreakdown;
  monthDate: Date;
  children: React.ReactNode;
}

export function TaxTooltip({ breakdown, monthDate, children }: TaxTooltipProps) {
  const previousMonthName = format(
    new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
    'MMMM/yyyy',
    { locale: ptBR }
  );

  if (breakdown.regime === 'simples_nacional') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help">{children}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-600">
                <Info className="h-4 w-4" />
                Simples Nacional
              </div>
              <p className="text-xs text-muted-foreground">
                Até Outubro/2025 o regime é Simples Nacional.
                O valor do imposto deve ser inserido manualmente.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="left">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 font-semibold text-primary border-b pb-2">
              <Info className="h-4 w-4" />
              Detalhamento de Impostos
            </div>

            {/* Regime */}
            <div className="text-xs">
              <span className="text-muted-foreground">Regime:</span>{' '}
              <span className="font-medium text-violet-600">Lucro Presumido</span>
            </div>

            {/* Impostos Mensais */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                Impostos Mensais (base: {previousMonthName})
              </div>
              <div className="text-xs text-muted-foreground">
                Receita: {formatCurrency(breakdown.baseRevenue)}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                <span>• PIS ({formatPercent(LP_RATES.PIS * 100)}):</span>
                <span className="text-right">{formatCurrency(breakdown.monthly.pis)}</span>
                
                <span>• COFINS ({formatPercent(LP_RATES.COFINS * 100)}):</span>
                <span className="text-right">{formatCurrency(breakdown.monthly.cofins)}</span>
                
                <span>• ISS ({formatPercent(LP_RATES.ISS * 100)}):</span>
                <span className="text-right">{formatCurrency(breakdown.monthly.iss)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t mt-1">
                <span>Subtotal Mensal:</span>
                <span>{formatCurrency(breakdown.monthly.total)}</span>
              </div>
            </div>

            {/* Impostos Trimestrais */}
            {breakdown.quarterly.isQuarterlyMonth && (
              <div className="space-y-1 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  🔄 Impostos Trimestrais ({getPreviousQuarterName(monthDate)})
                </div>
                <div className="text-xs text-muted-foreground">
                  Receita Trim.: {formatCurrency(breakdown.quarterly.quarterRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Base Presumida (32%): {formatCurrency(breakdown.quarterly.basePresumida)}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
                  <span>• IRPJ (15%):</span>
                  <span className="text-right">{formatCurrency(breakdown.quarterly.irpj)}</span>
                  
                  {breakdown.quarterly.irpjAdicional > 0 && (
                    <>
                      <span>• IRPJ Adic. (10%):</span>
                      <span className="text-right">{formatCurrency(breakdown.quarterly.irpjAdicional)}</span>
                    </>
                  )}
                  
                  <span>• CSLL (9%):</span>
                  <span className="text-right">{formatCurrency(breakdown.quarterly.csll)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium pt-1 border-t mt-1">
                  <span>Subtotal Trimestral:</span>
                  <span>{formatCurrency(breakdown.quarterly.total)}</span>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-primary/30">
              <span>TOTAL:</span>
              <span className="text-amber-600">{formatCurrency(breakdown.total)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
