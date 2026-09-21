import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  variant?: "default" | "success" | "warning";
}

export const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  link,
  variant = "default" 
}: QuickActionCardProps) => {
  const colorClasses = {
    default: "gradient-cyan",
    success: "bg-neonGreen",
    warning: "bg-orange",
  };

  return (
    <Card className="group hover:shadow-card-hover transition-all duration-300 hover:border-primary/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${colorClasses[variant]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Link to={link}>
              <Button variant="ghost" size="sm" className="gap-2 px-0 hover:gap-3 transition-all text-primary hover:text-primary">
                Acessar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
