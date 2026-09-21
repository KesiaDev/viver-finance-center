import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to check permissions
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user has admin role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (roleError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action, job_name, schedule, config } = body;

    console.log(`Managing automation: action=${action}, job_name=${job_name}`);

    // Create service role client for cron operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'pause': {
        // Update cron job to inactive
        const { error: cronError } = await supabaseAdmin.rpc('update_cron_job_status', {
          p_job_name: job_name,
          p_active: false
        }).maybeSingle();

        // Even if cron update fails (might not exist yet), update our config table
        const { error: configError } = await supabaseAdmin
          .from('automation_config')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('job_name', job_name);

        if (configError) {
          console.error('Error updating config:', configError);
          throw configError;
        }

        console.log(`Paused automation: ${job_name}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Automação pausada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'activate': {
        // Get the automation config
        const { data: automationData, error: fetchError } = await supabaseAdmin
          .from('automation_config')
          .select('*')
          .eq('job_name', job_name)
          .single();

        if (fetchError || !automationData) {
          throw new Error('Automação não encontrada');
        }

        // Update our config table
        const { error: configError } = await supabaseAdmin
          .from('automation_config')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('job_name', job_name);

        if (configError) {
          console.error('Error updating config:', configError);
          throw configError;
        }

        console.log(`Activated automation: ${job_name}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Automação ativada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_schedule': {
        if (!schedule) {
          throw new Error('Schedule is required');
        }

        // Get the automation config
        const { data: automationData, error: fetchError } = await supabaseAdmin
          .from('automation_config')
          .select('*')
          .eq('job_name', job_name)
          .single();

        if (fetchError || !automationData) {
          throw new Error('Automação não encontrada');
        }

        // Update the actual cron job schedule in pg_cron using the new RPC function
        const { data: cronSuccess, error: cronError } = await supabaseAdmin.rpc('update_cron_schedule', {
          p_job_name: job_name,
          p_schedule: schedule
        });

        if (cronError) {
          console.error('Failed to update pg_cron schedule:', cronError.message);
          throw new Error('Falha ao atualizar agendamento no pg_cron. Tente novamente.');
        }

        if (!cronSuccess) {
          console.error('pg_cron job not found:', job_name);
          throw new Error(`Job "${job_name}" não encontrado no pg_cron.`);
        }

        // Update the schedule in config table
        const { error: configError } = await supabaseAdmin
          .from('automation_config')
          .update({ schedule, updated_at: new Date().toISOString() })
          .eq('job_name', job_name);

        if (configError) {
          console.error('Error updating config:', configError);
          throw configError;
        }

        console.log(`Updated schedule for ${job_name}: ${schedule} (pg_cron synced: true)`);
        return new Response(
          JSON.stringify({ success: true, message: 'Horário atualizado', cron_synced: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_config': {
        if (!config) {
          throw new Error('Config is required');
        }

        // Update the config
        const { error: configError } = await supabaseAdmin
          .from('automation_config')
          .update({ config, updated_at: new Date().toISOString() })
          .eq('job_name', job_name);

        if (configError) {
          console.error('Error updating config:', configError);
          throw configError;
        }

        console.log(`Updated config for ${job_name}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Configuração atualizada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'execute_now': {
        // Get the automation config
        const { data: automationData, error: fetchError } = await supabaseAdmin
          .from('automation_config')
          .select('*')
          .eq('job_name', job_name)
          .single();

        if (fetchError || !automationData) {
          throw new Error('Automação não encontrada');
        }

        // Call the associated edge function
        const functionName = automationData.function_name;
        console.log(`Executing function: ${functionName}`);

        const { data: funcData, error: funcError } = await supabaseAdmin.functions.invoke(functionName, {
          body: { manual: true, config: automationData.config }
        });

        if (funcError) {
          console.error('Error executing function:', funcError);
          throw funcError;
        }

        // Update last_run timestamp
        await supabaseAdmin
          .from('automation_config')
          .update({ last_run: new Date().toISOString() })
          .eq('job_name', job_name);

        console.log(`Executed ${functionName} successfully`);
        return new Response(
          JSON.stringify({ success: true, message: 'Automação executada', result: funcData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_status': {
        // Get all automations
        const { data: automations, error: fetchError } = await supabaseAdmin
          .from('automation_config')
          .select('*')
          .order('name');

        if (fetchError) {
          throw fetchError;
        }

        return new Response(
          JSON.stringify({ success: true, automations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error('Error in manage-automation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
