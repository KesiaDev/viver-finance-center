import { describe, expect, it } from "vitest";
import { escolherRegra, normalizarContraparte, normalizarTexto, regraBate, type RegraMatch } from "../normalize";
import { construirRegras, mapearCategoria, parseCsvRegras, parseValorBr } from "../csvRegras";

describe("normalizarTexto", () => {
  it("remove acentos, coloca em maiúsculas e colapsa espaços", () => {
    expect(normalizarTexto("  Antecipação   de   Lucros ")).toBe("ANTECIPACAO DE LUCROS");
    expect(normalizarTexto(null)).toBe("");
  });
});

describe("normalizarContraparte", () => {
  it("remove sufixos variáveis de cartão", () => {
    expect(normalizarContraparte("FACEBK*8H2K3LM")).toBe("FACEBK");
    expect(normalizarContraparte("FACEBK *8H2K3LM")).toBe("FACEBK");
    expect(normalizarContraparte("ANTHROPIC* CLAUDE")).toBe("ANTHROPIC");
  });

  it("remove códigos numéricos colados", () => {
    expect(normalizarContraparte("AZUL12345")).toBe("AZUL");
    expect(normalizarContraparte("AZUL 908372")).toBe("AZUL");
  });

  it("mantém nomes simples normalizados", () => {
    expect(normalizarContraparte("Município de Pelotas")).toBe("MUNICIPIO DE PELOTAS");
  });
});

const base: Omit<RegraMatch, "id" | "prioridade" | "padrao"> = {
  ativo: true,
  campo: "contraparte",
  operador: "contem",
  sinal: "ambos",
};

describe("regraBate", () => {
  const lanc = {
    descricao: "PIX ENVIADO RECEITA FEDERAL DARF",
    contraparte: "Receita Federal",
    valor_original: -1200,
  };

  it("bate por conteúdo sem acentos", () => {
    expect(regraBate({ ...base, id: "1", prioridade: 1, padrao: "receita federal" }, lanc)).toBe(true);
  });

  it("respeita o sinal", () => {
    expect(regraBate({ ...base, id: "1", prioridade: 1, padrao: "receita", sinal: "entrada" }, lanc)).toBe(false);
    expect(regraBate({ ...base, id: "1", prioridade: 1, padrao: "receita", sinal: "saida" }, lanc)).toBe(true);
  });

  it("respeita faixas de valor", () => {
    expect(regraBate({ ...base, id: "1", prioridade: 1, padrao: "receita", valor_min: 2000 }, lanc)).toBe(false);
    expect(regraBate({ ...base, id: "1", prioridade: 1, padrao: "receita", valor_max: 2000 }, lanc)).toBe(true);
  });

  it("ignora regras inativas", () => {
    expect(regraBate({ ...base, id: "1", prioridade: 1, padrao: "receita", ativo: false }, lanc)).toBe(false);
  });
});

describe("escolherRegra", () => {
  const lanc = { descricao: "PAGAMENTO FACEBK ADS", contraparte: "FACEBK", valor_original: -500 };

  it("escolhe a regra de menor prioridade", () => {
    const regras: RegraMatch[] = [
      { ...base, id: "generica", prioridade: 50, padrao: "FACEBK" },
      { ...base, id: "especifica", prioridade: 5, padrao: "FACEBK" },
    ];
    expect(escolherRegra(regras, lanc)?.id).toBe("especifica");
  });

  it("desempata pela data de criação", () => {
    const regras: RegraMatch[] = [
      { ...base, id: "nova", prioridade: 10, padrao: "FACEBK", created_at: "2026-02-01" },
      { ...base, id: "antiga", prioridade: 10, padrao: "FACEBK", created_at: "2026-01-01" },
    ];
    expect(escolherRegra(regras, lanc)?.id).toBe("antiga");
  });

  it("devolve null quando nenhuma regra bate", () => {
    expect(escolherRegra([{ ...base, id: "x", prioridade: 1, padrao: "GOOGLE" }], lanc)).toBeNull();
  });
});

describe("mapearCategoria", () => {
  it("mapeia tráfego e empresa destino", () => {
    expect(mapearCategoria("Tráfego", "")).toEqual({ categoria: "Tráfego", empresaDestino: null });
    expect(mapearCategoria("Trafego Infoeditora", "")).toEqual({ categoria: "Tráfego", empresaDestino: "infoeditora" });
  });

  it("mapeia sinónimos de despesas", () => {
    expect(mapearCategoria("Salario", "").categoria).toBe("Salários");
    expect(mapearCategoria("Despesas ADM", "").categoria).toBe("Outras despesas");
    expect(mapearCategoria("Consultorias", "").categoria).toBe("Mentorias");
    expect(mapearCategoria("Consultorias ACC", "").categoria).toBe("Consultorias ACC");
  });

  it("usa o_que_e nas linhas fora do resultado", () => {
    expect(mapearCategoria("(fora do resultado)", "Cartão Azul").categoria).toBe("Pagamento de fatura de cartão");
    expect(mapearCategoria("(fora do resultado)", "Transferencia entre contas").categoria).toBe("Transferência entre contas");
    expect(mapearCategoria("(fora do resultado)", "Antecipação Lucros").categoria).toBe("Antecipação de lucros");
  });

  it("ignora entradas e tarifas", () => {
    expect(mapearCategoria("Entrada Wise", "").categoria).toBeNull();
    expect(mapearCategoria("Tarifa", "").categoria).toBeNull();
  });
});

describe("importação de CSV", () => {
  const csv = `\uFEFForigem;data;recebedor_ou_descricao;valor;o_que_e;centro_custo;categoria_usada_no_resultado
Itau;01/08/2026;Receita Federal;-1.200,50;DARF;ADM;Impostos
Itau;05/08/2026;Receita Federal;-900,00;DARF;ADM;Impostos
Cartao Azul;07/08/2026;FACEBK*99AA;-300,00;Ads;MARKETING;Tráfego
Cartao Azul;09/08/2026;FACEBK *77BB;-150,00;Ads;MARKETING;Tráfego
Itau;10/08/2026;Fulano Silva;-1.000,00;Salario;ADM;Salarios
Itau;11/08/2026;Fulano Silva;-500,00;Bonus;ADM;Comissões
Wise;12/08/2026;Aluno X;300,00;Venda;;Entrada Wise`;

  const linhas = parseCsvRegras(csv);

  it("lê todas as linhas", () => {
    expect(linhas).toHaveLength(7);
    expect(linhas[0].recebedor_ou_descricao).toBe("Receita Federal");
  });

  it("converte valores em formato brasileiro", () => {
    expect(parseValorBr("-1.200,50")).toBeCloseTo(-1200.5);
  });

  it("agrupa regras, ambíguas e ignoradas", () => {
    const r = construirRegras(linhas);
    const receita = r.regras.find((x) => x.contraparte === "RECEITA FEDERAL");
    expect(receita?.categoriaNome).toBe("Impostos");
    expect(receita?.operador).toBe("igual");

    const facebk = r.regras.find((x) => x.contraparte === "FACEBK");
    expect(facebk?.categoriaNome).toBe("Tráfego");
    expect(facebk?.operador).toBe("contem");

    expect(r.ambiguas.map((a) => a.contraparte)).toContain("FULANO SILVA");
    expect(r.ignoradas.map((i) => i.contraparte)).toContain("ALUNO X");
  });
});
