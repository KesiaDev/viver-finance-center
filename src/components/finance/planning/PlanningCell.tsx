import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PlanningCellProps {
  value: number;
  field: string;
  monthStr: string;
  isEditable: boolean;
  isLocked?: boolean;
  colorClass?: string;
  onSave: (field: string, value: number) => void;
  formatValue?: (value: number) => string;
}

export function PlanningCell({
  value,
  field,
  monthStr,
  isEditable,
  isLocked = false,
  colorClass = "",
  onSave,
  formatValue,
}: PlanningCellProps) {
  const { canEditFinance } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || 0));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(String(value || 0));
  }, [value]);

  const handleClick = () => {
    // Verificar permissão de edição
    if (isEditable && !isLocked && canEditFinance) {
      setIsEditing(true);
      setEditValue(String(value || 0));
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue.replace(/[^\d.-]/g, '')) || 0;
    onSave(field, numValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(String(value || 0));
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const displayValue = formatValue 
    ? formatValue(value) 
    : new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-7 w-24 text-right text-xs px-1 border-primary"
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "text-right text-xs font-medium whitespace-nowrap",
        colorClass,
        isEditable && !isLocked && canEditFinance && "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors",
        !isEditable && "opacity-90"
      )}
    >
      {isLocked && (
        <Lock className="inline-block h-3 w-3 mr-1 text-muted-foreground" />
      )}
      {displayValue}
    </div>
  );
}
