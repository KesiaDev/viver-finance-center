import { cn } from "@/lib/utils";
import llmidaLogo from "@/assets/llmida-logo-white.png";

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
      src={llmidaLogo} 
      alt="LLMIDA Central Financeira" 
      className={cn(sizeClasses[size], "w-auto", className)}
      loading="lazy"
    />
  );
};
