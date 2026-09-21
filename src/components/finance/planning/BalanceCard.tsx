import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BalanceCardProps {
  label: string;
  value: number;
  colorClass?: string;
  editable?: boolean;
  onSave?: (value: number) => void;
  isLoading?: boolean;
}

export function BalanceCard({
  label,
  value,
  colorClass = "text-primary",
  editable = false,
  onSave,
  isLoading = false,
}: BalanceCardProps) {
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
    if (editable && canEditFinance && !isLoading) {
      setIsEditing(true);
      setEditValue(String(value || 0));
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue.replace(/[^\d.-]/g, '')) || 0;
    onSave?.(numValue);
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {isEditing ? (
        <Input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-8 text-lg font-bold px-2 border-primary"
        />
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "text-lg font-bold",
            colorClass,
            editable && canEditFinance && "cursor-pointer hover:opacity-80 transition-opacity",
            isLoading && "opacity-50"
          )}
        >
          {formatCurrency(value)}
        </div>
      )}
    </div>
  );
}
