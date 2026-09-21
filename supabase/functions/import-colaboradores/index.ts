import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColaboradorImport {
  nome: string;
  email: string;
  cpf: string;
  cnpj?: string;
  area?: string;
  funcao?: string;
  remuneracao: number;
  data_inicio_contrato?: string;
  data_fim_contrato?: string;
  chave_pix_cnpj?: string;
  variavel?: string;
  regra_ote?: string;
  data_nascimento?: string;
  is_admin?: boolean;
  ativo?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { colaboradores } = await req.json() as { colaboradores: ColaboradorImport[] };

    if (!colaboradores || !Array.isArray(colaboradores)) {
      throw new Error('Lista de colaboradores inválida');
    }

    console.log(`Iniciando importação de ${colaboradores.length} colaboradores (sem criar usuários auth)`);

    const results: { nome: string; email: string; sucesso: boolean; erro?: string }[] = [];

    for (const colab of colaboradores) {
      try {
        console.log(`Processando: ${colab.nome} (${colab.email})`);

        // Verificar se já existe colaborador com este email
        const { data: existente } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('email', colab.email)
          .maybeSingle();

        if (existente) {
          console.log(`Colaborador ${colab.email} já existe, pulando...`);
          results.push({
            nome: colab.nome,
            email: colab.email,
            sucesso: false,
            erro: 'Email já cadastrado'
          });
          continue;
        }

        // Inserir colaborador SEM user_id (será vinculado quando se cadastrar)
        const { error: insertError } = await supabase
          .from('colaboradores')
          .insert({
            user_id: null, // Será preenchido quando o colaborador se cadastrar
            nome: colab.nome,
            email: colab.email,
            cpf: colab.cpf,
            cnpj: colab.cnpj || null,
            area: colab.area || '',
            funcao: colab.funcao || '',
            remuneracao: colab.remuneracao,
            data_inicio_contrato: colab.data_inicio_contrato || new Date().toISOString().split('T')[0],
            data_fim_contrato: colab.data_fim_contrato || null,
            chave_pix_cnpj: colab.chave_pix_cnpj || null,
            variavel: colab.variavel || null,
            regra_ote: colab.regra_ote || null,
            data_nascimento: colab.data_nascimento || null,
            is_admin: colab.is_admin || false, // Apenas marca, NÃO atribui role automaticamente
            // Se data_fim_contrato está preenchida, marca como inativo
            // Caso contrário, usa o valor enviado ou true como padrão
            ativo: colab.data_fim_contrato ? false : (colab.ativo ?? true),
          });

        if (insertError) {
          console.error(`Erro ao inserir colaborador ${colab.email}:`, insertError);
          results.push({
            nome: colab.nome,
            email: colab.email,
            sucesso: false,
            erro: insertError.message
          });
          continue;
        }

        results.push({
          nome: colab.nome,
          email: colab.email,
          sucesso: true
        });

        console.log(`Sucesso: ${colab.nome}`);

      } catch (err) {
        console.error(`Erro processando ${colab.nome}:`, err);
        results.push({
          nome: colab.nome,
          email: colab.email,
          sucesso: false,
          erro: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }
    }

    const sucessos = results.filter(r => r.sucesso).length;
    const falhas = results.filter(r => !r.sucesso).length;

    console.log(`Importação finalizada: ${sucessos} sucessos, ${falhas} falhas`);

    return new Response(
      JSON.stringify({
        message: `Importação concluída: ${sucessos} sucessos, ${falhas} falhas`,
        total: colaboradores.length,
        sucessos,
        falhas,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na importação:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
