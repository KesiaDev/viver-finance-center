import { cn } from "@/lib/utils";
import viverDeIaLogo from "@/assets/viver-de-ia-logo-white.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <img 
      src={viverDeIaLogo} 
      alt="Viver de IA" 
      className={cn(sizeClasses[size], "w-auto", className)}
    />
  );
};
