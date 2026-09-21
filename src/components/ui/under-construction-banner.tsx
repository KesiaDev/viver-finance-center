import { Construction } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const UnderConstructionBanner = () => {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <Construction className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-600 dark:text-amber-400">Em Construção</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Esta funcionalidade ainda está em desenvolvimento. Algumas features podem estar incompletas ou sujeitas a alterações.
      </AlertDescription>
    </Alert>
  );
};
