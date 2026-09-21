import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtratoItem {
  guid: string;
  source: string;
  typecolumn: string;
  type: number;
  value?: number;
  treasury?: {
    movement_date: string;
    value: number;
    comments?: string;
  };
  account: {
    id: number;
    name: string;
    bank_code?: string;
  };
  installment?: {
    id: number;
    expiration_date?: string;
    original_value?: number;
    movement_value?: number;
    document?: {
      id: number;
      code?: string | number;
      description?: string;
      generation_date?: string;
      people?: { name?: string };
      category_level_1?: { structure: string; description: string };
      category_level_2?: { structure: string; description: string };
      category_level_3?: { structure: string; description: string };
      cost_centers?: Array<{ name: string }>;
      payment_method_type?: string;
    };
  };
}

interface ExtratoResponse {
  data: ExtratoItem[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

function toBrazilDate(dateStr: string): string {
  return `${dateStr}T00:00:00.000-03:00`;
}

function toBrazilDateEnd(dateStr: string): string {
  return `${dateStr}T23:59:59.999-03:00`;
}

async function fetchExtratoPage(
  apiUrl: string,
  startDate: string,
  endDate: string,
  clientId: string,
  clientSecret: string,
  page: number
): Promise<ExtratoResponse> {
  const url = new URL(`${apiUrl}/v1/extrato`);
  url.searchParams.set("dateStart", toBrazilDate(startDate));
  url.searchParams.set("dateEnd", toBrazilDateEnd(endDate));
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", "200");

  let retries = 0;
  const maxRetries = 3;

  while (true) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "client-id": clientId,
        authorization: clientSecret,
      },
    });

    if (response.status === 429 && retries < maxRetries) {
      retries++;
      const wait = Math.pow(2, retries) * 1000;
      console.warn(`Rate limited, waiting ${wait}ms (retry ${retries}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Marvee API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}

function toMonth(dateStr: string): string {
  return dateStr.substring(0, 7);
}

function mapExtratoItem(item: ExtratoItem, syncedAt: string) {
  const doc = item.installment?.document;
  const cat = doc?.category_level_3 || doc?.category_level_2 || doc?.category_level_1;

  const movDate = item.treasury?.movement_date ?? item.installment?.expiration_date;
  if (!movDate) return null;

  // Lógica condicional por source + status (treasury)
  const isReceita = item.source === "bills_to_receive";
  const hasTreasury = item.treasury != null;

  let rawValue: number;
  if (hasTreasury) {
    if (isReceita) {
      const mv = Number(item.installment?.movement_value ?? 0);
      rawValue = mv !== 0 ? mv : Number(item.treasury?.value ?? 0);
    } else {
      rawValue = Number(item.treasury?.value ?? 0);
    }
  } else {
    const ov = Number(item.installment?.original_value ?? 0);
    rawValue = ov !== 0 ? ov : Number(item.value ?? 0);
  }
  const movValue = Math.abs(rawValue);

  return {
    guid: item.guid,
    source: item.source,
    type_column: item.typecolumn,
    type_sign: item.type,
    movement_date: movDate,
    movement_value: movValue,
    comments: item.treasury?.comments || null,
    account_id: item.account?.id || null,
    account_name: item.account?.name || null,
    account_bank_code: item.account?.bank_code || null,
    installment_id: item.installment?.id || null,
    document_id: doc?.id || null,
    document_code: doc?.code != null ? String(doc.code) : null,
    document_description: doc?.description || null,
    generation_date: doc?.generation_date || null,
    people_name: doc?.people?.name || null,
    category_structure: cat?.structure || null,
    category_description: cat?.description || null,
    cost_center_name:
      Array.isArray(doc?.cost_centers) && doc!.cost_centers!.length > 0
        ? doc!.cost_centers![0].name
        : null,
    payment_method: doc?.payment_method_type || null,
    month: toMonth(movDate),
    raw_payload: item,
    synced_at: syncedAt,
  };
}

function generateMonthRanges(startDate: string, endDate: string): Array<{ start: string; end: string }> {
  const ranges: Array<{ start: string; end: string }> = [];
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);

  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthStr = String(month).padStart(2, "0");
    const start = `${year}-${monthStr}-01`;
    // Last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    ranges.push({ start, end });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return ranges;
}

async function fetchAndUpsertMonth(
  supabase: ReturnType<typeof createClient>,
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  range: { start: string; end: string },
  syncedAt: string
): Promise<{ fetched: number; upserted: number; skipped: number; duplicatesRemoved: number; deleted: number; errors: string[]; sourceCounts: Record<string, number> }> {
  const monthItems: ExtratoItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`  Page ${page}...`);
    const response = await fetchExtratoPage(apiUrl, range.start, range.end, clientId, clientSecret, page);
    monthItems.push(...(response.data || []));

    const lastPage = response.meta?.last_page || 1;
    console.log(`  Page ${page}/${lastPage}: ${response.data?.length || 0} records`);

    hasMore = response.meta?.current_page < lastPage;
    page++;

    if (page > 200) {
      console.warn("  Reached page limit (200), stopping");
      break;
    }

    if (hasMore) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Map
  const mapped = monthItems.map((item) => mapExtratoItem(item, syncedAt));
  const records = mapped.filter((r) => r !== null);
  const skipped = mapped.length - records.length;

  // Deduplicate by guid
  const uniqueMap = new Map<string, typeof records[0]>();
  for (const r of records) {
    uniqueMap.set(r.guid, r);
  }
  const uniqueRecords = Array.from(uniqueMap.values());
  const duplicatesRemoved = records.length - uniqueRecords.length;

  // Source counts
  const sourceCounts: Record<string, number> = {};
  for (const r of uniqueRecords) {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
  }

  // Upsert in batches
  const errors: string[] = [];
  let upserted = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < uniqueRecords.length; i += BATCH_SIZE) {
    const batch = uniqueRecords.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("marvee_extrato")
      .upsert(batch, { onConflict: "guid", ignoreDuplicates: false, count: "exact" });

    if (error) {
      console.error(`  Batch error: ${error.message}`);
      errors.push(error.message);
    } else {
      upserted += count || batch.length;
    }
  }

  // Clean up stale records for this month (not confirmed by this sync)
  const monthKey = range.start.substring(0, 7);
  let deleted = 0;
  const { count: deletedCount, error: deleteError } = await supabase
    .from("marvee_extrato")
    .delete({ count: "exact" })
    .eq("month", monthKey)
    .lt("synced_at", syncedAt);

  if (deleteError) {
    console.error(`  Delete stale error: ${deleteError.message}`);
    errors.push(`Delete stale: ${deleteError.message}`);
  } else {
    deleted = deletedCount || 0;
    if (deleted > 0) {
      console.log(`  Cleaned up ${deleted} stale records for month ${monthKey}`);
    }
  }

  return { fetched: monthItems.length, upserted, skipped, duplicatesRemoved, deleted, errors, sourceCounts };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const marveeApiUrl = Deno.env.get("MARVEE_API_URL");
    const marveeClientId = Deno.env.get("MARVEE_CLIENT_ID");
    const marveeClientSecret = Deno.env.get("MARVEE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!marveeApiUrl || !marveeClientId || !marveeClientSecret) {
      throw new Error("Missing Marvee API credentials");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { year, sync_all, triggered_by } = body;

    // Kill-switch: if triggered by scheduler, check if automation is active
    if (triggered_by === "scheduled") {
      const { data: config } = await supabase
        .from("automation_config")
        .select("is_active")
        .eq("function_name", "marvee-sync-extrato")
        .single();

      if (!config?.is_active) {
        console.log("Automation marvee-sync-extrato is disabled, skipping scheduled execution");
        return new Response(
          JSON.stringify({ success: false, message: "Automation is disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let startDate: string;
    let endDate: string;

    if (sync_all) {
      startDate = "2020-01-01";
      endDate = new Date().toISOString().split("T")[0];
    } else if (year) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else if (triggered_by === "scheduled") {
      // When triggered by cron, only sync current month
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      startDate = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else {
      const currentYear = new Date().getFullYear();
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
    }

    // Fetch consolidated months to skip them
    const { data: consolidatedMonths } = await supabase
      .from("marvee_extrato_consolidated_months")
      .select("month");
    const consolidatedSet = new Set((consolidatedMonths || []).map((r: { month: string }) => r.month));

    const syncedAt = new Date().toISOString();
    const monthRanges = generateMonthRanges(startDate, endDate);
    console.log(`Syncing extrato from ${startDate} to ${endDate} (${monthRanges.length} months)`);

    const totalStats = { total: 0, upserted: 0, skipped: 0, duplicatesRemoved: 0, deleted: 0, errors: [] as string[] };
    const allSourceCounts: Record<string, number> = {};
    const monthBreakdown: Array<{ month: string; fetched: number; upserted: number }> = [];

    for (const range of monthRanges) {
      const monthKey = range.start.substring(0, 7);
      console.log(`\n--- Month: ${range.start} to ${range.end} ---`);

      // Skip consolidated months
      if (consolidatedSet.has(monthKey)) {
        console.log(`  Month ${monthKey} is consolidated, skipping`);
        monthBreakdown.push({ month: monthKey, fetched: 0, upserted: 0 });
        continue;
      }

      try {
        const result = await fetchAndUpsertMonth(supabase, marveeApiUrl, marveeClientId, marveeClientSecret, range, syncedAt);

        totalStats.total += result.fetched;
        totalStats.upserted += result.upserted;
        totalStats.skipped += result.skipped;
        totalStats.duplicatesRemoved += result.duplicatesRemoved;
        totalStats.deleted += result.deleted;
        totalStats.errors.push(...result.errors);

        for (const [src, count] of Object.entries(result.sourceCounts)) {
          allSourceCounts[src] = (allSourceCounts[src] || 0) + count;
        }

        monthBreakdown.push({ month: range.start.substring(0, 7), fetched: result.fetched, upserted: result.upserted });
        console.log(`  Result: ${result.fetched} fetched, ${result.upserted} upserted, ${result.skipped} skipped`);
      } catch (monthError: unknown) {
        const msg = monthError instanceof Error ? monthError.message : "Unknown error";
        console.error(`  Month ${range.start} failed: ${msg}`);
        totalStats.errors.push(`Month ${range.start}: ${msg}`);
        monthBreakdown.push({ month: range.start.substring(0, 7), fetched: 0, upserted: 0 });
      }

      // Delay between months to avoid rate limiting
      if (range !== monthRanges[monthRanges.length - 1]) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // Log sync
    await supabase.from("marvee_sync_logs").insert({
      sync_type: "extrato",
      status: totalStats.errors.length > 0 ? "partial" : "success",
      records_processed: totalStats.total,
      records_created: totalStats.upserted,
      started_at: syncedAt,
      completed_at: new Date().toISOString(),
      error_message: totalStats.errors.length > 0 ? totalStats.errors.join("; ") : null,
      triggered_by: "manual",
    });

    console.log(`\nSync extrato completed! Total: ${totalStats.total}, Upserted: ${totalStats.upserted}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: totalStats,
        sourceCounts: allSourceCounts,
        monthBreakdown,
        dateRange: { startDate, endDate },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in marvee-sync-extrato:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
