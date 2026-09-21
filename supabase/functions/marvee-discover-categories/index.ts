import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

interface DiscoveredCategory {
  id: string; // structure (e.g., "01.01.01")
  name: string; // formatted as "structure - description"
  description: string;
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
  const startYear = 2020;
  
  // Fetch from 2020 to current year with full pagination
  for (let year = startYear; year <= currentYear; year++) {
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = new URL(`${apiUrl}/v1/contas-a-receber`);
      url.searchParams.set("dateStart", `${year}-01-01`);
      url.searchParams.set("dateEnd", `${year}-12-31`);
      url.searchParams.set("pageSize", "1000");
      url.searchParams.set("page", String(page));

      console.log(`[Discovery] Fetching receivables for ${year}, page ${page}...`);

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
        break;
      }

      const result: MarveePaginatedResponse<MarveeContaAReceber> = await response.json();
      allData.push(...result.data);
      console.log(`[Discovery] Found ${result.data.length} receivables for ${year}, page ${page} of ${result.meta.total_pages}`);
      
      hasMorePages = result.meta.current_page < result.meta.total_pages;
      page++;
    }
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
  const startYear = 2020;
  
  // Fetch from 2020 to current year with full pagination
  for (let year = startYear; year <= currentYear; year++) {
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = new URL(`${apiUrl}/v1/contas-a-pagar`);
      url.searchParams.set("dateStart", `${year}-01-01`);
      url.searchParams.set("dateEnd", `${year}-12-31`);
      url.searchParams.set("date_option", "vencimento");
      url.searchParams.set("pageSize", "1000");
      url.searchParams.set("page", String(page));

      console.log(`[Discovery] Fetching payables for ${year}, page ${page}...`);

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
        break;
      }

      const result: MarveePaginatedResponse<MarveeContaAPagar> = await response.json();
      allData.push(...result.data);
      console.log(`[Discovery] Found ${result.data.length} payables for ${year}, page ${page} of ${result.meta.total_pages}`);
      
      hasMorePages = result.meta.current_page < result.meta.total_pages;
      page++;
    }
  }

  return allData;
}

function extractCategories(
  contasReceber: MarveeContaAReceber[],
  contasPagar: MarveeContaAPagar[]
): DiscoveredCategory[] {
  const categoryMap = new Map<string, { 
    description: string; 
    receivableCount: number; 
    payableCount: number 
  }>();

  // Extract from receivables
  for (const conta of contasReceber) {
    const category = conta.document?.category_level_3;
    if (category && category.structure) {
      const key = category.structure;
      const existing = categoryMap.get(key);
      if (existing) {
        existing.receivableCount++;
      } else {
        categoryMap.set(key, {
          description: category.description || `Categoria ${key}`,
          receivableCount: 1,
          payableCount: 0,
        });
      }
    }
  }

  // Extract from payables
  for (const conta of contasPagar) {
    const category = conta.document?.category_level_3;
    if (category && category.structure) {
      const key = category.structure;
      const existing = categoryMap.get(key);
      if (existing) {
        existing.payableCount++;
      } else {
        categoryMap.set(key, {
          description: category.description || `Categoria ${key}`,
          receivableCount: 0,
          payableCount: 1,
        });
      }
    }
  }

  // Convert to array
  const result: DiscoveredCategory[] = [];
  for (const [structure, data] of categoryMap.entries()) {
    let source: "receivable" | "payable" | "both";
    if (data.receivableCount > 0 && data.payableCount > 0) {
      source = "both";
    } else if (data.receivableCount > 0) {
      source = "receivable";
    } else {
      source = "payable";
    }

    result.push({
      id: structure,
      name: `${structure} - ${data.description}`,
      description: data.description,
      source,
      count: data.receivableCount + data.payableCount,
    });
  }

  // Sort by structure
  result.sort((a, b) => a.id.localeCompare(b.id));

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

    console.log("[Discovery] Starting category discovery...");

    // Fetch sample data from Marvee
    const [contasReceber, contasPagar] = await Promise.all([
      fetchContasReceberSample(marveeApiUrl, marveeClientId, marveeClientSecret),
      fetchContasPagarSample(marveeApiUrl, marveeClientId, marveeClientSecret),
    ]);

    console.log(`[Discovery] Total receivables: ${contasReceber.length}, payables: ${contasPagar.length}`);

    // Extract unique categories
    const categories = extractCategories(contasReceber, contasPagar);

    console.log(`[Discovery] Found ${categories.length} unique categories`);

    // Fetch existing mappings to mark which are already mapped
    const { data: existingMappings } = await supabase
      .from("marvee_category_mapping")
      .select("marvee_category_structure");

    const mappedStructures = new Set(
      (existingMappings || [])
        .map(m => m.marvee_category_structure)
        .filter(Boolean)
    );

    // Annotate with mapping status
    const annotatedCategories = categories.map(cat => ({
      ...cat,
      isMapped: mappedStructures.has(cat.id),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          categories: annotatedCategories,
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
