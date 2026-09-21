import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Recebe um PDF (base64) e devolve o texto por página.
 * Usado para extrair as linhas de faturas de cartão em PDF antes de confirmar a importação.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ficheiro_base64 } = await req.json();
    if (!ficheiro_base64) throw new Error("Ficheiro em falta");

    const binario = Uint8Array.from(atob(ficheiro_base64), (c) => c.charCodeAt(0));
    const pdf = await getDocumentProxy(binario);
    const { text, totalPages } = await extractText(pdf, { mergePages: false });

    return new Response(
      JSON.stringify({ ok: true, paginas: text, total_paginas: totalPages }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("pdf-extrair-texto", e);
    return new Response(
      JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
