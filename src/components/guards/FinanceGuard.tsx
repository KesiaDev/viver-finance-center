import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinanceGuardProps {
  children: ReactNode;
}

export const FinanceGuard = ({ children }: FinanceGuardProps) => {
  const { user, loading, isAdmin, hasFinanceAccess, hasFinanceViewOnly } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Permitir acesso se tem qualquer permissão financeira
  if (!hasFinanceAccess && !hasFinanceViewOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar o módulo financeiro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasFinanceViewOnly && (
        <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
          <Eye className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-500">
            Você está visualizando o módulo financeiro em modo somente leitura.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
};
