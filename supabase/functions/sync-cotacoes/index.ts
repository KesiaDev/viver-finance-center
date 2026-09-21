import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OLINDA =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)";

interface PtaxRow {
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

function fmtUS(d: string) {
  const [a, m, dia] = d.split("-");
  return `${m}-${dia}-${a}`;
}

async function buscarPtax(moeda: "EUR" | "USD", de: string, ate: string): Promise<PtaxRow[]> {
  const url =
    `${OLINDA}?@moeda='${moeda}'&@dataInicial='${fmtUS(de)}'&@dataFinalCotacao='${fmtUS(ate)}'` +
    `&$format=json&$select=cotacaoVenda,dataHoraCotacao`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Banco Central respondeu ${resp.status}`);
  const json = await resp.json();
  return (json?.value ?? []) as PtaxRow[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: { de?: string; ate?: string; moedas?: string[] } = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    }

    const hoje = new Date().toISOString().slice(0, 10);
    // por omissão traz os últimos 7 dias para cobrir feriados e fins de semana
    const padraoDe = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const de = body.de ?? padraoDe;
    const ate = body.ate ?? hoje;
    const moedas = (body.moedas ?? ["EUR", "USD"]) as ("EUR" | "USD")[];

    const registos: {
      data: string;
      moeda: string;
      taxa_brl: number;
      fonte: string;
    }[] = [];

    for (const moeda of moedas) {
      const rows = await buscarPtax(moeda, de, ate);
      // o Banco Central publica vários boletins por dia: fica o último de cada dia
      const porDia = new Map<string, { hora: string; taxa: number }>();
      for (const r of rows) {
        if (!r?.cotacaoVenda || !r?.dataHoraCotacao) continue;
        const dia = r.dataHoraCotacao.slice(0, 10);
        const anterior = porDia.get(dia);
        if (!anterior || r.dataHoraCotacao > anterior.hora) {
          porDia.set(dia, { hora: r.dataHoraCotacao, taxa: Number(r.cotacaoVenda) });
        }
      }
      for (const [data, v] of porDia) {
        registos.push({ data, moeda, taxa_brl: v.taxa, fonte: "bcb_ptax" });
      }
    }

    if (registos.length) {
      const { error } = await supabase
        .from("cotacoes")
        .upsert(registos, { onConflict: "data,moeda,fonte" });
      if (error) throw error;
    }


    return new Response(
      JSON.stringify({ ok: true, periodo: { de, ate }, gravadas: registos.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sync-cotacoes", e);
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
