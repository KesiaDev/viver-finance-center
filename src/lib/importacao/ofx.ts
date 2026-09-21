import { parseData, parseValor, type LinhaImportada, type Moeda, type ResultadoParse } from "./tipos";

function tags(bloco: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}>([\\s\\S]*?)(?=<|$)`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloco))) out.push(m[1].trim());
  return out;
}

function tag(bloco: string, ...nomes: string[]): string | null {
  for (const n of nomes) {
    const v = tags(bloco, n)[0];
    if (v) return v;
  }
  return null;
}

/**
 * Parser nativo de OFX (Itaú, Santander). Lê DTPOSTED, TRNAMT, NAME/MEMO, FITID
 * e o saldo final em LEDGERBAL.
 */
export function parseOfx(texto: string, moedaConta: Moeda = "BRL"): ResultadoParse {
  const avisos: string[] = [];
  const conteudo = texto.replace(/\r/g, "");
  const moedaFicheiro = (tag(conteudo, "CURDEF") ?? moedaConta).toUpperCase();
  const moeda = (["BRL", "EUR", "USD"].includes(moedaFicheiro) ? moedaFicheiro : moedaConta) as Moeda;

  const blocos = conteudo.split(/<STMTTRN>/i).slice(1);
  const linhas: LinhaImportada[] = [];

  for (const bruto of blocos) {
    const bloco = bruto.split(/<\/STMTTRN>/i)[0];
    const data = parseData(tag(bloco, "DTPOSTED"));
    const valor = parseValor(tag(bloco, "TRNAMT"));
    const nome = tag(bloco, "NAME");
    const memo = tag(bloco, "MEMO");
    const fitid = tag(bloco, "FITID");
    const descricao = [nome, memo].filter(Boolean).join(" — ") || "(sem descrição)";

    if (!data || valor == null) {
      linhas.push({
        data: data ?? "",
        descricao,
        valor: valor ?? 0,
        moeda,
        external_id: fitid,
        erro: !data ? "Data inválida" : "Valor inválido",
      });
      continue;
    }

    linhas.push({
      data,
      descricao,
      contraparte: nome ?? memo ?? null,
      valor,
      moeda,
      external_id: fitid,
      raw: { nome, memo, fitid },
    });
  }

  if (!linhas.length) avisos.push("Nenhuma transação encontrada no ficheiro OFX.");

  // Saldo final (LEDGERBAL)
  let saldoFinal: number | null = null;
  let dataSaldoFinal: string | null = null;
  const ledger = conteudo.split(/<LEDGERBAL>/i)[1];
  if (ledger) {
    saldoFinal = parseValor(tag(ledger, "BALAMT"));
    dataSaldoFinal = parseData(tag(ledger, "DTASOF"));
  }

  const dtend = parseData(tag(conteudo, "DTEND"));
  return {
    linhas,
    moeda,
    saldoFinal,
    dataSaldoFinal: dataSaldoFinal ?? dtend,
    avisos,
  };
}
