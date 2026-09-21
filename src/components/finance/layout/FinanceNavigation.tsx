import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FileSpreadsheet,
  BarChart3,
  Calculator,
  Target,
  Award,
  CreditCard,
  Bug,
  Scale,
} from "lucide-react";
import { useLegacyIntegrations } from "@/hooks/useLegacyIntegrations";

const financeNavItems = [
  { icon: Calculator, label: "Impostos", path: "/financeiro/impostos" },
  { icon: FileSpreadsheet, label: "Planejamento", path: "/financeiro/planejamento" },
  
  { icon: BarChart3, label: "Análise Financeira", path: "/financeiro/analise-financeira" },
  { icon: Target, label: "Metas de Vendas", path: "/financeiro/metas-vendas" },
  { icon: Award, label: "Bônus", path: "/financeiro/bonus" },
  
  { icon: CreditCard, label: "Parcelamento Inteligente", path: "/financeiro/parcelamento" },
  { icon: Scale, label: "Receitas e Despesas", path: "/financeiro/orcado-realizado" },
  { icon: Bug, label: "API Marvee", path: "/financeiro/marvee-test", legacyOnly: true },
];

export const FinanceNavigation = () => {
  const location = useLocation();
  const { legacyIntegrationsEnabled } = useLegacyIntegrations();

  return (
    <nav className="bg-muted/50 border-b border-subtle">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-1">
          {financeNavItems.map((item) => {
            if (item.legacyOnly && !legacyIntegrationsEnabled) return null;

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
