import { FileText, Receipt, Info, Shield, DollarSign } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: Info, label: "Instruções", path: "/" },
  { icon: FileText, label: "Solicitações", path: "/solicitacoes" },
  { icon: Receipt, label: "Notas Fiscais", path: "/notas-fiscais" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro", financeOnly: true },
  { icon: Shield, label: "Admin", path: "/admin", adminOnly: true },
];

export const Navigation = () => {
  const location = useLocation();
  const { isAdmin, hasFinanceAccess, hasFinanceViewOnly, hasAdminViewOnly, hasApprovalAccess } = useAuth();

  return (
    <nav className="bg-card border-b border-subtle shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            // Admin: mostrar para admins, viewers de admin, ou aprovadores específicos
            if (item.adminOnly && !isAdmin && !hasAdminViewOnly && !hasApprovalAccess) return null;
            
            // Financeiro: mostrar para quem tem acesso financeiro ou visualização
            if (item.financeOnly && !hasFinanceAccess && !hasFinanceViewOnly) return null;
            
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap relative",
                  isActive
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
