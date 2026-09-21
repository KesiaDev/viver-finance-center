import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Representante legal da LLMIDIA que assina os contratos
const REPRESENTANTE_NOME = Deno.env.get("CONTRATO_REPRESENTANTE_NOME") ?? "Luciano Larrossa";
const REPRESENTANTE_EMAIL = Deno.env.get("CONTRATO_REPRESENTANTE_EMAIL") ?? "luciano@llmidiaco.com";


function isHtmlContent(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<HTML")
  );
}

function textToHtml(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  const body = paragraphs
    .map((p) => {
      const inner = p.trim().replace(/\n/g, "<br>");
      return `  <p>${inner}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.6; margin: 40px 60px; color: #222; }
  p { margin-bottom: 12px; text-align: justify; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function replacePlaceholders(template: string, solicitacao: any): string {
  const dataInicio = new Date(solicitacao.data_inicio_contrato).toLocaleDateString("pt-BR");
  const remuneracao = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(solicitacao.remuneracao));
  const remuneracaoExtenso = solicitacao.remuneracao_extenso || "";
  const remuneracaoCompleta = remuneracaoExtenso ? `${remuneracao} (${remuneracaoExtenso})` : remuneracao;

  const hoje = new Date();
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const dataDocumento = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  const replacements: Record<string, string> = {
    "{{nome}}": solicitacao.nome || "",
    "{{cnpj}}": solicitacao.cnpj || "",
    "{{endereco}}": solicitacao.endereco || "",
    "{{email}}": solicitacao.email || "",
    "{{funcao}}": solicitacao.funcao || "",
    "{{area}}": solicitacao.area || "",
    "{{remuneracao}}": remuneracao,
    "{{remuneracao_extenso}}": remuneracaoExtenso,
    "{{remuneracao_completa}}": remuneracaoCompleta,
    "{{escopo_trabalho}}": solicitacao.escopo_trabalho || "",
    "{{data_inicio}}": dataInicio,
    "{{data_documento}}": dataDocumento,
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
}

async function getContractTemplate(supabase: any, funcao: string): Promise<string | null> {
  const { data: exact } = await supabase
    .from("modelos_contrato")
    .select("conteudo")
    .ilike("cargo_funcao", funcao)
    .limit(1)
    .single();
  if (exact?.conteudo) return exact.conteudo;

  const { data: def } = await supabase
    .from("modelos_contrato")
    .select("conteudo")
    .eq("is_default", true)
    .limit(1)
    .single();
  if (def?.conteudo) return def.conteudo;

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const autentiqueToken = Deno.env.get("AUTENTIQUE_API_TOKEN");

    const supabase = createClient(supabaseUrl, serviceKey);

    const { solicitacaoId, mode, content: providedContent } = await req.json();

    if (!solicitacaoId) {
      return new Response(JSON.stringify({ error: "solicitacaoId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: solicitacao, error: fetchError } = await supabase
      .from("solicitacoes_contrato")
      .select("*")
      .eq("id", solicitacaoId)
      .single();

    if (fetchError || !solicitacao) {
      return new Response(JSON.stringify({ error: "Solicitação não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generateContent = async (): Promise<string> => {
      const template = await getContractTemplate(supabase, solicitacao.funcao);
      if (template) {
        return replacePlaceholders(template, solicitacao);
      }
      // Hardcoded fallback (legacy)
      const dataInicio = new Date(solicitacao.data_inicio_contrato).toLocaleDateString("pt-BR");
      const remuneracao = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(solicitacao.remuneracao));
      const remuneracaoExtenso = solicitacao.remuneracao_extenso || "";
      const remuneracaoCompleta = remuneracaoExtenso ? `${remuneracao} (${remuneracaoExtenso})` : remuneracao;
      const hoje = new Date();
      const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
      const dataAssinatura = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
      return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nPelo presente instrumento particular de contrato de prestação de serviços ("Contrato"), de um lado:\n\nCONTRATANTE: LLMIDIA - CURSOS E TREINAMENTOS LTDA., pessoa jurídica de direito privado, inscrita no CNPJ sob nº 28.469.058/0001-06, com sede na Av. Presidente Juscelino Kubitschek de Oliveira, nº 3161, Apt 410, Centro, Pelotas/RS, CEP 96.020-045, neste ato representada por seu sócio-administrador, ${REPRESENTANTE_NOME}.\n\nCONTRATADA: ${solicitacao.nome}, ${solicitacao.cnpj ? `pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${solicitacao.cnpj}, ` : ""}com endereço em ${solicitacao.endereco}.\n\nPelotas, ${dataAssinatura}.`;
    };

    // PREVIEW MODE
    if (mode === "preview") {
      const contractContent = await generateContent();
      return new Response(
        JSON.stringify({ success: true, content: contractContent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SEND MODE
    if (!autentiqueToken) {
      console.warn("AUTENTIQUE_API_TOKEN not configured.");
      return new Response(
        JSON.stringify({ success: true, message: "Aprovado (token Autentique não configurado)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contractContent = providedContent || await generateContent();

    // Detect if content is already HTML; if not, convert
    const htmlContent = isHtmlContent(contractContent) ? contractContent : textToHtml(contractContent);

    const mutation = `
      mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
        createDocument(sandbox: false, document: $document, signers: $signers, file: $file) {
          id
          name
          signatures { public_id name email action { name } }
        }
      }
    `;

    const operations = JSON.stringify({
      query: mutation,
      variables: {
        document: { name: `Contrato PJ - ${solicitacao.nome}` },
        signers: [
          { email: REPRESENTANTE_EMAIL, action: "SIGN", name: REPRESENTANTE_NOME },
          { email: solicitacao.email, action: "SIGN", name: solicitacao.nome },
        ],
        file: null,
      },
    });

    const encoder = new TextEncoder();
    const contractBlob = new Blob([encoder.encode(htmlContent)], { type: "text/html" });

    const formData = new FormData();
    formData.append("operations", operations);
    formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
    formData.append("0", contractBlob, `contrato-${solicitacao.nome.replace(/\s+/g, "-")}.html`);

    const autentiqueResponse = await fetch("https://api.autentique.com.br/v2/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${autentiqueToken}` },
      body: formData,
    });

    const autentiqueData = await autentiqueResponse.json();
    console.log("Autentique response:", JSON.stringify(autentiqueData));

    if (autentiqueData.errors) {
      console.error("Autentique errors:", autentiqueData.errors);
      return new Response(
        JSON.stringify({ error: "Erro na API Autentique", details: autentiqueData.errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const docId = autentiqueData?.data?.createDocument?.id;

    await supabase
      .from("solicitacoes_contrato")
      .update({
        autentique_doc_id: docId || null,
        contrato_url: docId ? `https://app.autentique.com.br/documentos/${docId}` : null,
      })
      .eq("id", solicitacaoId);

    return new Response(
      JSON.stringify({ success: true, documentId: docId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
