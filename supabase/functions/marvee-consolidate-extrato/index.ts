import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { triggered_by } = body;

    // Kill-switch: check if automation is active for scheduled runs
    if (triggered_by === "scheduled") {
      const { data: config } = await supabase
        .from("automation_config")
        .select("is_active")
        .eq("function_name", "marvee-consolidate-extrato")
        .single();

      if (!config?.is_active) {
        console.log("Automation marvee-consolidate-extrato is disabled, skipping");
        return new Response(
          JSON.stringify({ success: false, message: "Automation is disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

    console.log(`Consolidating month: ${monthKey}`);

    // Check if already consolidated
    const { data: existing } = await supabase
      .from("marvee_extrato_consolidated_months")
      .select("month")
      .eq("month", monthKey)
      .maybeSingle();

    if (existing) {
      console.log(`Month ${monthKey} already consolidated, skipping`);
      return new Response(
        JSON.stringify({ success: true, message: `Month ${monthKey} already consolidated` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark all records of that month as consolidated
    const { count: updatedCount, error: updateError } = await supabase
      .from("marvee_extrato")
      .update({ consolidated: true })
      .eq("month", monthKey)
      .eq("consolidated", false)
      .select("*", { count: "exact", head: true });

    if (updateError) {
      throw new Error(`Failed to update records: ${updateError.message}`);
    }

    console.log(`Marked ${updatedCount || 0} records as consolidated for ${monthKey}`);

    // Insert into consolidated months control table
    const { error: insertError } = await supabase
      .from("marvee_extrato_consolidated_months")
      .insert({ month: monthKey, consolidated_at: new Date().toISOString() });

    if (insertError) {
      throw new Error(`Failed to insert consolidated month: ${insertError.message}`);
    }

    // Log sync
    await supabase.from("marvee_sync_logs").insert({
      sync_type: "consolidation",
      status: "success",
      records_processed: updatedCount || 0,
      records_updated: updatedCount || 0,
      started_at: now.toISOString(),
      completed_at: new Date().toISOString(),
      triggered_by: triggered_by || "manual",
    });

    console.log(`Consolidation complete for ${monthKey}`);

    return new Response(
      JSON.stringify({
        success: true,
        month: monthKey,
        records_consolidated: updatedCount || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in marvee-consolidate-extrato:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
