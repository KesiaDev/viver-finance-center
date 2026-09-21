import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type ApprovalCategory = 'notas' | 'reembolsos' | 'devolucoes' | 'materiais';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  hasFinanceAccess: boolean;
  hasFinanceViewOnly: boolean;
  hasAdminViewOnly: boolean;
  canEditFinance: boolean;
  canEditAdmin: boolean;
  approvalPermissions: ApprovalCategory[];
  hasApprovalAccess: boolean;
  canApprove: (category: ApprovalCategory) => boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  hasFinanceAccess: false,
  hasFinanceViewOnly: false,
  hasAdminViewOnly: false,
  canEditFinance: false,
  canEditAdmin: false,
  approvalPermissions: [],
  hasApprovalAccess: false,
  canApprove: () => false,
  loading: true,
  signOut: async () => {},
  refreshRoles: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasFinanceAccess, setHasFinanceAccess] = useState(false);
  const [hasFinanceViewOnly, setHasFinanceViewOnly] = useState(false);
  const [hasAdminViewOnly, setHasAdminViewOnly] = useState(false);
  const [canEditFinance, setCanEditFinance] = useState(false);
  const [canEditAdmin, setCanEditAdmin] = useState(false);
  const [approvalPermissions, setApprovalPermissions] = useState<ApprovalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Mapeamento de roles para categorias de aprovação
  const roleToCategory: Record<string, ApprovalCategory> = {
    'approver_notas': 'notas',
    'approver_reembolsos': 'reembolsos',
    'approver_devolucoes': 'devolucoes',
    'approver_materiais': 'materiais',
  };

  const allApprovalCategories: ApprovalCategory[] = ['notas', 'reembolsos', 'devolucoes', 'materiais'];

  const checkUserRoles = async (userId: string) => {
    try {
      console.log('🔍 [AuthContext] Iniciando verificação de roles para userId:', userId);
      
      // Query direta na tabela user_roles
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      console.log('📊 [AuthContext] Resposta da query user_roles:', { 
        userId,
        data, 
        error,
        dataLength: data?.length || 0
      });
      
      if (error) {
        console.error('❌ [AuthContext] Erro ao buscar roles:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        resetRoles();
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [AuthContext] Nenhuma role encontrada para o usuário:', userId);
        resetRoles();
        return;
      }

      const roles = data.map(r => r.role as string);
      console.log('📋 [AuthContext] Roles do usuário:', roles);
      
      const adminStatus = roles.includes("admin");
      const financeStatus = roles.includes("finance");
      const financeViewerStatus = roles.includes("finance_viewer");
      const adminViewerStatus = roles.includes("admin_viewer");
      
      // View-only: tem viewer mas NÃO tem a role completa
      const financeViewOnly = financeViewerStatus && !financeStatus && !adminStatus;
      const adminViewOnly = adminViewerStatus && !adminStatus;
      
      // Pode editar: tem a role completa (finance/admin vence viewer)
      const editFinance = financeStatus || adminStatus;
      const editAdmin = adminStatus;
      
      // Calcular permissões de aprovação granulares
      let approvalPerms: ApprovalCategory[] = [];
      if (adminStatus || adminViewerStatus) {
        // Admin e admin_viewer têm acesso a todas as categorias
        approvalPerms = [...allApprovalCategories];
      } else {
        // Verificar roles específicas de aprovação
        approvalPerms = roles
          .filter(role => role in roleToCategory)
          .map(role => roleToCategory[role]);
      }
      
      console.log('✅ [AuthContext] Status calculado:', { 
        userId,
        roles,
        isAdmin: adminStatus, 
        hasFinanceAccess: financeStatus || adminStatus,
        hasFinanceViewOnly: financeViewOnly,
        hasAdminViewOnly: adminViewOnly,
        canEditFinance: editFinance,
        canEditAdmin: editAdmin,
        approvalPermissions: approvalPerms
      });
      
      setIsAdmin(adminStatus);
      setHasFinanceAccess(financeStatus || adminStatus);
      setHasFinanceViewOnly(financeViewOnly);
      setHasAdminViewOnly(adminViewOnly);
      setCanEditFinance(editFinance);
      setCanEditAdmin(editAdmin);
      setApprovalPermissions(approvalPerms);
    } catch (error: any) {
      console.error('❌ [AuthContext] Exceção ao verificar roles:', {
        message: error?.message,
        stack: error?.stack
      });
      resetRoles();
    } finally {
      setLoading(false);
    }
  };

  const resetRoles = () => {
    setIsAdmin(false);
    setHasFinanceAccess(false);
    setHasFinanceViewOnly(false);
    setHasAdminViewOnly(false);
    setCanEditFinance(false);
    setCanEditAdmin(false);
    setApprovalPermissions([]);
  };

  const hasApprovalAccess = approvalPermissions.length > 0;
  
  const canApprove = (category: ApprovalCategory): boolean => {
    if (isAdmin) return true;
    return approvalPermissions.includes(category);
  };

  const refreshRoles = async () => {
    if (user?.id) {
      console.log('🔄 [AuthContext] Refresh de roles solicitado');
      setLoading(true);
      await checkUserRoles(user.id);
    }
  };

  useEffect(() => {
    console.log('🚀 [AuthContext] Inicializando AuthProvider');
    
    // Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 [AuthContext] Auth state changed:', { 
          event, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        
        // Interceptar evento de recuperação de senha
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔑 [AuthContext] PASSWORD_RECOVERY detectado, redirecionando...');
          window.location.href = '/reset-password';
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            checkUserRoles(session.user.id);
          }, 0);
        } else {
          console.log('👤 [AuthContext] Usuário deslogado, resetando estados');
          resetRoles();
          setLoading(false);
        }
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📦 [AuthContext] Sessão existente:', { 
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 [AuthContext] Cleanup - unsubscribe');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🚪 [AuthContext] SignOut iniciado');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    resetRoles();
  };

  // Log do estado atual para debugging
  useEffect(() => {
    console.log('📊 [AuthContext] Estado atual:', {
      userId: user?.id,
      email: user?.email,
      isAdmin,
      hasFinanceAccess,
      hasFinanceViewOnly,
      hasAdminViewOnly,
      canEditFinance,
      canEditAdmin,
      approvalPermissions,
      hasApprovalAccess,
      loading
    });
  }, [user, isAdmin, hasFinanceAccess, hasFinanceViewOnly, hasAdminViewOnly, canEditFinance, canEditAdmin, approvalPermissions, hasApprovalAccess, loading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAdmin, 
      hasFinanceAccess,
      hasFinanceViewOnly,
      hasAdminViewOnly,
      canEditFinance,
      canEditAdmin,
      approvalPermissions,
      hasApprovalAccess,
      canApprove,
      loading, 
      signOut,
      refreshRoles 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
