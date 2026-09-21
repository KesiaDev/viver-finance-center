import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
}

export const InfoCard = ({ icon: Icon, title, description, iconColor = "text-primary" }: InfoCardProps) => {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-lg bg-accent", iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

import { cn } from "@/lib/utils";
