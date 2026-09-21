const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PAGES = 200;
const RETRY_ATTEMPTS = 3;

function toBrazilDate(dateStr: string): string {
  return `${dateStr}T00:00:00.000-03:00`;
}

function toBrazilDateEnd(dateStr: string): string {
  return `${dateStr}T23:59:59.999-03:00`;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(
  baseUrl: string,
  endpoint: string,
  params: Record<string, string>,
  page: number,
  headers: Record<string, string>
) {
  const url = new URL(`${baseUrl}/v1/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.set("page", String(page));

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    const response = await fetch(url.toString(), { headers });

    if (response.status === 429) {
      const body = await response.json().catch(() => ({}));
      const retryAfter = body?.errors?.[0]?.retryAfter;
      const waitSec = typeof retryAfter === "number" && retryAfter > 0 ? retryAfter : Math.pow(2, attempt + 1) * 5;
      console.log(`Rate limited on page ${page}, waiting ${waitSec}s (attempt ${attempt + 1}/${RETRY_ATTEMPTS})`);
      await sleep(waitSec * 1000);
      continue;
    }

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  }

  return { ok: false, status: 429, data: { errors: [{ message: "Max retries exceeded" }] } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const marveeApiUrl = Deno.env.get("MARVEE_API_URL");
    const marveeClientId = Deno.env.get("MARVEE_CLIENT_ID");
    const marveeClientSecret = Deno.env.get("MARVEE_CLIENT_SECRET");

    if (!marveeApiUrl || !marveeClientId || !marveeClientSecret) {
      throw new Error("Missing Marvee API credentials");
    }

    const { endpoint, params, fetchAll } = await req.json();

    if (!["contas-a-pagar", "contas-a-receber", "extrato"].includes(endpoint)) {
      throw new Error("Invalid endpoint. Use 'contas-a-pagar', 'contas-a-receber' or 'extrato'");
    }

    const apiHeaders = {
      Accept: "application/json",
      "client-id": marveeClientId,
      authorization: marveeClientSecret,
    };

    const startTime = Date.now();

    // Fetch first page
    const cleanParams: Record<string, string> = {};
    if (params && typeof params === "object") {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = String(value);
        }
      }
    }

    // Padronizar datas para formato com timezone de Brasília
    if (cleanParams.dateStart) {
      cleanParams.dateStart = toBrazilDate(cleanParams.dateStart);
    }
    if (cleanParams.dateEnd) {
      cleanParams.dateEnd = toBrazilDateEnd(cleanParams.dateEnd);
    }

    const firstResult = await fetchPage(marveeApiUrl, endpoint, cleanParams, Number(cleanParams.page) || 1, apiHeaders);

    if (!firstResult.ok) {
      const elapsed = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: false,
          status: firstResult.status,
          elapsed_ms: elapsed,
          response: firstResult.data,
        }),
        { status: firstResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const meta = firstResult.data?.meta;
    let allData = firstResult.data?.data || [];
    let pagesFetched = 1;
    let truncated = false;

    if (fetchAll && meta && meta.last_page > 1) {
      const maxPage = Math.min(meta.last_page, MAX_PAGES);
      const startPage = (Number(cleanParams.page) || 1) + 1;

      console.log(`fetchAll: fetching pages ${startPage} to ${maxPage} (last_page=${meta.last_page})`);

      for (let p = startPage; p <= maxPage; p++) {
        const result = await fetchPage(marveeApiUrl, endpoint, cleanParams, p, apiHeaders);
        if (result.ok && result.data?.data) {
          allData = allData.concat(result.data.data);
          pagesFetched++;
        } else {
          console.error(`Failed to fetch page ${p}: status ${result.status}`);
          break;
        }
      }

      if (meta.last_page > MAX_PAGES) {
        truncated = true;
      }
    }

    const elapsed = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        status: 200,
        elapsed_ms: elapsed,
        response: {
          data: allData,
          meta: {
            ...meta,
            pages_fetched: pagesFetched,
            truncated,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("marvee-api-test error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
