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
    
    // Cliente com service role para operações admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Extrair token do cabeçalho Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Usuário autenticado: ${user.email} (${user.id})`);

    // Verificar se o chamador é admin
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Erro ao verificar role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!callerRole) {
      console.log(`Usuário ${user.email} não é admin, acesso negado`);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem alterar permissões.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`Admin verificado: ${user.email}`);

    // Processar requisição
    const { target_user_id, action } = await req.json();

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário alvo não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!action || !['add', 'remove'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Ação inválida. Use "add" ou "remove"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Ação: ${action} admin para user_id: ${target_user_id}`);

    if (action === 'add') {
      // Adicionar role admin
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: target_user_id,
          role: 'admin',
        }, {
          onConflict: 'user_id,role'
        });

      if (insertError) {
        console.error('Erro ao adicionar role:', insertError);
        return new Response(
          JSON.stringify({ error: `Erro ao adicionar role: ${insertError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Atualizar is_admin na tabela colaboradores
      await supabaseAdmin
        .from('colaboradores')
        .update({ is_admin: true })
        .eq('user_id', target_user_id);

      console.log(`Role admin adicionada para ${target_user_id}`);

    } else {
      // Remover role admin
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', target_user_id)
        .eq('role', 'admin');

      if (deleteError) {
        console.error('Erro ao remover role:', deleteError);
        return new Response(
          JSON.stringify({ error: `Erro ao remover role: ${deleteError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Atualizar is_admin na tabela colaboradores
      await supabaseAdmin
        .from('colaboradores')
        .update({ is_admin: false })
        .eq('user_id', target_user_id);

      console.log(`Role admin removida para ${target_user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: action === 'add' ? 'Permissão de admin concedida' : 'Permissão de admin removida' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
