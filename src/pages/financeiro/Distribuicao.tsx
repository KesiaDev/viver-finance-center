import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { UnderConstructionBanner } from "@/components/ui/under-construction-banner";

const Distribuicao = () => {
  return (
    <div className="space-y-6">
      <UnderConstructionBanner />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Distribuição de Lucros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Gerencie a distribuição de lucros.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Distribuicao;
