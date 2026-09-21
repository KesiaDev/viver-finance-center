import { normalizarContraparte, normalizarTexto } from "./normalize";

export interface LinhaCsv {
  origem: string;
  data: string;
  recebedor_ou_descricao: string;
  valor: string;
  o_que_e: string;
  centro_custo: string;
  categoria_usada_no_resultado: string;
}

export interface RegraProposta {
  contraparte: string;
  categoriaNome: string;
  centroCustoNome: string | null;
  operador: "igual" | "contem";
  empresaDestino: "infoeditora" | null;
  ocorrencias: number;
  origens: string[];
}

export interface LinhaAmbigua {
  contraparte: string;
  categorias: string[];
  ocorrencias: number;
}

export interface LinhaIgnorada {
  contraparte: string;
  motivo: string;
  ocorrencias: number;
}

export interface ResultadoImportacao {
  regras: RegraProposta[];
  ambiguas: LinhaAmbigua[];
  ignoradas: LinhaIgnorada[];
  totalLinhas: number;
}

const CATEGORIAS_IGNORADAS = new Set(["ENTRADA", "ENTRADA WISE", "TARIFA"]);

/** Mapeia a coluna `categoria_usada_no_resultado` para o nome da categoria do sistema. */
export function mapearCategoria(
  categoria: string,
  oQueE: string,
): { categoria: string | null; empresaDestino: "infoeditora" | null; motivo?: string } {
  const c = normalizarTexto(categoria);
  const oq = normalizarTexto(oQueE);

  if (!c || c === "(FORA DO RESULTADO)" || c.includes("FORA DO RESULTADO")) {
    if (oq.startsWith("CARTAO")) return { categoria: "Pagamento de fatura de cartão", empresaDestino: null };
    if (oq.includes("TRANSFERENCIA ENTRE CONTAS")) return { categoria: "Transferência entre contas", empresaDestino: null };
    if (oq.includes("ANTECIPACAO") && oq.includes("LUCRO")) return { categoria: "Antecipação de lucros", empresaDestino: null };
    return { categoria: null, empresaDestino: null, motivo: "Fora do resultado sem correspondência" };
  }

  if (CATEGORIAS_IGNORADAS.has(c)) {
    return { categoria: null, empresaDestino: null, motivo: "Tratada noutra fase" };
  }

  if (c.includes("TRAFEGO")) {
    return {
      categoria: "Tráfego",
      empresaDestino: c.includes("INFOEDITORA") ? "infoeditora" : null,
    };
  }
  if (c === "FERRAMENTAS") return { categoria: "Ferramentas", empresaDestino: null };
  if (["SALARIOS", "SALARIO"].includes(c)) return { categoria: "Salários", empresaDestino: null };
  if (["OUTRAS DESPESAS", "OUTROS", "DESPESAS ADM"].includes(c)) return { categoria: "Outras despesas", empresaDestino: null };
  if (["COMISSOES", "COMISSAO"].includes(c)) return { categoria: "Comissões", empresaDestino: null };
  if (c === "CONSULTORIAS ACC") return { categoria: "Consultorias ACC", empresaDestino: null };
  if (c === "CONSULTORIAS") return { categoria: "Mentorias", empresaDestino: null };
  if (c === "IMPOSTOS") return { categoria: "Impostos", empresaDestino: null };
  if (c === "PASSAGENS ESTADIA" || c === "EVENTO") return { categoria: "Eventos", empresaDestino: null };
  if (c === "REEMBOLSO ALUNO") return { categoria: "Reembolsos", empresaDestino: null };

  return { categoria: null, empresaDestino: null, motivo: `Categoria "${categoria}" sem correspondência` };
}

/** Parser simples de CSV com separador ";" e BOM UTF-8. */
export function parseCsvRegras(conteudo: string): LinhaCsv[] {
  const texto = conteudo.replace(/^\uFEFF/, "");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (linhas.length === 0) return [];

  const cabecalho = linhas[0].split(";").map((h) => normalizarTexto(h).toLowerCase().replace(/\s+/g, "_"));
  const idx = (nome: string) => cabecalho.findIndex((h) => h === nome);

  const iOrigem = idx("origem");
  const iData = idx("data");
  const iRec = idx("recebedor_ou_descricao");
  const iValor = idx("valor");
  const iOq = idx("o_que_e");
  const iCc = idx("centro_custo");
  const iCat = idx("categoria_usada_no_resultado");

  return linhas.slice(1).map((linha) => {
    const cols = linha.split(";");
    const get = (i: number) => (i >= 0 ? (cols[i] ?? "").trim() : "");
    return {
      origem: get(iOrigem),
      data: get(iData),
      recebedor_ou_descricao: get(iRec),
      valor: get(iValor),
      o_que_e: get(iOq),
      centro_custo: get(iCc),
      categoria_usada_no_resultado: get(iCat),
    };
  });
}

export function parseValorBr(valor: string): number {
  const limpo = (valor ?? "").replace(/[^\d,.\-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

/** Agrupa as linhas do CSV em regras, ambiguidades e ignoradas. */
export function construirRegras(linhas: LinhaCsv[]): ResultadoImportacao {
  const grupos = new Map<
    string,
    { categorias: Map<string, number>; centro: Map<string, number>; origens: Set<string>; empresa: "infoeditora" | null; total: number }
  >();
  const ignoradasMap = new Map<string, LinhaIgnorada>();

  for (const linha of linhas) {
    const contraparte = normalizarContraparte(linha.recebedor_ou_descricao);
    if (!contraparte) continue;

    const { categoria, empresaDestino, motivo } = mapearCategoria(
      linha.categoria_usada_no_resultado,
      linha.o_que_e,
    );

    if (!categoria) {
      const chave = `${contraparte}|${motivo}`;
      const atual = ignoradasMap.get(chave);
      if (atual) atual.ocorrencias += 1;
      else ignoradasMap.set(chave, { contraparte, motivo: motivo ?? "Ignorada", ocorrencias: 1 });
      continue;
    }

    let grupo = grupos.get(contraparte);
    if (!grupo) {
      grupo = { categorias: new Map(), centro: new Map(), origens: new Set(), empresa: empresaDestino, total: 0 };
      grupos.set(contraparte, grupo);
    }
    grupo.total += 1;
    grupo.categorias.set(categoria, (grupo.categorias.get(categoria) ?? 0) + 1);
    if (linha.centro_custo?.trim()) {
      const cc = normalizarTexto(linha.centro_custo);
      grupo.centro.set(cc, (grupo.centro.get(cc) ?? 0) + 1);
    }
    if (linha.origem?.trim()) grupo.origens.add(linha.origem.trim());
    if (empresaDestino) grupo.empresa = empresaDestino;
  }

  const regras: RegraProposta[] = [];
  const ambiguas: LinhaAmbigua[] = [];

  for (const [contraparte, grupo] of grupos) {
    if (grupo.categorias.size > 1) {
      ambiguas.push({
        contraparte,
        categorias: [...grupo.categorias.keys()].sort(),
        ocorrencias: grupo.total,
      });
      continue;
    }
    const categoriaNome = [...grupo.categorias.keys()][0];
    const origens = [...grupo.origens];
    const ehCartao = origens.some((o) => normalizarTexto(o).includes("CARTAO"));
    const centroCustoNome =
      [...grupo.centro.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    regras.push({
      contraparte,
      categoriaNome,
      centroCustoNome,
      operador: ehCartao ? "contem" : "igual",
      empresaDestino: grupo.empresa,
      ocorrencias: grupo.total,
      origens,
    });
  }

  regras.sort((a, b) => b.ocorrencias - a.ocorrencias || a.contraparte.localeCompare(b.contraparte));
  ambiguas.sort((a, b) => b.ocorrencias - a.ocorrencias);

  return {
    regras,
    ambiguas,
    ignoradas: [...ignoradasMap.values()].sort((a, b) => b.ocorrencias - a.ocorrencias),
    totalLinhas: linhas.length,
  };
}
