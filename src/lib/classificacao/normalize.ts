/**
 * Normalização de texto e de contrapartes para o motor de classificação.
 * Espelha a função SQL public.fin_normalize_text.
 */

export function normalizarTexto(input?: string | null): string {
  return (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza o nome de uma contraparte vinda de extratos/faturas:
 * - maiúsculas, sem acentos, espaços colapsados
 * - remove sufixos variáveis de cartões: "FACEBK*1234", "FACEBK *1234" -> "FACEBK"
 * - "ANTHROPIC* CLAUDE" -> "ANTHROPIC"
 * - "AZUL12345" -> "AZUL"
 */
export function normalizarContraparte(input?: string | null): string {
  let txt = normalizarTexto(input);
  if (!txt) return "";

  // junta o asterisco ao token anterior e corta tudo depois dele
  txt = txt.replace(/\s*\*\s*/g, "*");
  if (txt.includes("*")) {
    txt = txt.split("*")[0];
  }

  // remove códigos de reserva colados à companhia aérea (AZULYFHHNB -> AZUL)
  txt = txt.replace(/\bAZUL[A-Z0-9]{4,}\b/g, "AZUL");

  // remove códigos numéricos colados (AZUL12345 -> AZUL)
  txt = txt.replace(/\b([A-Z]{3,})\d{3,}\b/g, "$1");

  // remove sufixo numérico solto no fim (FACEBK 1234 -> FACEBK)
  txt = txt.replace(/\s+\d{3,}$/, "");

  return txt.replace(/\s+/g, " ").trim();
}

export type CampoRegra = "contraparte" | "descricao";
export type OperadorRegra = "igual" | "contem" | "comeca_com" | "regex";
export type SinalRegra = "entrada" | "saida" | "ambos";
export type TipoConta = "banco" | "cartao" | "plataforma" | "investimento" | "socio";

export interface RegraMatch {
  id: string;
  prioridade: number;
  ativo: boolean;
  campo: CampoRegra;
  operador: OperadorRegra;
  padrao: string;
  sinal: SinalRegra;
  conta_id?: string | null;
  tipo_conta?: TipoConta | null;
  empresa_id?: string | null;
  valor_min?: number | null;
  valor_max?: number | null;
  created_at?: string | null;
}

export interface LancamentoMatch {
  empresa_id?: string | null;
  conta_id?: string | null;
  tipo_conta?: TipoConta | null;
  descricao?: string | null;
  contraparte?: string | null;
  valor_original: number;
}

export function regraBate(regra: RegraMatch, lanc: LancamentoMatch): boolean {
  if (!regra.ativo) return false;
  if (regra.empresa_id && lanc.empresa_id && regra.empresa_id !== lanc.empresa_id) return false;
  if (regra.conta_id && regra.conta_id !== lanc.conta_id) return false;
  if (regra.tipo_conta && regra.tipo_conta !== lanc.tipo_conta) return false;

  const valor = lanc.valor_original ?? 0;
  if (regra.sinal === "entrada" && valor <= 0) return false;
  if (regra.sinal === "saida" && valor >= 0) return false;

  const abs = Math.abs(valor);
  if (regra.valor_min != null && abs < regra.valor_min) return false;
  if (regra.valor_max != null && abs > regra.valor_max) return false;

  const alvo =
    regra.campo === "descricao"
      ? normalizarTexto(lanc.descricao)
      : normalizarTexto(lanc.contraparte || lanc.descricao);
  const padrao = normalizarTexto(regra.padrao);
  if (!padrao) return false;

  switch (regra.operador) {
    case "igual":
      return alvo === padrao;
    case "contem":
      return alvo.includes(padrao);
    case "comeca_com":
      return alvo.startsWith(padrao);
    case "regex":
      try {
        return new RegExp(padrao).test(alvo);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/** Devolve a primeira regra que bate, respeitando a prioridade (menor = primeiro). */
export function escolherRegra<T extends RegraMatch>(
  regras: T[],
  lanc: LancamentoMatch,
): T | null {
  const ordenadas = [...regras].sort((a, b) => {
    if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  return ordenadas.find((r) => regraBate(r, lanc)) ?? null;
}
