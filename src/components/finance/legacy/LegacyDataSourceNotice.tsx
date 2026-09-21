import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface LegacyDataSourceNoticeProps {
  className?: string;
}

/**
 * Aviso exibido nas páginas que dependiam das integrações legadas
 * (Hubla / Marvee / Metabase) enquanto a fonte de dados é migrada.
 */
export const LegacyDataSourceNotice = ({ className }: LegacyDataSourceNoticeProps) => (
  <Alert className={className}>
    <Info className="h-4 w-4" />
    <AlertTitle>Fonte de dados em migração</AlertTitle>
    <AlertDescription>
      Fonte de dados em migração para Hotmart/Wise.
    </AlertDescription>
  </Alert>
);
