import * as XLSX from "xlsx";
import { normalizarContraparte } from "@/lib/classificacao/normalize";
import {
  parseData,
  parseValor,
  type LinhaImportada,
  type MapeamentoColunas,
  type Moeda,
  type ResultadoParse,
} from "./tipos";

/** Divide uma linha de CSV respeitando aspas. */
function dividirLinha(linha: string, sep: string): string[] {
  const out: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else aspas = !aspas;
    } else if (c === sep && !aspas) {
      out.push(atual);
      atual = "";
    } else atual += c;
  }
  out.push(atual);
  return out.map((c) => c.trim());
}

export function detetarSeparador(texto: string): string {
  const amostra = texto.split(/\r?\n/).slice(0, 10).join("\n");
  const cands = [";", ",", "\t", "|"];
  let melhor = ";";
  let max = -1;
  for (const s of cands) {
    const n = amostra.split(s).length;
    if (n > max) {
      max = n;
      melhor = s;
    }
  }
  return melhor;
}

export function csvParaMatriz(texto: string, separador?: string): string[][] {
  const limpo = texto.replace(/^\uFEFF/, "");
  const sep = separador ?? detetarSeparador(limpo);
  return limpo
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => dividirLinha(l, sep));
}

export function xlsxParaMatriz(buffer: ArrayBuffer): string[][] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
  return linhas.map((r) => (r as unknown[]).map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? ""))));
}

/** Encontra a linha que parece ser o cabeçalho (a primeira com 2+ células de texto e sem número solto). */
export function detetarCabecalho(matriz: string[][]): number {
  for (let i = 0; i < Math.min(matriz.length, 30); i++) {
    const row = matriz[i];
    const preenchidas = row.filter((c) => String(c ?? "").trim().length > 0);
    if (preenchidas.length < 2) continue;
    const textuais = preenchidas.filter((c) => Number.isNaN(Number(String(c).replace(",", "."))));
    if (textuais.length >= Math.max(2, Math.ceil(preenchidas.length * 0.6))) return i;
  }
  return 0;
}

const SINONIMOS: Record<keyof MapeamentoColunas, string[]> = {
  data: ["data", "data do movimento", "data lancamento", "date", "data caixa", "data pagamento", "data compra"],
  data_competencia: ["data da compra", "data compra", "competencia", "data competencia"],
  descricao: ["descricao", "historico", "lancamento", "description", "memo", "detalhe", "estabelecimento"],
  contraparte: ["contraparte", "recebedor", "favorecido", "beneficiario", "payee", "razao social", "nome"],
  valor: ["valor", "amount", "valor (r$)", "valor r$", "montante"],
  debito: ["debito", "saida", "debit", "saidas"],
  credito: ["credito", "entrada", "credit", "entradas"],
  moeda: ["moeda", "currency"],
  cotacao: ["cotacao", "cambio", "exchange rate", "taxa"],
  external_id: ["id", "identificador", "fitid", "documento", "transaction id"],
  parcela: ["parcela", "parcelas", "installment"],
  inverter_sinal: [],
};

function normCol(s: string) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Sugere automaticamente o mapeamento das colunas a partir do cabeçalho. */
export function sugerirMapeamento(cabecalho: string[]): MapeamentoColunas {
  const mapa: MapeamentoColunas = {};
  const cols = cabecalho.map(normCol);
  for (const [campo, nomes] of Object.entries(SINONIMOS) as [keyof MapeamentoColunas, string[]][]) {
    if (!nomes.length) continue;
    let idx = cols.findIndex((c) => nomes.includes(c));
    if (idx < 0) idx = cols.findIndex((c) => c && nomes.some((n) => c.includes(n)));
    if (idx >= 0) (mapa as Record<string, unknown>)[campo] = cabecalho[idx];
  }
  if (mapa.valor && (mapa.debito || mapa.credito)) {
    delete mapa.debito;
    delete mapa.credito;
  }
  return mapa;
}

export interface OpcoesTabular {
  mapeamento: MapeamentoColunas;
  moedaConta: Moeda;
  anoReferencia?: number;
  /** Fatura de cartão: a data lida é a data da compra e data_caixa vem do vencimento. */
  fatura?: boolean;
  vencimento?: string | null;
}

export function matrizParaLinhas(
  matriz: string[][],
  linhaCabecalho: number,
  opcoes: OpcoesTabular,
): ResultadoParse {
  const avisos: string[] = [];
  const cabecalho = matriz[linhaCabecalho] ?? [];
  const idx = (nome?: string) => (nome ? cabecalho.findIndex((c) => normCol(c) === normCol(nome)) : -1);
  const m = opcoes.mapeamento;

  const iData = idx(m.data);
  const iComp = idx(m.data_competencia);
  const iDesc = idx(m.descricao);
  const iContra = idx(m.contraparte);
  const iValor = idx(m.valor);
  const iDeb = idx(m.debito);
  const iCred = idx(m.credito);
  const iMoeda = idx(m.moeda);
  const iCambio = idx(m.cotacao);
  const iId = idx(m.external_id);
  const iParcela = idx(m.parcela);

  if (iData < 0) avisos.push("Coluna de data não mapeada.");
  if (iValor < 0 && iDeb < 0 && iCred < 0) avisos.push("Nenhuma coluna de valor mapeada.");

  const linhas: LinhaImportada[] = [];
  for (let r = linhaCabecalho + 1; r < matriz.length; r++) {
    const row = matriz[r];
    if (!row || row.every((c) => !String(c ?? "").trim())) continue;

    const dataBruta = iData >= 0 ? row[iData] : null;
    const data = parseData(dataBruta, opcoes.anoReferencia);
    const descricao = (iDesc >= 0 ? String(row[iDesc] ?? "").trim() : "") || "(sem descrição)";

    let valor: number | null = null;
    if (iValor >= 0) valor = parseValor(row[iValor]);
    else {
      const d = iDeb >= 0 ? parseValor(row[iDeb]) : null;
      const c = iCred >= 0 ? parseValor(row[iCred]) : null;
      if (d != null && Math.abs(d) > 0) valor = -Math.abs(d);
      else if (c != null) valor = Math.abs(c);
    }
    if (valor != null && m.inverter_sinal) valor = -valor;

    if (!data || valor == null) {
      linhas.push({
        data: data ?? "",
        descricao,
        valor: valor ?? 0,
        moeda: opcoes.moedaConta,
        erro: !data ? "Data inválida" : "Valor inválido",
      });
      continue;
    }

    const moedaLinha = iMoeda >= 0 ? String(row[iMoeda] ?? "").trim().toUpperCase() : "";
    const moeda = (["BRL", "EUR", "USD"].includes(moedaLinha) ? moedaLinha : opcoes.moedaConta) as Moeda;
    const cambio = iCambio >= 0 ? parseValor(row[iCambio]) : null;
    const contraparte = normalizarContraparte(iContra >= 0 ? String(row[iContra] ?? "") : descricao);
    const competencia = iComp >= 0 ? parseData(row[iComp], opcoes.anoReferencia) : null;

    if (opcoes.fatura) {
      linhas.push({
        data: opcoes.vencimento ?? data,
        data_competencia: competencia ?? data,
        descricao,
        contraparte,
        valor,
        moeda,
        cotacao: cambio && cambio > 0 ? cambio : null,
        external_id: iId >= 0 ? String(row[iId] ?? "").trim() || null : null,
        parcela: iParcela >= 0 ? String(row[iParcela] ?? "").trim() || null : null,
      });
    } else {
      linhas.push({
        data,
        data_competencia: competencia,
        descricao,
        contraparte,
        valor,
        moeda,
        cotacao: cambio && cambio > 0 ? cambio : null,
        external_id: iId >= 0 ? String(row[iId] ?? "").trim() || null : null,
        parcela: iParcela >= 0 ? String(row[iParcela] ?? "").trim() || null : null,
      });
    }
  }

  return { linhas, moeda: opcoes.moedaConta, avisos };
}
