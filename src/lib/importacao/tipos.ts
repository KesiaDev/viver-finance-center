export type Moeda = "BRL" | "EUR" | "USD";

export type FormatoImportacao =
  | "ofx"
  | "csv"
  | "xlsx"
  | "wise_csv"
  | "fatura_csv"
  | "fatura_pdf";

/** Uma linha bruta extraída do ficheiro, já normalizada em sinal e datas. */
export interface LinhaImportada {
  /** Data do movimento no extrato (vai para data_caixa). YYYY-MM-DD */
  data: string;
  /** Data da compra/serviço, quando o ficheiro a traz (faturas de cartão). */
  data_competencia?: string | null;
  descricao: string;
  contraparte?: string | null;
  /** Negativo = saída, positivo = entrada. Na moeda da conta. */
  valor: number;
  moeda: Moeda;
  /** Câmbio próprio da linha (ex.: conversão Wise). Tem prioridade sobre a PTAX. */
  cotacao?: number | null;
  external_id?: string | null;
  parcela?: string | null;
  erro?: string | null;
  raw?: Record<string, unknown>;
}

export interface ResultadoParse {
  linhas: LinhaImportada[];
  /** Saldo final do período, quando o ficheiro o traz (LEDGERBAL / closing balance). */
  saldoFinal?: number | null;
  dataSaldoFinal?: string | null;
  saldoInicial?: number | null;
  moeda?: Moeda | null;
  avisos: string[];
}

/** Mapeamento de colunas guardado por conta em modelos_importacao. */
export interface MapeamentoColunas {
  data?: string;
  data_competencia?: string;
  descricao?: string;
  contraparte?: string;
  valor?: string;
  debito?: string;
  credito?: string;
  moeda?: string;
  cotacao?: string;
  external_id?: string;
  parcela?: string;
  /** true quando débitos vêm positivos e precisam de inversão de sinal */
  inverter_sinal?: boolean;
}

export const CAMPOS_MAPEAVEIS: { chave: keyof MapeamentoColunas; label: string; obrigatorio?: boolean }[] = [
  { chave: "data", label: "Data do movimento", obrigatorio: true },
  { chave: "data_competencia", label: "Data da compra" },
  { chave: "descricao", label: "Descrição", obrigatorio: true },
  { chave: "contraparte", label: "Contraparte" },
  { chave: "valor", label: "Valor (único)" },
  { chave: "debito", label: "Débito (saídas)" },
  { chave: "credito", label: "Crédito (entradas)" },
  { chave: "moeda", label: "Moeda" },
  { chave: "cotacao", label: "Câmbio" },
  { chave: "external_id", label: "Identificador" },
  { chave: "parcela", label: "Parcela" },
];

/** Converte "1.234,56", "1,234.56", "R$ -1.234,56" em número. */
export function parseValor(bruto: unknown): number | null {
  if (bruto == null || bruto === "") return null;
  if (typeof bruto === "number") return Number.isFinite(bruto) ? bruto : null;
  let s = String(bruto).trim();
  if (!s) return null;
  let negativo = false;
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1);
  }
  if (/[-–]\s*$/.test(s)) {
    negativo = true;
  }
  s = s.replace(/[R$€\s\u00a0A-Za-z]/g, "").replace(/[–—]/g, "-");
  if (!s) return null;
  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");
  if (temVirgula && temPonto) {
    // o último separador é o decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (temVirgula) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // só pontos: pode ser separador de milhar (1.234) ou decimal (1234.56)
    const partes = s.split(".");
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3 && !s.startsWith("0."))) {
      s = partes.join("");
    }
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negativo && n > 0 ? -n : n;
}

const MESES_PT: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  janeiro: "01", fevereiro: "02", marco: "03", março: "03", abril: "04", maio: "05", junho: "06",
  julho: "07", agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
};

/**
 * Converte datas em vários formatos para YYYY-MM-DD.
 * Aceita dd/mm/aaaa, dd/mm (com ano de referência), aaaa-mm-dd, "3 de agosto de 2026",
 * OFX (aaaammdd...) e números de série do Excel.
 */
export function parseData(bruto: unknown, anoReferencia?: number): string | null {
  if (bruto == null || bruto === "") return null;
  if (bruto instanceof Date && !Number.isNaN(bruto.getTime())) {
    return bruto.toISOString().slice(0, 10);
  }
  if (typeof bruto === "number") {
    // número de série do Excel (base 1899-12-30)
    const ms = Math.round((bruto - 25569) * 86400000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const s = String(bruto).trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m && s.length >= 8 && !s.includes("/")) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }

  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})$/);
  if (m && anoReferencia) {
    return `${anoReferencia}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }

  m = s.match(/^(\d{1,2})\s*(?:de\s+)?([a-zç]+)\.?\s*(?:de\s+)?(\d{4})?/i);
  if (m) {
    const mes = MESES_PT[m[2].toLowerCase()];
    if (mes) {
      const ano = m[3] ?? String(anoReferencia ?? new Date().getFullYear());
      return `${ano}-${mes}-${m[1].padStart(2, "0")}`;
    }
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
