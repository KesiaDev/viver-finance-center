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

interface MarveeContaAReceber {
  id: number;
  movement_value: number;
  payment_date: string | null;
  expiration_date: string | null;
  document?: MarveeDocument;
}

interface MarveeContaAPagar {
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

interface SyncResult {
  processed: number;
  created: number;
  updated: number;
  errors: string[];
}

function toBrazilDate(dateStr: string): string {
  return `${dateStr}T00:00:00.000-03:00`;
}

// Helper para extrair chave do mês (YYYY-MM) de uma data
function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

// Buscar contas a receber PAGAS (para realized_value)
async function fetchAllContasReceberPaid(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  startDate: string,
  endDate: string
): Promise<MarveeContaAReceber[]> {
  console.log(`Fetching PAID contas a receber from ${startDate} to ${endDate}...`);
  
  const allData: MarveeContaAReceber[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const url = new URL(`${apiUrl}/v1/contas-a-receber`);
    url.searchParams.set("dateStart", toBrazilDate(startDate));
    url.searchParams.set("dateEnd", toBrazilDate(endDate));
    url.searchParams.set("status", "paid");
    url.searchParams.set("date_option", "liquidacao");
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
      throw new Error(`Failed to fetch contas a receber (paid): ${response.status} - ${errorText}`);
    }

    const result: MarveePaginatedResponse<MarveeContaAReceber> = await response.json();
    allData.push(...(result.data || []));
    
    console.log(`Page ${page}: fetched ${result.data?.length || 0} records (total so far: ${allData.length})`);
    
    hasMore = result.meta?.current_page < result.meta?.last_page;
    page++;
    
    if (page > 100) {
      console.warn("Reached page limit (100), stopping pagination");
      break;
    }
  }
  
  console.log(`Total PAID contas a receber fetched: ${allData.length}`);
  return allData;
}

// Buscar contas a pagar PAGAS (para realized_value)
async function fetchAllContasPagarPaid(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  startDate: string,
  endDate: string
): Promise<MarveeContaAPagar[]> {
  console.log(`Fetching PAID contas a pagar from ${startDate} to ${endDate}...`);
  
  const allData: MarveeContaAPagar[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const url = new URL(`${apiUrl}/v1/contas-a-pagar`);
    url.searchParams.set("dateStart", toBrazilDate(startDate));
    url.searchParams.set("dateEnd", toBrazilDate(endDate));
    url.searchParams.set("status", "paid");
    url.searchParams.set("date_option", "liquidacao");
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
      throw new Error(`Failed to fetch contas a pagar (paid): ${response.status} - ${errorText}`);
    }

    const result: MarveePaginatedResponse<MarveeContaAPagar> = await response.json();
    allData.push(...(result.data || []));
    
    console.log(`Page ${page}: fetched ${result.data?.length || 0} records (total so far: ${allData.length})`);
    
    hasMore = result.meta?.current_page < result.meta?.last_page;
    page++;
    
    if (page > 100) {
      console.warn("Reached page limit (100), stopping pagination");
      break;
    }
  }
  
  console.log(`Total PAID contas a pagar fetched: ${allData.length}`);
  return allData;
}

// Buscar contas a receber PENDENTES (para projected_value)
async function fetchAllContasReceberPending(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  startDate: string,
  endDate: string
): Promise<MarveeContaAReceber[]> {
  console.log(`Fetching PENDING contas a receber from ${startDate} to ${endDate}...`);
  
  const allData: MarveeContaAReceber[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const url = new URL(`${apiUrl}/v1/contas-a-receber`);
    url.searchParams.set("dateStart", toBrazilDate(startDate));
    url.searchParams.set("dateEnd", toBrazilDate(endDate));
    url.searchParams.set("status", "pending");
    url.searchParams.set("date_option", "vencimento");
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
      throw new Error(`Failed to fetch contas a receber (pending): ${response.status} - ${errorText}`);
    }

    const result: MarveePaginatedResponse<MarveeContaAReceber> = await response.json();
    allData.push(...(result.data || []));
    
    console.log(`Page ${page}: fetched ${result.data?.length || 0} records (total so far: ${allData.length})`);
    
    hasMore = result.meta?.current_page < result.meta?.last_page;
    page++;
    
    if (page > 100) {
      console.warn("Reached page limit (100), stopping pagination");
      break;
    }
  }
  
  console.log(`Total PENDING contas a receber fetched: ${allData.length}`);
  return allData;
}

// Buscar contas a pagar PENDENTES (para projected_value)
async function fetchAllContasPagarPending(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  startDate: string,
  endDate: string
): Promise<MarveeContaAPagar[]> {
  console.log(`Fetching PENDING contas a pagar from ${startDate} to ${endDate}...`);
  
  const allData: MarveeContaAPagar[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const url = new URL(`${apiUrl}/v1/contas-a-pagar`);
    url.searchParams.set("dateStart", toBrazilDate(startDate));
    url.searchParams.set("dateEnd", toBrazilDate(endDate));
    url.searchParams.set("status", "pending");
    url.searchParams.set("date_option", "vencimento");
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
      throw new Error(`Failed to fetch contas a pagar (pending): ${response.status} - ${errorText}`);
    }

    const result: MarveePaginatedResponse<MarveeContaAPagar> = await response.json();
    allData.push(...(result.data || []));
    
    console.log(`Page ${page}: fetched ${result.data?.length || 0} records (total so far: ${allData.length})`);
    
    hasMore = result.meta?.current_page < result.meta?.last_page;
    page++;
    
    if (page > 100) {
      console.warn("Reached page limit (100), stopping pagination");
      break;
    }
  }
  
  console.log(`Total PENDING contas a pagar fetched: ${allData.length}`);
  return allData;
}

// Agregar dados por mês e categoria usando payment_date (para contas PAGAS)
function aggregateByMonthAndCategoryPaid(
  contasReceber: MarveeContaAReceber[],
  contasPagar: MarveeContaAPagar[],
  categoryMappings: Map<string, string>
): Map<string, Map<string, { receitas: number; despesas: number }>> {
  const result = new Map<string, Map<string, { receitas: number; despesas: number }>>();
  const unmappedCategories = new Set<string>();

  // Process receitas
  for (const conta of contasReceber) {
    if (!conta.payment_date) continue;
    
    const monthKey = getMonthKey(conta.payment_date);
    const category = conta.document?.category_level_3;
    
    if (!category?.structure) continue;

    const categoryCode = categoryMappings.get(category.structure);
    
    if (!categoryCode) {
      unmappedCategories.add(`${category.structure}:${category.description}`);
      continue;
    }

    if (!result.has(monthKey)) {
      result.set(monthKey, new Map());
    }
    
    const monthData = result.get(monthKey)!;
    if (!monthData.has(categoryCode)) {
      monthData.set(categoryCode, { receitas: 0, despesas: 0 });
    }
    
    monthData.get(categoryCode)!.receitas += Number(conta.movement_value) || 0;
  }

  // Process despesas
  for (const conta of contasPagar) {
    if (!conta.payment_date) continue;
    
    const monthKey = getMonthKey(conta.payment_date);
    const category = conta.document?.category_level_3;
    
    if (!category?.structure) continue;

    const categoryCode = categoryMappings.get(category.structure);
    
    if (!categoryCode) {
      unmappedCategories.add(`${category.structure}:${category.description}`);
      continue;
    }

    if (!result.has(monthKey)) {
      result.set(monthKey, new Map());
    }
    
    const monthData = result.get(monthKey)!;
    if (!monthData.has(categoryCode)) {
      monthData.set(categoryCode, { receitas: 0, despesas: 0 });
    }
    
    monthData.get(categoryCode)!.despesas += Number(conta.movement_value) || 0;
  }

  if (unmappedCategories.size > 0) {
    console.log(`[PAID] Unmapped categories (${unmappedCategories.size}): ${Array.from(unmappedCategories).slice(0, 10).join(", ")}${unmappedCategories.size > 10 ? "..." : ""}`);
  }

  return result;
}

// Agregar dados por mês e categoria usando expiration_date (para contas PENDENTES)
function aggregateByMonthAndCategoryPending(
  contasReceber: MarveeContaAReceber[],
  contasPagar: MarveeContaAPagar[],
  categoryMappings: Map<string, string>
): Map<string, Map<string, { receitas: number; despesas: number }>> {
  const result = new Map<string, Map<string, { receitas: number; despesas: number }>>();
  const unmappedCategories = new Set<string>();

  // Process receitas - usando expiration_date (data de vencimento)
  for (const conta of contasReceber) {
    if (!conta.expiration_date) continue;
    
    const monthKey = getMonthKey(conta.expiration_date);
    const category = conta.document?.category_level_3;
    
    if (!category?.structure) continue;

    const categoryCode = categoryMappings.get(category.structure);
    
    if (!categoryCode) {
      unmappedCategories.add(`${category.structure}:${category.description}`);
      continue;
    }

    if (!result.has(monthKey)) {
      result.set(monthKey, new Map());
    }
    
    const monthData = result.get(monthKey)!;
    if (!monthData.has(categoryCode)) {
      monthData.set(categoryCode, { receitas: 0, despesas: 0 });
    }
    
    monthData.get(categoryCode)!.receitas += Number(conta.movement_value) || 0;
  }

  // Process despesas - usando expiration_date (data de vencimento)
  for (const conta of contasPagar) {
    if (!conta.expiration_date) continue;
    
    const monthKey = getMonthKey(conta.expiration_date);
    const category = conta.document?.category_level_3;
    
    if (!category?.structure) continue;

    const categoryCode = categoryMappings.get(category.structure);
    
    if (!categoryCode) {
      unmappedCategories.add(`${category.structure}:${category.description}`);
      continue;
    }

    if (!result.has(monthKey)) {
      result.set(monthKey, new Map());
    }
    
    const monthData = result.get(monthKey)!;
    if (!monthData.has(categoryCode)) {
      monthData.set(categoryCode, { receitas: 0, despesas: 0 });
    }
    
    monthData.get(categoryCode)!.despesas += Number(conta.movement_value) || 0;
  }

  if (unmappedCategories.size > 0) {
    console.log(`[PENDING] Unmapped categories (${unmappedCategories.size}): ${Array.from(unmappedCategories).slice(0, 10).join(", ")}${unmappedCategories.size > 10 ? "..." : ""}`);
  }

  return result;
}

// Upsert helper para valores realizados
async function upsertRealizedValues(
  supabase: any,
  aggregatedData: Map<string, Map<string, { receitas: number; despesas: number }>>,
  syncTimestamp: string,
  result: SyncResult
) {
  console.log(`[upsertRealizedValues] Starting upsert for ${aggregatedData.size} months`);
  
  for (const [monthKey, categories] of aggregatedData) {
    console.log(`[upsertRealizedValues] Processing month ${monthKey} with ${categories.size} categories`);
    
    for (const [categoryCode, values] of categories) {
      result.processed++;

      const isRevenue = categoryCode.startsWith("01");
      const value = isRevenue ? values.receitas : values.despesas;

      // Validate numeric value
      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        console.warn(`[upsertRealizedValues] Invalid numeric value for ${monthKey}/${categoryCode}: ${value}`);
        result.errors.push(`Invalid numeric value for ${monthKey}/${categoryCode}: ${value}`);
        continue;
      }

      if (numericValue === 0) continue;

      console.log(`[upsertRealizedValues] Upserting ${monthKey}/${categoryCode}: ${numericValue.toFixed(2)}`);

      // Use maybeSingle() instead of single() to avoid error when no record exists
      const { data: existing, error: selectError } = await supabase
        .from("cash_flow_data")
        .select("id")
        .eq("month", monthKey)
        .eq("category_code", categoryCode)
        .maybeSingle();

      if (selectError) {
        console.error(`[upsertRealizedValues] Select error for ${monthKey}/${categoryCode}: ${selectError.message}`);
        result.errors.push(`Select failed for ${monthKey}/${categoryCode}: ${selectError.message}`);
        continue;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("cash_flow_data")
          .update({
            realized_value: numericValue,
            synced_from: "marvee",
            synced_at: syncTimestamp,
            updated_at: syncTimestamp,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error(`[upsertRealizedValues] Update error for ${monthKey}/${categoryCode}: ${updateError.message}`);
          result.errors.push(`Update realized failed for ${monthKey}/${categoryCode}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      } else {
        const { error: insertError } = await supabase
          .from("cash_flow_data")
          .insert({
            month: monthKey,
            category_code: categoryCode,
            realized_value: numericValue,
            synced_from: "marvee",
            synced_at: syncTimestamp,
          });

        if (insertError) {
          console.error(`[upsertRealizedValues] Insert error for ${monthKey}/${categoryCode}: ${insertError.message}`);
          result.errors.push(`Insert realized failed for ${monthKey}/${categoryCode}: ${insertError.message}`);
        } else {
          result.created++;
        }
      }
    }
  }
  
  console.log(`[upsertRealizedValues] Completed: ${result.created} created, ${result.updated} updated`);
}

// Upsert helper para valores projetados
async function upsertProjectedValues(
  supabase: any,
  aggregatedData: Map<string, Map<string, { receitas: number; despesas: number }>>,
  syncTimestamp: string,
  result: SyncResult
) {
  console.log(`[upsertProjectedValues] Starting upsert for ${aggregatedData.size} months`);
  
  for (const [monthKey, categories] of aggregatedData) {
    console.log(`[upsertProjectedValues] Processing month ${monthKey} with ${categories.size} categories`);
    
    for (const [categoryCode, values] of categories) {
      result.processed++;

      const isRevenue = categoryCode.startsWith("01");
      const value = isRevenue ? values.receitas : values.despesas;

      // Validate numeric value
      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        console.warn(`[upsertProjectedValues] Invalid numeric value for ${monthKey}/${categoryCode}: ${value}`);
        result.errors.push(`Invalid numeric value for ${monthKey}/${categoryCode}: ${value}`);
        continue;
      }

      if (numericValue === 0) continue;

      console.log(`[upsertProjectedValues] Upserting ${monthKey}/${categoryCode}: ${numericValue.toFixed(2)}`);

      // Use maybeSingle() instead of single() to avoid error when no record exists
      const { data: existing, error: selectError } = await supabase
        .from("cash_flow_data")
        .select("id")
        .eq("month", monthKey)
        .eq("category_code", categoryCode)
        .maybeSingle();

      if (selectError) {
        console.error(`[upsertProjectedValues] Select error for ${monthKey}/${categoryCode}: ${selectError.message}`);
        result.errors.push(`Select failed for ${monthKey}/${categoryCode}: ${selectError.message}`);
        continue;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("cash_flow_data")
          .update({
            projected_value: numericValue,
            synced_from: "marvee",
            synced_at: syncTimestamp,
            updated_at: syncTimestamp,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error(`[upsertProjectedValues] Update error for ${monthKey}/${categoryCode}: ${updateError.message}`);
          result.errors.push(`Update projected failed for ${monthKey}/${categoryCode}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      } else {
        const { error: insertError } = await supabase
          .from("cash_flow_data")
          .insert({
            month: monthKey,
            category_code: categoryCode,
            projected_value: numericValue,
            synced_from: "marvee",
            synced_at: syncTimestamp,
          });

        if (insertError) {
          console.error(`[upsertProjectedValues] Insert error for ${monthKey}/${categoryCode}: ${insertError.message}`);
          result.errors.push(`Insert projected failed for ${monthKey}/${categoryCode}: ${insertError.message}`);
        } else {
          result.created++;
        }
      }
    }
  }
  
  console.log(`[upsertProjectedValues] Completed`);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  let logId: string | null = null;

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const marveeApiUrl = Deno.env.get("MARVEE_API_URL");
    const marveeClientId = Deno.env.get("MARVEE_CLIENT_ID");
    const marveeClientSecret = Deno.env.get("MARVEE_CLIENT_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!marveeApiUrl || !marveeClientId || !marveeClientSecret) {
      throw new Error("Missing Marvee API configuration");
    }

    // Validate Client ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(marveeClientId)) {
      console.error(`Invalid Client ID format. Expected UUID, got: ${marveeClientId?.substring(0, 20)}...`);
      throw new Error("Invalid MARVEE_CLIENT_ID format. Expected UUID format (e.g., 86f6fdc7-bf40-463c-9e7f-8888dabafc91)");
    }

    console.log(`Marvee API URL: ${marveeApiUrl}`);
    console.log(`Marvee Client ID: ${marveeClientId?.substring(0, 8)}... (valid UUID format)`);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { 
      sync_type = "cash_flow", 
      triggered_by = "manual",
      year = new Date().getFullYear(),
      month,
      sync_all = false,
    } = body;

    // Check if this is a scheduled run and if the automation is active
    if (triggered_by === "scheduled") {
      const { data: config } = await supabase
        .from("automation_config")
        .select("is_active")
        .eq("function_name", "marvee-sync")
        .single();

      if (!config?.is_active) {
        return new Response(
          JSON.stringify({ success: false, message: "Automation is disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Starting Marvee sync: type=${sync_type}, year=${year}, month=${month || "all"}, syncAll=${sync_all}, triggeredBy=${triggered_by}`);

    // Create sync log entry
    const { data: logData, error: logError } = await supabase
      .from("marvee_sync_logs")
      .insert({
        sync_type,
        status: "running",
        triggered_by,
        started_at: startedAt,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    } else {
      logId = logData.id;
    }

    // Fetch category mappings (using new structure field)
    const { data: mappingsData } = await supabase
      .from("marvee_category_mapping")
      .select("marvee_category_structure, cash_flow_category_code")
      .eq("is_active", true)
      .not("marvee_category_structure", "is", null);

    const categoryMappings = new Map<string, string>();
    for (const m of mappingsData || []) {
      if (m.marvee_category_structure) {
        categoryMappings.set(m.marvee_category_structure, m.cash_flow_category_code);
      }
    }

    console.log(`Loaded ${categoryMappings.size} category mappings`);

    // Initialize result
    const result: SyncResult = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
    };

    let totalContasReceberPaid = 0;
    let totalContasPagarPaid = 0;
    let totalContasReceberPending = 0;
    let totalContasPagarPending = 0;
    const syncTimestamp = new Date().toISOString();

    // Determine years to process
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const yearsToProcess: number[] = [];

    if (sync_all) {
      for (let y = startYear; y <= currentYear; y++) {
        yearsToProcess.push(y);
      }
      console.log(`Sync all mode: processing years ${yearsToProcess.join(", ")}`);
    } else {
      yearsToProcess.push(year);
    }

    // Calculate date range for single year/month mode
    let startDate: string;
    let endDate: string;

    if (!sync_all) {
      if (month) {
        startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
      } else {
        startDate = `${year}-01-01`;
        endDate = `${year}-12-31`;
      }
    }

    // Process each year
    for (const processYear of yearsToProcess) {
      const yearStartDate = `${processYear}-01-01`;
      const yearEndDate = `${processYear}-12-31`;
      
      const fetchStartDate = sync_all ? yearStartDate : startDate!;
      const fetchEndDate = sync_all ? yearEndDate : endDate!;

      console.log(`Processing year ${processYear}: ${fetchStartDate} to ${fetchEndDate}`);

      // ===== PARTE 1: BUSCAR E PROCESSAR DADOS REALIZADOS (PAGOS) =====
      console.log(`\n--- Fetching PAID data for year ${processYear} ---`);
      
      const [contasReceberPaid, contasPagarPaid] = await Promise.all([
        fetchAllContasReceberPaid(marveeApiUrl, marveeClientId, marveeClientSecret, fetchStartDate, fetchEndDate),
        fetchAllContasPagarPaid(marveeApiUrl, marveeClientId, marveeClientSecret, fetchStartDate, fetchEndDate),
      ]);

      totalContasReceberPaid += contasReceberPaid.length;
      totalContasPagarPaid += contasPagarPaid.length;

      console.log(`Year ${processYear} PAID: ${contasReceberPaid.length} receitas, ${contasPagarPaid.length} despesas`);

      // Agregar e fazer upsert dos dados pagos (realized_value)
      const aggregatedPaidData = aggregateByMonthAndCategoryPaid(contasReceberPaid, contasPagarPaid, categoryMappings);
      console.log(`Aggregated PAID data into ${aggregatedPaidData.size} months`);
      
      await upsertRealizedValues(supabase, aggregatedPaidData, syncTimestamp, result);

      // ===== PARTE 2: BUSCAR E PROCESSAR DADOS PREVISTOS (PENDENTES) =====
      console.log(`\n--- Fetching PENDING data for year ${processYear} ---`);
      
      const [contasReceberPending, contasPagarPending] = await Promise.all([
        fetchAllContasReceberPending(marveeApiUrl, marveeClientId, marveeClientSecret, fetchStartDate, fetchEndDate),
        fetchAllContasPagarPending(marveeApiUrl, marveeClientId, marveeClientSecret, fetchStartDate, fetchEndDate),
      ]);

      totalContasReceberPending += contasReceberPending.length;
      totalContasPagarPending += contasPagarPending.length;

      console.log(`Year ${processYear} PENDING: ${contasReceberPending.length} receitas, ${contasPagarPending.length} despesas`);

      // Agregar e fazer upsert dos dados pendentes (projected_value)
      const aggregatedPendingData = aggregateByMonthAndCategoryPending(contasReceberPending, contasPagarPending, categoryMappings);
      console.log(`Aggregated PENDING data into ${aggregatedPendingData.size} months`);
      
      await upsertProjectedValues(supabase, aggregatedPendingData, syncTimestamp, result);
    }

    console.log(`\n=== SYNC COMPLETE ===`);
    console.log(`Total PAID: ${totalContasReceberPaid} receitas, ${totalContasPagarPaid} despesas`);
    console.log(`Total PENDING: ${totalContasReceberPending} receitas, ${totalContasPagarPending} despesas`);
    console.log(`Result: ${result.processed} processed, ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);

    // Update sync log
    if (logId) {
      await supabase
        .from("marvee_sync_logs")
        .update({
          status: result.errors.length > 0 ? "partial" : "success",
          records_processed: result.processed,
          records_created: result.created,
          records_updated: result.updated,
          error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        summary: {
          paid: { receitas: totalContasReceberPaid, despesas: totalContasPagarPaid },
          pending: { receitas: totalContasReceberPending, despesas: totalContasPagarPending },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", error);

    // Update sync log with error
    if (logId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("marvee_sync_logs")
          .update({
            status: "failed",
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
