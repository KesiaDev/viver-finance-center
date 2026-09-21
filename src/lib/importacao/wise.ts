import { normalizarContraparte } from "@/lib/classificacao/normalize";
import { parseData, parseValor, type LinhaImportada, type Moeda, type ResultadoParse } from "./tipos";

function cabecalhoIndex(cols: string[], ...candidatos: string[]): number {
  const norm = cols.map((c) => c.toLowerCase().replace(/[^a-z]/g, ""));
  for (const cand of candidatos) {
    const alvo = cand.toLowerCase().replace(/[^a-z]/g, "");
    const i = norm.indexOf(alvo);
    if (i >= 0) return i;
  }
  for (const cand of candidatos) {
    const alvo = cand.toLowerCase().replace(/[^a-z]/g, "");
    const i = norm.findIndex((c) => c.includes(alvo));
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * Parser do statement CSV da Wise.
 * As taxas (Total fees) vão para um lançamento separado com contraparte "WISE FEES".
 */
export function parseWiseCsv(linhasCsv: string[][], moedaConta: Moeda = "EUR"): ResultadoParse {
  const avisos: string[] = [];
  if (!linhasCsv.length) return { linhas: [], avisos: ["Ficheiro vazio."] };

  const cols = linhasCsv[0].map((c) => c.trim());
  const iId = cabecalhoIndex(cols, "TransferWise ID", "ID", "Transaction ID");
  const iData = cabecalhoIndex(cols, "Date", "Data");
  const iValor = cabecalhoIndex(cols, "Amount", "Valor");
  const iMoeda = cabecalhoIndex(cols, "Currency", "Moeda");
  const iDesc = cabecalhoIndex(cols, "Description", "Descricao", "Descrição");
  const iPayee = cabecalhoIndex(cols, "Payee Name", "Recipient name");
  const iPayer = cabecalhoIndex(cols, "Payer Name", "Sender name");
  const iCambio = cabecalhoIndex(cols, "Exchange Rate", "Exchange To Amount Rate");
  const iFees = cabecalhoIndex(cols, "Total fees", "Fees");

  if (iData < 0 || iValor < 0) {
    return { linhas: [], avisos: ["Não encontrei as colunas Date e Amount no ficheiro da Wise."] };
  }

  const linhas: LinhaImportada[] = [];
  for (let r = 1; r < linhasCsv.length; r++) {
    const row = linhasCsv[r];
    if (!row || row.every((c) => !String(c ?? "").trim())) continue;

    const data = parseData(row[iData]);
    const valor = parseValor(row[iValor]);
    const id = iId >= 0 ? String(row[iId] ?? "").trim() : "";
    const moedaLinha = (iMoeda >= 0 ? String(row[iMoeda] ?? "").trim().toUpperCase() : moedaConta) as Moeda;
    const moeda = (["BRL", "EUR", "USD"].includes(moedaLinha) ? moedaLinha : moedaConta) as Moeda;
    const descricao = (iDesc >= 0 ? String(row[iDesc] ?? "").trim() : "") || "(sem descrição)";
    const payee = iPayee >= 0 ? String(row[iPayee] ?? "").trim() : "";
    const payer = iPayer >= 0 ? String(row[iPayer] ?? "").trim() : "";
    const cambio = iCambio >= 0 ? parseValor(row[iCambio]) : null;
    const fees = iFees >= 0 ? parseValor(row[iFees]) : null;

    if (!data || valor == null) {
      linhas.push({
        data: data ?? "",
        descricao,
        valor: valor ?? 0,
        moeda,
        external_id: id || null,
        erro: !data ? "Data inválida" : "Valor inválido",
      });
      continue;
    }

    const contraparte = normalizarContraparte(payee || payer || descricao);
    linhas.push({
      data,
      descricao,
      contraparte,
      valor,
      moeda,
      cotacao: cambio && cambio > 0 ? cambio : null,
      external_id: id || null,
      raw: { payee, payer, cambio, fees },
    });

    if (fees && Math.abs(fees) > 0) {
      linhas.push({
        data,
        descricao: `Taxa Wise — ${descricao}`,
        contraparte: "WISE FEES",
        valor: -Math.abs(fees),
        moeda,
        external_id: id ? `${id}-FEE` : null,
        raw: { origem: id, fees },
      });
    }
  }

  if (!linhas.length) avisos.push("Nenhuma transação encontrada.");
  return { linhas, moeda: moedaConta, avisos };
}
