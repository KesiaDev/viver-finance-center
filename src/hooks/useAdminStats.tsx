import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  count: number;
  total: number;
}

interface CategoryStats {
  pendentes: Stats;
  aprovadas: Stats;
  rejeitadas: Stats;
}

interface GenericStats {
  pendentes: { count: number };
  aprovadas: { count: number };
  rejeitadas: { count: number };
}

interface NotaFiscalMes {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  valor: number;
  created_at: string;
  periodo_referencia: string;
}

export interface AdminStatsData {
  reembolsos: CategoryStats;
  devolucoes: CategoryStats;
  materiais: GenericStats;
  notasFiscais: CategoryStats;
  notasFiscaisMes: NotaFiscalMes[];
}

const calcularStats = (items: any[]): CategoryStats => {
  return {
    pendentes: {
      count: items.filter(i => i.status === 'pendente').length,
      total: items
        .filter(i => i.status === 'pendente')
        .reduce((sum, i) => sum + Number(i.valor), 0)
    },
    aprovadas: {
      count: items.filter(i => i.status === 'aprovado').length,
      total: items
        .filter(i => i.status === 'aprovado')
        .reduce((sum, i) => sum + Number(i.valor), 0)
    },
    rejeitadas: {
      count: items.filter(i => i.status === 'rejeitado').length,
      total: items
        .filter(i => i.status === 'rejeitado')
        .reduce((sum, i) => sum + Number(i.valor), 0)
    }
  };
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Buscar reembolsos
      const { data: reembolsos, error: reembolsosError } = await supabase
        .from("reembolsos")
        .select("status, valor");

      if (reembolsosError) throw reembolsosError;

      // Buscar devoluções
      const { data: devolucoes, error: devolucoesError } = await supabase
        .from("devolucoes")
        .select("status, valor");

      if (devolucoesError) throw devolucoesError;

      // Buscar notas fiscais do mês atual via RPC
      const { data: notasFiscaisMes, error: notasError } = await supabase
        .rpc('get_notas_fiscais_mes');

      if (notasError) throw notasError;

      // Buscar todas as notas fiscais para estatísticas
      const { data: notasFiscais, error: notasFiscaisError } = await supabase
        .from("notas_fiscais")
        .select("status, valor");

      if (notasFiscaisError) throw notasFiscaisError;

      // Buscar materiais
      const { data: materiais, error: materiaisError } = await supabase
        .from("materiais")
        .select("status");

      if (materiaisError) throw materiaisError;

      const materiaisStats: GenericStats = {
        pendentes: {
          count: materiais?.filter(m => m.status === 'pendente').length || 0,
        },
        aprovadas: {
          count: materiais?.filter(m => m.status === 'aprovado').length || 0,
        },
        rejeitadas: {
          count: materiais?.filter(m => m.status === 'rejeitado').length || 0,
        }
      };

      const stats: AdminStatsData = {
        reembolsos: calcularStats(reembolsos || []),
        devolucoes: calcularStats(devolucoes || []),
        materiais: materiaisStats,
        notasFiscais: calcularStats(notasFiscais || []),
        notasFiscaisMes: notasFiscaisMes || []
      };

      return stats;
    }
  });
};