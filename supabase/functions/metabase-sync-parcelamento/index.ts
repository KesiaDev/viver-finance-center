import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DASHBOARD_UUID = "b9dca3ff-466a-4626-b0e2-4d7845c6979f";
const METABASE_BASE = "https://hubla.metabaseapp.com/api/public";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch dashboard metadata
    console.log("Fetching dashboard metadata...");
    const dashRes = await fetch(`${METABASE_BASE}/dashboard/${DASHBOARD_UUID}`);
    if (!dashRes.ok) {
      throw new Error(`Failed to fetch dashboard: ${dashRes.status}`);
    }
    const dashboard = await dashRes.json();

    // 2. Extract dashcard info
    const dashcards = (dashboard.dashcards || dashboard.ordered_cards || [])
      .filter((dc: any) => dc.card && dc.card.id)
      .map((dc: any) => ({
        dashcard_id: dc.id,
        card_id: dc.card.id,
        card_name: dc.card.name || `card_${dc.card.id}`,
      }));

    console.log(`Found ${dashcards.length} cards`);

    // 3. Fetch data from each card
    const results: { card_name: string; rows: number }[] = [];

    // Use service role for upsert
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    for (const dc of dashcards) {
      try {
        console.log(`Fetching card: ${dc.card_name} (dashcard=${dc.dashcard_id}, card=${dc.card_id})`);
        const cardRes = await fetch(
          `${METABASE_BASE}/dashboard/${DASHBOARD_UUID}/dashcard/${dc.dashcard_id}/card/${dc.card_id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parameters: [] }),
          }
        );

        if (!cardRes.ok) {
          console.error(`Card ${dc.card_name} failed: ${cardRes.status}`);
          continue;
        }

        const cardData = await cardRes.json();
        const rows = cardData?.data?.rows || [];
        const cols = (cardData?.data?.cols || []).map((c: any) => c.name);

        // Upsert into DB
        const { error: upsertError } = await supabaseAdmin
          .from("parcelamento_dashboard_data")
          .upsert(
            {
              card_name: dc.card_name,
              card_data: { cols, rows, row_count: rows.length },
              synced_at: new Date().toISOString(),
            },
            { onConflict: "card_name" }
          );

        if (upsertError) {
          console.error(`Upsert error for ${dc.card_name}:`, upsertError);
        } else {
          results.push({ card_name: dc.card_name, rows: rows.length });
        }
      } catch (e) {
        console.error(`Error processing card ${dc.card_name}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_cards: results.length,
        cards: results,
        synced_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
