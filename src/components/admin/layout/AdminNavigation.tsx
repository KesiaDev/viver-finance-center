import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CheckCircle, Users, Monitor, Zap, Wrench, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

const allAdminNavItems = [
  { icon: CheckCircle, label: "Aprovações", path: "/admin/aprovacoes", requiresFullAdmin: false },
  { icon: Users, label: "Colaboradores", path: "/admin/colaboradores", requiresFullAdmin: true },
  { icon: Monitor, label: "Equipamentos", path: "/admin/equipamentos", requiresFullAdmin: true },
  { icon: Zap, label: "Automações", path: "/admin/automacoes", requiresFullAdmin: true },
  { icon: Wrench, label: "Ferramentas", path: "/admin/ferramentas", requiresFullAdmin: true },
  { icon: FileText, label: "Modelos", path: "/admin/modelos-contrato", requiresFullAdmin: true },
];

export const AdminNavigation = () => {
  const location = useLocation();
  const { isAdmin, hasAdminViewOnly, hasApprovalAccess } = useAuth();

  // Filtrar itens de navegação baseado nas permissões
  const visibleNavItems = useMemo(() => {
    // Admin completo ou viewer admin vê tudo
    if (isAdmin || hasAdminViewOnly) {
      return allAdminNavItems;
    }
    
    // Aprovadores específicos veem apenas "Aprovações"
    if (hasApprovalAccess) {
      return allAdminNavItems.filter(item => !item.requiresFullAdmin);
    }
    
    return [];
  }, [isAdmin, hasAdminViewOnly, hasApprovalAccess]);

  return (
    <nav className="bg-muted/50 border-b border-subtle">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all whitespace-nowrap rounded-md",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
