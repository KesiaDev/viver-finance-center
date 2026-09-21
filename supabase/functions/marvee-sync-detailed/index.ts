import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Interfaces para os dados da API Marvee
interface MarveeCategory {
  id: number;
  structure: string;
  description: string;
}

interface MarveeDocument {
  category_level_1?: MarveeCategory;
  category_level_2?: MarveeCategory;
  category_level_3?: MarveeCategory;
}

interface MarveeConta {
  id: number;
  movement_value: number;
  payment_date: string | null;
  expiration_date: string | null;
  document?: MarveeDocument;
}

interface MarveePaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface DetailedRecord {
  month: string;
  marvee_category_structure: string;
  marvee_category_description: string;
  realized_value: number;
  projected_value: number;
  source_type: string; // 'receita' ou 'despesa'
}

interface SkippedStats {
  noDate: number;
  noCategory: number;
  examples: any[];
}

interface AggregationResult {
  data: Map<string, DetailedRecord>;
  skipped: SkippedStats;
}

function toBrazilDate(dateStr: string): string {
  return `${dateStr}T00:00:00.000-03:00`;
}

// Helper para extrair chave do mês (YYYY-MM) de uma data
function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

// Buscar contas com paginação completa
async function fetchAllContas(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  endpoint: string, // 'contas-a-receber' ou 'contas-a-pagar'
  status: string, // 'paid' ou 'pending'
  dateOption: string, // 'liquidacao' ou 'vencimento'
  startDate: string,
  endDate: string
): Promise<MarveeConta[]> {
  console.log(`Fetching ${status} ${endpoint} (${dateOption}) from ${startDate} to ${endDate}...`);
  
  const allData: MarveeConta[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const url = new URL(`${apiUrl}/v1/${endpoint}`);
    url.searchParams.set("dateStart", toBrazilDate(startDate));
    url.searchParams.set("dateEnd", toBrazilDate(endDate));
    url.searchParams.set("status", status);
    url.searchParams.set("date_option", dateOption);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", "1000");
    
    console.log(`Request URL (page ${page}): ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "client-id": clientId,
        "authorization": clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(`Failed to fetch ${endpoint} (${status}): ${response.status} - ${errorText}`);
    }

    const result: MarveePaginatedResponse<MarveeConta> = await response.json();
    allData.push(...(result.data || []));
    
    console.log(`Page ${page}: fetched ${result.data?.length || 0} records (total so far: ${allData.length})`);
    
    hasMore = result.meta?.current_page < result.meta?.last_page;
    page++;
    
    if (page > 100) {
      console.warn("Reached page limit (100), stopping pagination");
      break;
    }
  }
  
  console.log(`Total ${status} ${endpoint} fetched: ${allData.length}`);
  return allData;
}

// Agregar dados detalhados por mês, categoria e source_type
function aggregateDetailedData(
  contas: MarveeConta[],
  sourceType: string, // 'receita' ou 'despesa'
  isPaid: boolean // true = usar payment_date, false = usar expiration_date
): AggregationResult {
  const result = new Map<string, DetailedRecord>();
  let skippedNoDate = 0;
  let skippedNoCategory = 0;
  const skippedExamples: any[] = [];

  for (const conta of contas) {
    const dateStr = isPaid ? conta.payment_date : conta.expiration_date;
    if (!dateStr) {
      skippedNoDate++;
      continue;
    }
    
    const monthKey = getMonthKey(dateStr);
    const category = conta.document?.category_level_3;
    
    // 📋 DEBUG: Registrar exemplos de registros sem categoria
    if (!category?.structure) {
      skippedNoCategory++;
      // Guardar os primeiros 10 exemplos para debug
      if (skippedExamples.length < 10) {
        skippedExamples.push({
          id: conta.id,
          movement_value: conta.movement_value,
          payment_date: conta.payment_date,
          expiration_date: conta.expiration_date,
          document_full: conta.document, // Estrutura completa do documento
          category_level_1: conta.document?.category_level_1,
          category_level_2: conta.document?.category_level_2,
          category_level_3: conta.document?.category_level_3,
        });
      }
      continue;
    }

    const key = `${monthKey}|${category.structure}|${sourceType}`;
    const value = Number(conta.movement_value) || 0;
    
    if (!result.has(key)) {
      result.set(key, {
        month: monthKey,
        marvee_category_structure: category.structure,
        marvee_category_description: category.description || '',
        realized_value: 0,
        projected_value: 0,
        source_type: sourceType,
      });
    }
    
    const record = result.get(key)!;
    if (isPaid) {
      record.realized_value += value;
    } else {
      record.projected_value += value;
    }
  }

  return { 
    data: result, 
    skipped: { 
      noDate: skippedNoDate, 
      noCategory: skippedNoCategory, 
      examples: skippedExamples 
    } 
  };
}

// Merge dois maps de DetailedRecord
function mergeDetailedMaps(
  map1: Map<string, DetailedRecord>,
  map2: Map<string, DetailedRecord>
): Map<string, DetailedRecord> {
  const result = new Map(map1);
  
  for (const [key, record] of map2) {
    if (result.has(key)) {
      const existing = result.get(key)!;
      existing.realized_value += record.realized_value;
      existing.projected_value += record.projected_value;
    } else {
      result.set(key, { ...record });
    }
  }
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar secrets
    const apiUrl = Deno.env.get("MARVEE_API_URL");
    const clientId = Deno.env.get("MARVEE_CLIENT_ID");
    const clientSecret = Deno.env.get("MARVEE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiUrl || !clientId || !clientSecret) {
      throw new Error("Missing Marvee API configuration");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { year, month, syncAll } = body;

    // Determinar período
    let startDate: string;
    let endDate: string;

    if (syncAll) {
      // Sincronizar tudo desde 2020
      startDate = "2020-01-01";
      endDate = new Date().toISOString().split("T")[0];
    } else if (year && month) {
      // Mês específico
      const lastDay = new Date(year, month, 0).getDate();
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    } else if (year) {
      // Ano inteiro
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      // Ano atual por padrão
      const currentYear = new Date().getFullYear();
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
    }

    console.log(`Syncing detailed data from ${startDate} to ${endDate}`);

    // Buscar dados da API Marvee
    const [
      receberPaid,
      receberPending,
      pagarPaid,
      pagarPending
    ] = await Promise.all([
      fetchAllContas(apiUrl, clientId, clientSecret, "contas-a-receber", "paid", "liquidacao", startDate, endDate),
      fetchAllContas(apiUrl, clientId, clientSecret, "contas-a-receber", "pending", "vencimento", startDate, endDate),
      fetchAllContas(apiUrl, clientId, clientSecret, "contas-a-pagar", "paid", "liquidacao", startDate, endDate),
      fetchAllContas(apiUrl, clientId, clientSecret, "contas-a-pagar", "pending", "vencimento", startDate, endDate),
    ]);

    console.log(`Fetched: ${receberPaid.length} receitas pagas, ${receberPending.length} receitas pendentes, ${pagarPaid.length} despesas pagas, ${pagarPending.length} despesas pendentes`);

    // Agregar dados por categoria detalhada
    const receitasPaidResult = aggregateDetailedData(receberPaid, 'receita', true);
    const receitasPendingResult = aggregateDetailedData(receberPending, 'receita', false);
    const despesasPaidResult = aggregateDetailedData(pagarPaid, 'despesa', true);
    const despesasPendingResult = aggregateDetailedData(pagarPending, 'despesa', false);

    // Log de debug para registros pulados
    console.log(`[DEBUG] Receitas pagas - Pulados: ${receitasPaidResult.skipped.noCategory} sem categoria, ${receitasPaidResult.skipped.noDate} sem data`);
    console.log(`[DEBUG] Receitas pendentes - Pulados: ${receitasPendingResult.skipped.noCategory} sem categoria, ${receitasPendingResult.skipped.noDate} sem data`);
    console.log(`[DEBUG] Despesas pagas - Pulados: ${despesasPaidResult.skipped.noCategory} sem categoria, ${despesasPaidResult.skipped.noDate} sem data`);
    console.log(`[DEBUG] Despesas pendentes - Pulados: ${despesasPendingResult.skipped.noCategory} sem categoria, ${despesasPendingResult.skipped.noDate} sem data`);

    // Logar exemplos de registros pulados
    if (despesasPaidResult.skipped.examples.length > 0) {
      console.log(`[DEBUG] Exemplos de DESPESAS PAGAS puladas (sem categoria):`);
      console.log(JSON.stringify(despesasPaidResult.skipped.examples, null, 2));
    }
    if (despesasPendingResult.skipped.examples.length > 0) {
      console.log(`[DEBUG] Exemplos de DESPESAS PENDENTES puladas (sem categoria):`);
      console.log(JSON.stringify(despesasPendingResult.skipped.examples, null, 2));
    }

    // Merge all maps
    let allRecords = mergeDetailedMaps(receitasPaidResult.data, receitasPendingResult.data);
    allRecords = mergeDetailedMaps(allRecords, despesasPaidResult.data);
    allRecords = mergeDetailedMaps(allRecords, despesasPendingResult.data);

    console.log(`Total unique category/month/type combinations: ${allRecords.size}`);

    // Upsert na tabela cash_flow_data_detailed
    const syncTimestamp = new Date().toISOString();
    let processed = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const [key, record] of allRecords) {
      processed++;

      // Verificar se já existe
      const { data: existing, error: selectError } = await supabase
        .from("cash_flow_data_detailed")
        .select("id, realized_value, projected_value")
        .eq("month", record.month)
        .eq("marvee_category_structure", record.marvee_category_structure)
        .eq("source_type", record.source_type)
        .maybeSingle();

      if (selectError) {
        console.error(`Select error for ${key}: ${selectError.message}`);
        errors.push(`Select error for ${key}: ${selectError.message}`);
        continue;
      }

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from("cash_flow_data_detailed")
          .update({
            marvee_category_description: record.marvee_category_description,
            realized_value: record.realized_value,
            projected_value: record.projected_value,
            synced_at: syncTimestamp,
            updated_at: syncTimestamp,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error(`Update error for ${key}: ${updateError.message}`);
          errors.push(`Update error for ${key}: ${updateError.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from("cash_flow_data_detailed")
          .insert({
            month: record.month,
            marvee_category_structure: record.marvee_category_structure,
            marvee_category_description: record.marvee_category_description,
            realized_value: record.realized_value,
            projected_value: record.projected_value,
            source_type: record.source_type,
            synced_at: syncTimestamp,
          });

        if (insertError) {
          console.error(`Insert error for ${key}: ${insertError.message}`);
          errors.push(`Insert error for ${key}: ${insertError.message}`);
        } else {
          created++;
        }
      }
    }

    console.log(`Sync complete: ${processed} processed, ${created} created, ${updated} updated, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        period: { startDate, endDate },
        stats: {
          fetched: {
            receberPaid: receberPaid.length,
            receberPending: receberPending.length,
            pagarPaid: pagarPaid.length,
            pagarPending: pagarPending.length,
          },
          uniqueRecords: allRecords.size,
          processed,
          created,
          updated,
          errors: errors.length,
          skipped: {
            receitasPaid: receitasPaidResult.skipped,
            receitasPending: receitasPendingResult.skipped,
            despesasPaid: despesasPaidResult.skipped,
            despesasPending: despesasPendingResult.skipped,
          },
        },
        // Debug: primeiros 5 exemplos de cada tipo
        debug: {
          despesasPaidExamples: despesasPaidResult.skipped.examples.slice(0, 5),
          despesasPendingExamples: despesasPendingResult.skipped.examples.slice(0, 5),
        },
        errors: errors.slice(0, 10), // Primeiros 10 erros
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
