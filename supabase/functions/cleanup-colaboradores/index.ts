import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verificar se recebeu userIds para exclusão seletiva
    const body = await req.json().catch(() => ({}));
    const { userIds } = body;

    // MODO SELETIVO: deletar apenas os usuários especificados
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      console.log(`Modo seletivo: deletando ${userIds.length} usuários específicos...`);
      
      const deletedUsers: string[] = [];
      const failedUsers: { id: string; error: string }[] = [];

      for (const userId of userIds) {
        if (userId) {
          try {
            const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
            
            if (deleteUserError) {
              console.error(`Erro ao deletar usuário ${userId}:`, deleteUserError);
              failedUsers.push({ id: userId, error: deleteUserError.message });
            } else {
              deletedUsers.push(userId);
              console.log(`Usuário deletado: ${userId}`);
            }
          } catch (err) {
            console.error(`Exceção ao deletar usuário ${userId}:`, err);
            failedUsers.push({ id: userId, error: String(err) });
          }
        }
      }

      const result = {
        success: true,
        mode: 'selective',
        usuariosDeletados: deletedUsers.length,
        falhas: failedUsers,
      };

      console.log('Exclusão seletiva concluída:', result);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // MODO COMPLETO: limpar todos os dados (comportamento original)
    console.log('Modo completo: iniciando limpeza de todos os colaboradores...');

    // 1. Buscar todos os colaboradores
    const { data: colaboradores, error: fetchError } = await supabase
      .from('colaboradores')
      .select('id, user_id, nome, email');

    if (fetchError) {
      console.error('Erro ao buscar colaboradores:', fetchError);
      throw fetchError;
    }

    console.log(`Encontrados ${colaboradores?.length || 0} colaboradores para deletar`);

    // 2. Coletar user_ids para deletar (exceto admin Camila)
    const adminEmail = 'camila.adegas@viverdeia.ai';
    const userIdsToDelete: string[] = [];
    
    for (const colab of colaboradores || []) {
      if (colab.user_id && colab.email?.toLowerCase() !== adminEmail.toLowerCase()) {
        userIdsToDelete.push(colab.user_id);
      }
    }

    // 3. Deletar todos os colaboradores
    const { error: deleteColabError } = await supabase
      .from('colaboradores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteColabError) {
      console.error('Erro ao deletar colaboradores:', deleteColabError);
      throw deleteColabError;
    }

    console.log('Colaboradores deletados da tabela');

    // 4. Buscar usuários criados na importação problemática (01/12/2025)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao listar usuários:', authError);
      throw authError;
    }

    // Filtrar usuários para deletar:
    // - Criados em 01/12/2025 OU estão na lista de user_ids dos colaboradores
    // - NÃO são a Camila admin
    const usersToDelete = authUsers.users.filter(user => {
      if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
        return false; // Preservar Camila
      }
      
      const createdAt = new Date(user.created_at);
      const isFromFailedImport = createdAt >= new Date('2025-12-01') && createdAt < new Date('2025-12-02');
      const isLinkedToColab = userIdsToDelete.includes(user.id);
      
      return isFromFailedImport || isLinkedToColab;
    });

    console.log(`Encontrados ${usersToDelete.length} usuários para deletar`);

    // 5. Deletar usuários de auth.users
    const deletedUsers: string[] = [];
    const failedUsers: { email: string; error: string }[] = [];

    for (const user of usersToDelete) {
      try {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteUserError) {
          console.error(`Erro ao deletar usuário ${user.email}:`, deleteUserError);
          failedUsers.push({ email: user.email || user.id, error: deleteUserError.message });
        } else {
          deletedUsers.push(user.email || user.id);
          console.log(`Usuário deletado: ${user.email}`);
        }
      } catch (err) {
        console.error(`Exceção ao deletar usuário ${user.email}:`, err);
        failedUsers.push({ email: user.email || user.id, error: String(err) });
      }
    }

    const result = {
      success: true,
      mode: 'complete',
      colaboradoresDeletados: colaboradores?.length || 0,
      usuariosDeletados: deletedUsers.length,
      usuariosPreservados: ['camila.adegas@viverdeia.ai'],
      falhas: failedUsers,
      detalhes: {
        deletedUsers,
        failedUsers
      }
    };

    console.log('Limpeza concluída:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro na limpeza:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
