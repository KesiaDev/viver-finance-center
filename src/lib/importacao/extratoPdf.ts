import { normalizarContraparte } from "@/lib/classificacao/normalize";
import { parseData, parseValor, type LinhaImportada, type Moeda, type ResultadoParse } from "./tipos";

/**
 * Parsers de extratos bancários em PDF (texto já extraído).
 * Suportam os três formatos que recebemos hoje: Itaú, Santander e Wise.
 * Sempre que o extrato traz saldos por dia, eles são devolvidos como âncoras de conferência.
 */

export type BancoExtrato = "itau" | "santander" | "wise";

export interface AncoraSaldo {
  data: string;
  saldo: number;
}

export interface ResultadoExtrato extends ResultadoParse {
  ancoras: AncoraSaldo[];
}

const RE_NUM = /-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g;

export function detetarBanco(texto: string): BancoExtrato | null {
  const t = texto.toUpperCase();
  if (t.includes("WISE") || t.includes("TRANSFERWISE")) return "wise";
  if (t.includes("SANTANDER")) return "santander";
  if (t.includes("LANÇAMENTOS DO PERÍODO") || t.includes("LANCAMENTOS DO PERIODO") || t.includes("ITAÚ") || t.includes("ITAU")) {
    return "itau";
  }
  return null;
}

function limparCpfCnpj(s: string) {
  return s
    .replace(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g, " ")
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------- Itaú
export function parseExtratoItau(texto: string, moeda: Moeda = "BRL"): ResultadoExtrato {
  const avisos: string[] = [];
  const linhas: LinhaImportada[] = [];
  const ancoras: AncoraSaldo[] = [];
  let saldoInicial: number | null = null;
  let saldoFinal: number | null = null;
  let dataSaldoFinal: string | null = null;

  const cruas = texto.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim());
  let prefixo: string[] = [];

  for (const linha of cruas) {
    if (!linha) continue;
    const m = linha.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.*)$/);
    if (!m) {
      prefixo.push(linha);
      continue;
    }
    const data = parseData(m[1])!;
    const resto = m[2];
    // o valor está sempre no fim da linha; um número solto no meio é CNPJ/CPF
    const fimLinha = resto.match(/(-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*$/);
    const ultimo = fimLinha ? fimLinha[1] : null;


    const upper = resto.toUpperCase();

    if (upper.includes("SALDO ANTERIOR")) {
      saldoInicial = ultimo ? parseValor(ultimo) : null;
      prefixo = [];
      continue;
    }
    if (upper.includes("SALDO")) {
      if (upper.includes("SALDO TOTAL") && ultimo) {
        const v = parseValor(ultimo);
        if (v != null) {
          ancoras.push({ data, saldo: v });
          saldoFinal = v;
          dataSaldoFinal = data;
        }
      }
      prefixo = [];
      continue;
    }

    if (!ultimo) {
      linhas.push({
        data,
        descricao: limparCpfCnpj([...prefixo, resto].join(" ")),
        valor: 0,
        moeda,
        erro: "Valor ilegível nesta linha",
      });
      prefixo = [];
      continue;
    }

    const valor = parseValor(ultimo);
    const descricaoCompleta = limparCpfCnpj(
      [...prefixo, resto.slice(0, resto.lastIndexOf(ultimo))].join(" "),
    );
    // "PIX ENVIADO", "BOLETO PAGO", "TED", ... vêm à frente do nome da contraparte
    const tipoMov = descricaoCompleta.match(
      /^(PIX ENVIADO|PIX RECEBIDO|BOLETO PAGO|TED|DOC|TAR\w*|PAGAMENTOS DIGITAL|APLICA\w*|RESGATE\w*)/i,
    );
    const contraparte = tipoMov
      ? descricaoCompleta.slice(tipoMov[0].length).trim()
      : descricaoCompleta;

    linhas.push({
      data,
      descricao: descricaoCompleta || "(sem descrição)",
      contraparte: normalizarContraparte(contraparte || descricaoCompleta),
      valor: valor ?? 0,
      moeda,
      erro: valor == null ? "Valor ilegível nesta linha" : null,
    });
    prefixo = [];
  }

  if (!linhas.length) avisos.push("Não encontrei movimentos neste extrato do Itaú.");
  return { linhas, ancoras, saldoInicial, saldoFinal, dataSaldoFinal, moeda, avisos };
}

// ----------------------------------------------------------- Santander
export function parseExtratoSantander(
  texto: string,
  moeda: Moeda = "BRL",
  cnpjsConhecidos: Record<string, string> = {},
): ResultadoExtrato {

  const avisos: string[] = [];
  const linhas: LinhaImportada[] = [];
  const ancoras: AncoraSaldo[] = [];
  let saldoFinal: number | null = null;
  let dataSaldoFinal: string | null = null;

  const cruas = texto.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim());
  const fundidas: string[] = [];
  for (let i = 0; i < cruas.length; i++) {
    let linha = cruas[i];
    if (!linha) continue;
    if (/^\d{2}\/\d{2}\/\d{4}\s/.test(linha)) {
      while ((linha.match(RE_NUM) ?? []).length < 2 && i + 1 < cruas.length) {
        const seg = cruas[i + 1];
        if (!seg || /^\d{2}\/\d{2}\/\d{4}\s/.test(seg)) break;
        linha = `${linha} ${seg}`.replace(/\s+/g, " ").trim();
        i++;
      }
    }
    fundidas.push(linha);
  }

  for (const linha of fundidas) {
    const mSaldo = linha.match(/Saldo de ContaMax\s+(-?[\d.]*\d,\d{2})/i);
    if (mSaldo) {
      saldoFinal = parseValor(mSaldo[1]);
      continue;
    }
    const m = linha.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.*)$/);
    if (!m) continue;
    const data = parseData(m[1])!;
    const numeros = m[2].match(RE_NUM) ?? [];
    if (numeros.length < 2) continue;

    const saldoTxt = numeros[numeros.length - 1];
    const valorTxt = numeros[numeros.length - 2];
    const valor = parseValor(valorTxt);
    const saldo = parseValor(saldoTxt);
    if (valor == null) continue;

    const trecho = m[2].slice(0, m[2].lastIndexOf(valorTxt));
    const doc = trecho.match(/\b(\d{11,14})\b/)?.[1] ?? null;
    const descricao = limparCpfCnpj(trecho)
      .replace(/\b\d{10,}\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // "Ted Recebida", "Pix Recebido"… são o tipo do movimento, não a contraparte
    const semTipo = descricao
      .replace(/^(Ted Recebida|Ted Enviada|Pix Recebido|Pix Enviado|Debito Aut\.?|Credito|Deposito)\s*/i, "")
      .trim();
    const contraparte =
      normalizarContraparte(semTipo) ||
      (doc && cnpjsConhecidos[doc] ? normalizarContraparte(cnpjsConhecidos[doc]) : "") ||
      "DESCONHECIDO";

    linhas.push({
      data,
      descricao: descricao || "(sem descrição)",
      contraparte,
      valor,
      moeda,
    });

    if (saldo != null) {
      ancoras.push({ data, saldo });
      saldoFinal = saldoFinal ?? saldo;
      dataSaldoFinal = data;
    }
  }

  if (!linhas.length) avisos.push("Não encontrei movimentos neste extrato do Santander.");
  return { linhas, ancoras, saldoFinal, dataSaldoFinal, moeda, avisos };
}

// ---------------------------------------------------------------- Wise
const RE_WISE_DATA = /^(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})\s*\|/i;

export function parseExtratoWise(texto: string, moeda: Moeda = "EUR"): ResultadoExtrato {
  const avisos: string[] = [];
  const linhas: LinhaImportada[] = [];
  let saldoFinal: number | null = null;
  let dataSaldoFinal: string | null = null;

  const cruas = texto.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim());

  const mSaldo = texto.match(
    /(BRL|EUR|USD)\s+em\s+(\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4})[^\n]*?([\d.]*\d,\d{2})\s*(?:BRL|EUR|USD)/i,
  );
  if (mSaldo) {
    saldoFinal = parseValor(mSaldo[3]);
    dataSaldoFinal = parseData(mSaldo[2]);
  }

  let buffer: string[] = [];
  for (const linha of cruas) {
    if (!linha) continue;
    const mData = linha.match(RE_WISE_DATA);
    if (!mData) {
      if (/^(Baixar anexos|ref:|Descrição|A Wise|Precisa de ajuda)/i.test(linha)) {
        buffer = [];
        continue;
      }
      buffer.push(linha);
      continue;
    }

    const texto2 = buffer.join(" ").replace(/\s+/g, " ").trim();
    buffer = [];
    if (!texto2) continue;

    const numeros = texto2.match(RE_NUM) ?? [];
    if (numeros.length < 2) continue;
    const valorTxt = numeros[numeros.length - 2];
    const valor = parseValor(valorTxt);
    if (valor == null) continue;

    const data = parseData(`${mData[1]} de ${mData[2]} de ${mData[3]}`)!;
    const idMatch = linha.match(/Transação:\s*([A-Z0-9-]+)/i);
    const refMatch = linha.match(/Referência:\s*(.+)$/i);
    const descricaoBase = texto2.slice(0, texto2.lastIndexOf(valorTxt)).trim();

    let contraparte = "";
    let m: RegExpMatchArray | null;
    if ((m = descricaoBase.match(/Enviou dinheiro para\s+(.+?)\s*$/i))) contraparte = m[1];
    else if ((m = descricaoBase.match(/Recebeu dinheiro de\s+(.+?)(?:\s+com a referência.*)?$/i))) contraparte = m[1];
    else if ((m = descricaoBase.match(/emitida por\s+(.+?)\s*$/i))) contraparte = m[1];
    else contraparte = descricaoBase;

    const descricao = [descricaoBase, refMatch ? `Ref: ${refMatch[1].trim()}` : null]
      .filter(Boolean)
      .join(" — ");

    linhas.push({
      data,
      descricao: descricao || "(sem descrição)",
      contraparte: normalizarContraparte(contraparte.replace(/"/g, "")),
      valor,
      moeda,
      external_id: idMatch ? idMatch[1] : null,
    });
  }

  if (!linhas.length) avisos.push("Não encontrei movimentos neste extrato da Wise.");
  return { linhas, ancoras: [], saldoFinal, dataSaldoFinal, moeda, avisos };
}

export function parseExtratoPdf(
  texto: string,
  moeda: Moeda,
  banco?: BancoExtrato | null,
  cnpjsConhecidos: Record<string, string> = {},
): ResultadoExtrato {
  const alvo = banco ?? detetarBanco(texto);
  if (alvo === "wise") return parseExtratoWise(texto, moeda);
  if (alvo === "santander") return parseExtratoSantander(texto, moeda, cnpjsConhecidos);
  if (alvo === "itau") return parseExtratoItau(texto, moeda);
  return { linhas: [], ancoras: [], avisos: ["Não reconheci o banco deste extrato."] };
}

