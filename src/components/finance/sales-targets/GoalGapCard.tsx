import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Target, TrendingUp, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/taxCalculations";

interface MonthRowData {
  month: string;
  monthLabel: string;
  type: 'past' | 'current' | 'future';
  target: number;
  totalEntry: number;
  // Campos para cálculo de Meta e Atingido
  cashAmount: number;
  recurringAccumulated: number;
  achievedRevenue: number;
  salesAchieved?: number; // Vendas manuais do mês
}

interface GoalGapCardProps {
  monthsData: MonthRowData[];
  selectedYear: string;
  onSalesAchievedChange?: (month: string, value: number) => void;
  canEdit?: boolean;
}

interface GapData {
  id: string;
  label: string;
  target: number;
  achieved: number;
  gap: number;
  percentage: number;
  isFuture: boolean;
}

export const GoalGapCard = ({ monthsData, selectedYear, onSalesAchievedChange, canEdit = true }: GoalGapCardProps) => {
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Mês atual
  // Meta = À Vista + Recorrente Acumulado
  // Atingido = Vendas manuais (salesAchieved) ou Receita Realizada como fallback
  const currentMonth = useMemo((): (GapData & { month: string; salesAchieved?: number }) | null => {
    const current = monthsData.find(m => m.type === 'current');
    if (!current) return null;
    
    // Meta = À Vista + Recorrente Acumulado
    const target = current.cashAmount + current.recurringAccumulated;
    // Atingido = Vendas manuais do mês (se preenchido) ou receita realizada
    const achieved = current.salesAchieved ?? current.achievedRevenue;
    
    const gap = target - achieved;
    const percentage = target > 0 ? (achieved / target) * 100 : 0;
    
    return {
      id: 'current',
      label: current.monthLabel.toUpperCase(),
      target,
      achieved,
      gap: Math.max(0, gap),
      percentage: Math.min(percentage, 100),
      isFuture: false,
      month: current.month,
      salesAchieved: current.salesAchieved,
    };
  }, [monthsData]);

  const handleStartEdit = (month: string, currentValue: number) => {
    setEditingMonth(month);
    setEditValue(currentValue > 0 ? currentValue.toString() : "");
  };

  const handleSaveEdit = () => {
    if (editingMonth && onSalesAchievedChange) {
      const numValue = parseFloat(editValue.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      onSalesAchievedChange(editingMonth, numValue);
    }
    setEditingMonth(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingMonth(null);
      setEditValue("");
    }
  };

  // Trimestres
  // Meta = Soma de (À Vista + Recorrente) de cada mês
  // Atingido = Soma de Receita Realizada de cada mês
  const quarters = useMemo((): GapData[] => {
    const quarterConfig = [
      { id: 'Q1', label: 'Q1', months: ['01', '02', '03'] },
      { id: 'Q2', label: 'Q2', months: ['04', '05', '06'] },
      { id: 'Q3', label: 'Q3', months: ['07', '08', '09'] },
      { id: 'Q4', label: 'Q4', months: ['10', '11', '12'] },
    ];

    return quarterConfig.map(q => {
      const quarterMonths = monthsData.filter(m => 
        q.months.includes(m.month.split('-')[1])
      );
      
      // Meta = Soma de (À Vista + Recorrente Acumulado) de cada mês
      const totalTarget = quarterMonths.reduce((acc, m) => acc + m.cashAmount + m.recurringAccumulated, 0);
      // Atingido = Soma de (salesAchieved ?? achievedRevenue) de cada mês
      const totalAchieved = quarterMonths.reduce((acc, m) => acc + (m.salesAchieved ?? m.achievedRevenue), 0);
      const gap = totalTarget - totalAchieved;
      const percentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
      const isFuture = quarterMonths.every(m => m.type === 'future');
      
      return {
        id: q.id,
        label: q.label,
        target: totalTarget,
        achieved: totalAchieved,
        gap: Math.max(0, gap),
        percentage: Math.min(percentage, 100),
        isFuture,
      };
    });
  }, [monthsData]);

  // Ano completo
  // Meta = Soma de (À Vista + Recorrente) de todos os meses
  // Atingido = Soma de Receita Realizada de todos os meses
  const yearTotal = useMemo((): GapData => {
    // Meta = Soma de (À Vista + Recorrente Acumulado) de todos os meses
    const totalTarget = monthsData.reduce((acc, m) => acc + m.cashAmount + m.recurringAccumulated, 0);
    // Atingido = Soma de (salesAchieved ?? achievedRevenue) de todos os meses
    const totalAchieved = monthsData.reduce((acc, m) => acc + (m.salesAchieved ?? m.achievedRevenue), 0);
    const gap = totalTarget - totalAchieved;
    const percentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    
    return {
      id: 'year',
      label: selectedYear,
      target: totalTarget,
      achieved: totalAchieved,
      gap: Math.max(0, gap),
      percentage: Math.min(percentage, 100),
      isFuture: false,
    };
  }, [monthsData, selectedYear]);

  const getStatusColor = (gap: number, percentage: number, isFuture: boolean) => {
    if (isFuture) return 'text-muted-foreground';
    if (gap <= 0) return 'text-green-500';
    if (percentage >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number, isFuture: boolean) => {
    if (isFuture) return '[&>div]:bg-muted-foreground/50';
    if (percentage >= 100) return '[&>div]:bg-green-500';
    if (percentage >= 80) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  };

  const renderGapItem = (data: GapData & { month?: string; salesAchieved?: number }, isLarge: boolean = false, isEditable: boolean = false) => {
    const statusColor = getStatusColor(data.gap, data.percentage, data.isFuture);
    const progressColor = getProgressColor(data.percentage, data.isFuture);
    const isAchieved = data.gap <= 0 && !data.isFuture;
    // Só permite edição se canEdit for true E isEditable for true
    const actuallyEditable = isEditable && canEdit;
    const isCurrentlyEditing = actuallyEditable && editingMonth === data.month;

    return (
      <div 
        key={data.id}
        className={cn(
          "flex flex-col p-3 rounded-lg border bg-card",
          isLarge ? "col-span-full md:col-span-2" : "",
          isAchieved && "bg-green-500/10 border-green-500/30"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "font-semibold text-sm",
            isLarge ? "text-base" : ""
          )}>
            {data.label}
          </span>
          {isAchieved ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : data.isFuture ? (
            <Target className="h-4 w-4 text-muted-foreground" />
          ) : (
            <AlertTriangle className={cn("h-4 w-4", statusColor)} />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
            <div className="flex justify-between">
              <span>Meta:</span>
              <span>{formatCurrency(data.target)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Atingido:</span>
              {actuallyEditable && onSalesAchievedChange ? (
                isCurrentlyEditing ? (
                  <Input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    className="h-5 w-24 text-xs text-right px-1"
                    autoFocus
                    placeholder="0,00"
                  />
                ) : (
                  <button
                    onClick={() => handleStartEdit(data.month!, data.salesAchieved ?? data.achieved)}
                    className="flex items-center gap-1 hover:text-primary transition-colors group"
                    title="Clique para editar as vendas do mês"
                  >
                    <span>{formatCurrency(data.achieved)}</span>
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )
              ) : (
                <span>{formatCurrency(data.achieved)}</span>
              )}
            </div>
          </div>

          <Progress 
            value={data.percentage} 
            className={cn("h-2", progressColor)}
          />

          <div className={cn("text-center font-bold", statusColor)}>
            {isAchieved ? (
              <span className="text-green-500 flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Meta atingida!
              </span>
            ) : data.isFuture ? (
              <span className="text-muted-foreground text-sm">
                Falta: {formatCurrency(data.gap)}
              </span>
            ) : (
              <span>
                Falta: {formatCurrency(data.gap)}
              </span>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}% atingido
          </div>
        </div>
      </div>
    );
  };

  if (!monthsData.length) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5" />
          Quanto Falta para a Meta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Mês Atual - Editável */}
          {currentMonth && renderGapItem(currentMonth, false, true)}

          {/* Trimestres */}
          {quarters.map(q => renderGapItem(q))}

          {/* Ano */}
          {renderGapItem(yearTotal, true)}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalGapCard;
