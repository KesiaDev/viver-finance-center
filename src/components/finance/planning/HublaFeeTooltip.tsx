import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Lock, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HublaFeeTooltipProps {
  children: React.ReactNode;
  showIcon?: boolean;
  feePercentage: number;
  // Props para detalhamento por mês
  monthDate?: Date;
  monthType?: 'past' | 'current' | 'future';
  totalRevenue?: number;
  platformFee?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatMonthName(date: Date): string {
  return format(date, "MMMM/yyyy", { locale: ptBR });
}

export function HublaFeeTooltip({ 
  children, 
  showIcon = false,
  feePercentage,
  monthDate,
  monthType,
  totalRevenue = 0,
  platformFee = 0,
}: HublaFeeTooltipProps) {
  const isDetailedMode = monthDate !== undefined;
  const isFuture = monthType === 'future';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {showIcon ? (
            <span className="inline-flex items-center gap-1 cursor-help">
              {children}
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
          ) : (
            <span className="cursor-help">{children}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2 font-semibold text-fuchsia-600 dark:text-fuchsia-400">
              <Info className="h-4 w-4" />
              Taxa da Plataforma (Hubla)
            </div>

            {isDetailedMode ? (
              <>
                {/* Mês */}
                <div className="text-xs">
                  <span className="text-muted-foreground">Mês:</span>{' '}
                  <span className="font-medium capitalize">{formatMonthName(monthDate!)}</span>
                </div>

                {/* Modo de cálculo */}
                <div className="text-xs flex items-center gap-1">
                  <span className="text-muted-foreground">Modo:</span>{' '}
                  {isFuture ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                      <Lock className="h-3 w-3" />
                      Cálculo Automático
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                      <Pencil className="h-3 w-3" />
                      Valor Manual
                    </span>
                  )}
                </div>

                {/* Detalhamento do cálculo */}
                {isFuture ? (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Receita Total: {formatCurrency(totalRevenue)}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-xs">
                      <span>Taxa Hubla ({feePercentage}%):</span>
                      <span className="text-right font-medium">{formatCurrency(platformFee)}</span>
                    </div>
                    <div className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                      {formatCurrency(totalRevenue)} × {feePercentage}% = {formatCurrency(platformFee)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Valor informado manualmente baseado na taxa real cobrada pela Hubla.
                    </p>
                    <div className="flex justify-between text-xs">
                      <span>Valor:</span>
                      <span className="font-medium">{formatCurrency(platformFee)}</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-fuchsia-300/30">
                  <span>TAXA HUBLA:</span>
                  <span className="text-fuchsia-600 dark:text-fuchsia-400">{formatCurrency(platformFee)}</span>
                </div>
              </>
            ) : (
              <>
                {/* Modo genérico (header da tabela) */}
                <p className="text-xs text-muted-foreground">
                  Taxa cobrada pela plataforma Hubla sobre todas as vendas realizadas.
                </p>
                <div className="text-xs space-y-1">
                  <div>• <strong>Meses passados/atual:</strong> Valor real informado manualmente</div>
                  <div>• <strong>Meses futuros:</strong> Estimativa automática de {feePercentage}% sobre a receita total</div>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs font-medium">Fórmula (futuro):</span>
                  <div className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                    Receita Total × {feePercentage}%
                  </div>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}