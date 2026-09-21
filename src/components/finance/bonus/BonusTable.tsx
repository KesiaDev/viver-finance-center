import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw, Check, X, Loader2 } from "lucide-react";
import type { DirectorBonusData, BonusSummary, QuarterBonusData, DirectorBonus } from "@/hooks/useBonusCalculator";
import { formatCurrency, parseCurrencyInput } from "@/lib/taxCalculations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BonusTableProps {
  directors: DirectorBonusData[];
  summary: BonusSummary;
  mlTarget: number;
  defaultBonuses: readonly DirectorBonus[];
  onUpdateBase?: (directorId: string, quarterlyBase: number, annualBase: number) => void;
  onResetBase?: (directorId: string) => void;
  isUpdating?: boolean;
  canEdit?: boolean;
}

const BonusTable = ({ 
  directors, 
  summary, 
  mlTarget, 
  defaultBonuses,
  onUpdateBase,
  onResetBase,
  isUpdating,
  canEdit = true
}: BonusTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (directorId: string, currentValue: number) => {
    setEditingId(directorId);
    // Formatar como número limpo (sem R$)
    setEditValue(currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleConfirmEdit = (directorId: string) => {
    const quarterlyBase = parseCurrencyInput(editValue);
    if (quarterlyBase > 0 && onUpdateBase) {
      // Calcular annual baseado na proporção padrão (quarterly * 4)
      const annualBase = quarterlyBase * 4;
      onUpdateBase(directorId, quarterlyBase, annualBase);
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, directorId: string) => {
    if (e.key === "Enter") {
      handleConfirmEdit(directorId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const isCustomValue = (directorId: string, currentQuarterly: number) => {
    const defaultBonus = defaultBonuses.find(b => b.id === directorId);
    return defaultBonus && defaultBonus.quarterly !== currentQuarterly;
  };

  const renderQuarterCell = (data: QuarterBonusData) => {
    const hasData = data.ml !== 0 || data.bonus !== 0 || data.bonusForecast !== 0;
    const hasCenario = data.bonusForecast > 0 && data.bonusForecast !== data.bonus;

    if (!hasData) {
      return (
        <div className="text-center text-muted-foreground">
          <div className="text-sm">--</div>
        </div>
      );
    }

    // Calcular % da geração de caixa
    const percentOfCash = data.cashGeneration > 0 && data.bonus > 0
      ? (data.bonus / data.cashGeneration) * 100
      : 0;
    const percentOfCashForecast = data.cashGeneration > 0 && data.bonusForecast > 0
      ? (data.bonusForecast / data.cashGeneration) * 100
      : 0;

    // Determinar ML e % Caixa a exibir (preferir forecast se existir)
    const displayML = hasCenario ? data.mlForecast : data.ml;
    const displayCash = hasCenario ? percentOfCashForecast : percentOfCash;
    const isMLMet = displayML >= mlTarget;

    return (
      <div className="text-center space-y-0.5">
        {/* Valores monetários */}
        <div className="text-sm font-medium">
          {data.bonus > 0 ? formatCurrency(data.bonus) : "--"}
        </div>
        {hasCenario && (
          <div className="text-xs text-primary font-medium">
            {formatCurrency(data.bonusForecast)}
          </div>
        )}
        
        {/* Indicadores em linha única - clean design */}
        {(displayML > 0 || displayCash > 0) && (
          <div className="text-[10px] text-muted-foreground mt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help inline-flex items-center gap-1.5">
                  {displayML > 0 && (
                    <span className={isMLMet ? "text-success font-medium" : "text-primary"}>
                      {displayML.toFixed(1)}% ML
                    </span>
                  )}
                  {displayML > 0 && displayCash > 0 && (
                    <span className="opacity-40">·</span>
                  )}
                  {displayCash > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {displayCash.toFixed(1)}% Ger. Caixa
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <div className="space-y-1">
                  {data.ml > 0 && <p>ML Real: {data.ml.toFixed(1)}%</p>}
                  {hasCenario && <p>ML Prev: {data.mlForecast.toFixed(1)}%</p>}
                  <p>Geração de Caixa: {formatCurrency(data.cashGeneration)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  const getQuarterTotal = (quarterKey: 'q1' | 'q2' | 'q3' | 'q4', type: 'bonus' | 'bonusForecast') => {
    return directors.reduce((sum, d) => sum + d.quarters[quarterKey][type], 0);
  };

  // Obter a geração de caixa do trimestre (usar do primeiro diretor, pois é igual para todos)
  const getQuarterCashGeneration = (quarterKey: 'q1' | 'q2' | 'q3' | 'q4') => {
    return directors[0]?.quarters[quarterKey]?.cashGeneration || 0;
  };

  // Obter a geração de caixa anual consolidada
  const getAnnualCashGeneration = () => {
    return (
      getQuarterCashGeneration('q1') +
      getQuarterCashGeneration('q2') +
      getQuarterCashGeneration('q3') +
      getQuarterCashGeneration('q4')
    );
  };

  const renderBaseCell = (director: DirectorBonusData) => {
    const isEditing = editingId === director.directorId;
    const isCustom = isCustomValue(director.directorId, director.quarterlyBase);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1 justify-center">
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, director.directorId)}
            className="w-24 h-7 text-center text-sm"
            placeholder="0"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => handleConfirmEdit(director.directorId)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3 text-success" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleCancelEdit}
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <div className="flex items-center justify-center gap-1 group">
          <span className="text-sm">
            {formatCurrency(director.quarterlyBase)}
          </span>
          
          {/* Ícone de edição - só mostra se canEdit */}
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleStartEdit(director.directorId, director.quarterlyBase)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar valor base</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Ícone de reset - só aparece se canEdit E é valor customizado */}
          {canEdit && isCustom && onResetBase && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onResetBase(director.directorId)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restaurar valor padrão</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[120px] font-semibold">Diretor</TableHead>
            <TableHead className="text-center font-semibold">
              <div className="flex flex-col items-center">
                <span>Base</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Trimestral
                </span>
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">
              <div className="flex flex-col items-center">
                <span>Base</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Anual
                </span>
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">Q1</TableHead>
            <TableHead className="text-center font-semibold">Q2</TableHead>
            <TableHead className="text-center font-semibold">Q3</TableHead>
            <TableHead className="text-center font-semibold">Q4</TableHead>
            <TableHead className="text-center font-semibold">
              <div className="flex flex-col items-center">
                <span>Total</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Real / Prev.
                </span>
              </div>
            </TableHead>
            <TableHead className="text-center font-semibold">
              <div className="flex flex-col items-center">
                <span>Retro.</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Real / Prev.
                </span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {directors.map((director) => (
            <TableRow key={director.directorId} className="hover:bg-muted/20">
              <TableCell className="font-medium">{director.directorName}</TableCell>
              <TableCell className="text-center">
                {renderBaseCell(director)}
              </TableCell>
              <TableCell className="text-center text-sm text-muted-foreground">
                {formatCurrency(director.annualBase)}
              </TableCell>
              <TableCell>
                {renderQuarterCell(director.quarters.q1)}
              </TableCell>
              <TableCell>
                {renderQuarterCell(director.quarters.q2)}
              </TableCell>
              <TableCell>
                {renderQuarterCell(director.quarters.q3)}
              </TableCell>
              <TableCell>
                {renderQuarterCell(director.quarters.q4)}
              </TableCell>
              <TableCell className="text-center">
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">
                    {director.totalPaid > 0 ? formatCurrency(director.totalPaid) : "--"}
                  </div>
                  {director.totalPaidForecast > director.totalPaid && (
                    <div className="text-xs text-primary font-medium">
                      {formatCurrency(director.totalPaidForecast)}
                    </div>
                  )}
                  
                  {/* % da Geração de Caixa - texto simples */}
                  {getAnnualCashGeneration() > 0 && (director.totalPaid > 0 || director.totalPaidForecast > 0) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 cursor-help mt-0.5">
                          {director.totalPaidForecast > director.totalPaid 
                            ? ((director.totalPaidForecast / getAnnualCashGeneration()) * 100).toFixed(2)
                            : ((director.totalPaid / getAnnualCashGeneration()) * 100).toFixed(2)
                          }% Ger. Caixa
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Geração de Caixa Anual: {formatCurrency(getAnnualCashGeneration())}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="space-y-0.5">
                  {director.retroactive > 0 ? (
                    <div className="font-semibold text-success text-sm">
                      {formatCurrency(director.retroactive)}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">--</div>
                  )}
                  {director.retroactiveForecast > 0 && director.retroactiveForecast !== director.retroactive && (
                    <div className="text-xs text-primary font-medium">
                      {formatCurrency(director.retroactiveForecast)}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/50 font-bold">
            <TableCell>TOTAL</TableCell>
            <TableCell className="text-center text-sm">
              {formatCurrency(summary.totalQuarterlyBase)}
            </TableCell>
            <TableCell className="text-center text-sm">
              {formatCurrency(summary.totalAnnualBase)}
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-0.5">
                <div className="text-sm">
                  {getQuarterTotal('q1', 'bonus') > 0
                    ? formatCurrency(getQuarterTotal('q1', 'bonus'))
                    : "--"}
                </div>
                {getQuarterTotal('q1', 'bonusForecast') > getQuarterTotal('q1', 'bonus') && (
                  <div className="text-xs text-primary">
                    {formatCurrency(getQuarterTotal('q1', 'bonusForecast'))}
                  </div>
                )}
                {getQuarterCashGeneration('q1') > 0 && (getQuarterTotal('q1', 'bonus') > 0 || getQuarterTotal('q1', 'bonusForecast') > 0) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 cursor-help">
                        {(((getQuarterTotal('q1', 'bonusForecast') > getQuarterTotal('q1', 'bonus') ? getQuarterTotal('q1', 'bonusForecast') : getQuarterTotal('q1', 'bonus')) / getQuarterCashGeneration('q1')) * 100).toFixed(1)}% Ger. Caixa
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Geração de Caixa Q1: {formatCurrency(getQuarterCashGeneration('q1'))}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-0.5">
                <div className="text-sm">
                  {getQuarterTotal('q2', 'bonus') > 0
                    ? formatCurrency(getQuarterTotal('q2', 'bonus'))
                    : "--"}
                </div>
                {getQuarterTotal('q2', 'bonusForecast') > getQuarterTotal('q2', 'bonus') && (
                  <div className="text-xs text-primary">
                    {formatCurrency(getQuarterTotal('q2', 'bonusForecast'))}
                  </div>
                )}
                {getQuarterCashGeneration('q2') > 0 && (getQuarterTotal('q2', 'bonus') > 0 || getQuarterTotal('q2', 'bonusForecast') > 0) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 cursor-help">
                        {(((getQuarterTotal('q2', 'bonusForecast') > getQuarterTotal('q2', 'bonus') ? getQuarterTotal('q2', 'bonusForecast') : getQuarterTotal('q2', 'bonus')) / getQuarterCashGeneration('q2')) * 100).toFixed(1)}% Ger. Caixa
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Geração de Caixa Q2: {formatCurrency(getQuarterCashGeneration('q2'))}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-0.5">
                <div className="text-sm">
                  {getQuarterTotal('q3', 'bonus') > 0
                    ? formatCurrency(getQuarterTotal('q3', 'bonus'))
                    : "--"}
                </div>
                {getQuarterTotal('q3', 'bonusForecast') > getQuarterTotal('q3', 'bonus') && (
                  <div className="text-xs text-primary">
                    {formatCurrency(getQuarterTotal('q3', 'bonusForecast'))}
                  </div>
                )}
                {getQuarterCashGeneration('q3') > 0 && (getQuarterTotal('q3', 'bonus') > 0 || getQuarterTotal('q3', 'bonusForecast') > 0) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 cursor-help">
                        {(((getQuarterTotal('q3', 'bonusForecast') > getQuarterTotal('q3', 'bonus') ? getQuarterTotal('q3', 'bonusForecast') : getQuarterTotal('q3', 'bonus')) / getQuarterCashGeneration('q3')) * 100).toFixed(1)}% Ger. Caixa
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Geração de Caixa Q3: {formatCurrency(getQuarterCashGeneration('q3'))}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-0.5">
                <div className="text-sm">
                  {getQuarterTotal('q4', 'bonus') > 0
                    ? formatCurrency(getQuarterTotal('q4', 'bonus'))
                    : "--"}
                </div>
                {getQuarterTotal('q4', 'bonusForecast') > getQuarterTotal('q4', 'bonus') && (
                  <div className="text-xs text-primary">
                    {formatCurrency(getQuarterTotal('q4', 'bonusForecast'))}
                  </div>
                )}
                {getQuarterCashGeneration('q4') > 0 && (getQuarterTotal('q4', 'bonus') > 0 || getQuarterTotal('q4', 'bonusForecast') > 0) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 cursor-help">
                        {(((getQuarterTotal('q4', 'bonusForecast') > getQuarterTotal('q4', 'bonus') ? getQuarterTotal('q4', 'bonusForecast') : getQuarterTotal('q4', 'bonus')) / getQuarterCashGeneration('q4')) * 100).toFixed(1)}% Ger. Caixa
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Geração de Caixa Q4: {formatCurrency(getQuarterCashGeneration('q4'))}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-0.5">
                <div className="text-sm">
                  {summary.totalPaid > 0 ? formatCurrency(summary.totalPaid) : "--"}
                </div>
                {summary.totalPaidForecast > summary.totalPaid && (
                  <div className="text-xs text-primary">
                    {formatCurrency(summary.totalPaidForecast)}
                  </div>
                )}
                {/* % da Geração de Caixa Anual - texto simples com destaque */}
                {getAnnualCashGeneration() > 0 && (summary.totalPaid > 0 || summary.totalPaidForecast > 0) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold cursor-help mt-0.5">
                        {summary.totalPaidForecast > summary.totalPaid 
                          ? ((summary.totalPaidForecast / getAnnualCashGeneration()) * 100).toFixed(1)
                          : ((summary.totalPaid / getAnnualCashGeneration()) * 100).toFixed(1)
                        }% Ger. Caixa
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Geração de Caixa Anual: {formatCurrency(getAnnualCashGeneration())}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="space-y-0.5">
                <div className="text-sm text-success">
                  {summary.totalRetroactive > 0
                    ? formatCurrency(summary.totalRetroactive)
                    : "--"}
                </div>
                {summary.totalRetroactiveForecast > 0 && summary.totalRetroactiveForecast !== summary.totalRetroactive && (
                  <div className="text-xs text-primary">
                    {formatCurrency(summary.totalRetroactiveForecast)}
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default BonusTable;
