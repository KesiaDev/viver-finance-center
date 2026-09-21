import { LogOut, User, LogIn, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Brand/Logo";
import { NotificationsDropdown } from "./NotificationsDropdown";

export const Header = () => {
  const { user, isAdmin, hasFinanceViewOnly, hasAdminViewOnly, signOut } = useAuth();
  const isViewOnlyMode = hasFinanceViewOnly || hasAdminViewOnly;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b border-border/50 bg-card/80 shadow-card sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="h-6 w-px bg-border/50" />
            <p className="text-sm text-muted-foreground tracking-wide">Central Financeira</p>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.email}</span>
                {isAdmin && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-medium">Admin</span>}
                {isViewOnlyMode && (
                  <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-1 rounded font-medium">
                    <Eye className="w-3 h-3" />
                    Somente Leitura
                  </span>
                )}
              </div>
              <NotificationsDropdown />
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border/50 hover:border-primary hover:text-primary">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate("/auth")} className="gap-2">
              <LogIn className="w-4 h-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
