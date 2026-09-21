import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarveeCostCenter {
  id: number;
  name: string;
}

interface MarveeDocument {
  cost_centers?: MarveeCostCenter[];
}

interface MarveeContaAReceber {
  id: number;
  document?: MarveeDocument;
}

interface MarveeContaAPagar {
  id: number;
  document?: MarveeDocument;
}

interface MarveePaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

interface DiscoveredCostCenter {
  id: string;
  name: string;
  source: "receivable" | "payable" | "both";
  count: number;
}

async function fetchContasReceberSample(
  apiUrl: string,
  clientId: string,
  clientSecret: string
): Promise<MarveeContaAReceber[]> {
  const allData: MarveeContaAReceber[] = [];
  const currentYear = new Date().getFullYear();
  
  // Fetch from current year and previous year
  for (const year of [currentYear, currentYear - 1]) {
    const url = new URL(`${apiUrl}/v1/contas-a-receber`);
    url.searchParams.set("dateStart", `${year}-01-01`);
    url.searchParams.set("dateEnd", `${year}-12-31`);
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("page", "1");

    console.log(`[Discovery] Fetching receivables for ${year}...`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "client-id": clientId,
        "authorization": clientSecret,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Discovery] Error fetching receivables for ${year}:`, await response.text());
      continue;
    }

    const result: MarveePaginatedResponse<MarveeContaAReceber> = await response.json();
    allData.push(...result.data);
    console.log(`[Discovery] Found ${result.data.length} receivables for ${year}`);
  }

  return allData;
}

async function fetchContasPagarSample(
  apiUrl: string,
  clientId: string,
  clientSecret: string
): Promise<MarveeContaAPagar[]> {
  const allData: MarveeContaAPagar[] = [];
  const currentYear = new Date().getFullYear();
  
  // Fetch from current year and previous year
  for (const year of [currentYear, currentYear - 1]) {
    const url = new URL(`${apiUrl}/v1/contas-a-pagar`);
    url.searchParams.set("dateStart", `${year}-01-01`);
    url.searchParams.set("dateEnd", `${year}-12-31`);
    url.searchParams.set("date_option", "vencimento");
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("page", "1");

    console.log(`[Discovery] Fetching payables for ${year}...`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "client-id": clientId,
        "authorization": clientSecret,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Discovery] Error fetching payables for ${year}:`, await response.text());
      continue;
    }

    const result: MarveePaginatedResponse<MarveeContaAPagar> = await response.json();
    allData.push(...result.data);
    console.log(`[Discovery] Found ${result.data.length} payables for ${year}`);
  }

  return allData;
}

function extractCostCenters(
  contasReceber: MarveeContaAReceber[],
  contasPagar: MarveeContaAPagar[]
): DiscoveredCostCenter[] {
  const costCenterMap = new Map<string, { name: string; receivableCount: number; payableCount: number }>();

  // Extract from receivables
  for (const conta of contasReceber) {
    const costCenters = conta.document?.cost_centers || [];
    for (const costCenter of costCenters) {
      if (costCenter && costCenter.id) {
        const id = String(costCenter.id);
        const existing = costCenterMap.get(id);
        if (existing) {
          existing.receivableCount++;
        } else {
          costCenterMap.set(id, {
            name: costCenter.name || `Centro de Custo ${id}`,
            receivableCount: 1,
            payableCount: 0,
          });
        }
      }
    }
  }

  // Extract from payables
  for (const conta of contasPagar) {
    const costCenters = conta.document?.cost_centers || [];
    for (const costCenter of costCenters) {
      if (costCenter && costCenter.id) {
        const id = String(costCenter.id);
        const existing = costCenterMap.get(id);
        if (existing) {
          existing.payableCount++;
        } else {
          costCenterMap.set(id, {
            name: costCenter.name || `Centro de Custo ${id}`,
            receivableCount: 0,
            payableCount: 1,
          });
        }
      }
    }
  }

  // Convert to array
  const result: DiscoveredCostCenter[] = [];
  for (const [id, data] of costCenterMap.entries()) {
    let source: "receivable" | "payable" | "both";
    if (data.receivableCount > 0 && data.payableCount > 0) {
      source = "both";
    } else if (data.receivableCount > 0) {
      source = "receivable";
    } else {
      source = "payable";
    }

    result.push({
      id,
      name: data.name,
      source,
      count: data.receivableCount + data.payableCount,
    });
  }

  // Sort by count (most used first)
  result.sort((a, b) => b.count - a.count);

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const marveeApiUrl = Deno.env.get("MARVEE_API_URL")!;
    const marveeClientId = Deno.env.get("MARVEE_CLIENT_ID")!;
    const marveeClientSecret = Deno.env.get("MARVEE_CLIENT_SECRET")!;

    if (!marveeApiUrl || !marveeClientId || !marveeClientSecret) {
      throw new Error("Missing Marvee API configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[Discovery] Starting cost center discovery...");

    // Fetch sample data from Marvee
    const [contasReceber, contasPagar] = await Promise.all([
      fetchContasReceberSample(marveeApiUrl, marveeClientId, marveeClientSecret),
      fetchContasPagarSample(marveeApiUrl, marveeClientId, marveeClientSecret),
    ]);

    console.log(`[Discovery] Total receivables: ${contasReceber.length}, payables: ${contasPagar.length}`);

    // Extract unique cost centers
    const costCenters = extractCostCenters(contasReceber, contasPagar);

    console.log(`[Discovery] Found ${costCenters.length} unique cost centers`);

    // Fetch existing mappings to mark which are already mapped
    const { data: existingMappings } = await supabase
      .from("marvee_category_mapping")
      .select("marvee_cost_center_id");

    const mappedIds = new Set((existingMappings || []).map(m => m.marvee_cost_center_id));

    // Annotate with mapping status
    const annotatedCostCenters = costCenters.map(cc => ({
      ...cc,
      isMapped: mappedIds.has(cc.id),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          costCenters: annotatedCostCenters,
          totalReceivables: contasReceber.length,
          totalPayables: contasPagar.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[Discovery] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
