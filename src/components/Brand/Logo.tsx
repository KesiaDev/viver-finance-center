import { cn } from "@/lib/utils";
import llmidiaLogo from "@/assets/llmidia-logo-white.png";

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
      src={llmidiaLogo} 
      alt="LLMIDIA Central Financeira" 
      className={cn(sizeClasses[size], "w-auto", className)}
      loading="lazy"
      width={1920}
      height={960}
    />
  );
};
