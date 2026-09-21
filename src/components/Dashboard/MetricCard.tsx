import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  colorClass?: string;
  size?: "sm" | "md" | "lg";
}

export const MetricCard = ({ 
  label, 
  value, 
  sublabel, 
  colorClass = "text-primary", 
  size = "md" 
}: MetricCardProps) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl"
  };
  
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className={cn("font-bold", sizeClasses[size], colorClass)}>{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
};
