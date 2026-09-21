import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDashboardStats = () => {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id, isAdmin],
    queryFn: async () => {
      // Define a query base
      let reembolsosQuery = supabase.from("reembolsos").select("valor, status");
      let devolucoesQuery = supabase.from("devolucoes").select("valor, status");
      let notasQuery = supabase.from("notas_fiscais").select("valor, status");

      // Se não for admin, filtrar apenas do usuário
      if (!isAdmin && user) {
        reembolsosQuery = reembolsosQuery.eq("user_id", user.id);
        devolucoesQuery = devolucoesQuery.eq("user_id", user.id);
        notasQuery = notasQuery.eq("user_id", user.id);
      }

      // Buscar todas as solicitações
      const [reembolsosRes, devolucoesRes, notasRes] = await Promise.all([
        reembolsosQuery,
        devolucoesQuery,
        notasQuery,
      ]);

      const todasSolicitacoes = [
        ...(reembolsosRes.data || []),
        ...(devolucoesRes.data || []),
        ...(notasRes.data || []),
      ];

      // Calcular estatísticas
      const pendentes = todasSolicitacoes.filter(s => s.status === 'pendente').length;
      const aprovadas = todasSolicitacoes.filter(s => s.status === 'aprovado').length;
      
      const valorTotal = todasSolicitacoes
        .filter(s => s.status === 'aprovado')
        .reduce((sum, s) => sum + parseFloat(s.valor?.toString() || '0'), 0);

      return {
        pendentes,
        aprovadas,
        valorTotal: new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(valorTotal),
        prazoNF: "Dia 25",
      };
    },
    enabled: !!user,
  });

  return { stats, isLoading };
};
