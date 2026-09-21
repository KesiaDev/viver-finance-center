import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedHottok = Deno.env.get("HOTMART_HOTTOK");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Hotmart sends the hottok in the header (v2) or in the body (v1)
  const receivedHottok =
    req.headers.get("x-hotmart-hottok") ??
    (typeof body.hottok === "string" ? body.hottok : null);

  if (!expectedHottok) {
    console.error("HOTMART_HOTTOK not configured");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (receivedHottok !== expectedHottok) {
    console.warn("Invalid hottok received");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const creationDate = body.creation_date as number | undefined;

  const record = {
    event_id: (body.id as string | undefined) ?? null,
    event: (body.event as string | undefined) ?? null,
    version: (body.version as string | undefined) ?? null,
    occurred_at: creationDate ? new Date(creationDate).toISOString() : null,
    payload: body,
  };

  const { error } = await supabase
    .from("hotmart_webhook_events")
    .upsert(record, { onConflict: "event_id", ignoreDuplicates: true });

  if (error) {
    console.error("Failed to store Hotmart event", error.message);
    return new Response(JSON.stringify({ error: "Storage error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("Hotmart event stored", record.event, record.event_id);

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
