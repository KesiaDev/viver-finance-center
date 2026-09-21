import { ReactNode } from "react";
import { useLegacyIntegrations } from "@/hooks/useLegacyIntegrations";
import { LegacyDataSourceNotice } from "@/components/finance/legacy/LegacyDataSourceNotice";
import { Skeleton } from "@/components/ui/skeleton";

interface LegacyIntegrationGuardProps {
  children: ReactNode;
}

/**
 * Bloqueia rotas de integrações legadas (Hubla / Marvee / Metabase)
 * enquanto a flag "legacy_integrations_enabled" estiver desligada.
 */
export const LegacyIntegrationGuard = ({ children }: LegacyIntegrationGuardProps) => {
  const { legacyIntegrationsEnabled, isLoading } = useLegacyIntegrations();

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!legacyIntegrationsEnabled) {
    return <LegacyDataSourceNotice />;
  }

  return <>{children}</>;
};
