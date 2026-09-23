import { escolherRegra, type TipoConta } from "@/lib/classificacao/normalize";
import type { RegraClassificacao } from "@/hooks/useImportacao";
import type { LinhaImportada, Moeda } from "./tipos";

export type EstadoLinha = "nova" | "duplicada" | "erro";

export interface LinhaPreparada extends LinhaImportada {
  estado: EstadoLinha;
  motivo?: string | null;
  cotacaoUsada: number | null;
  valorBrl: number | null;
  regra: RegraClassificacao | null;
  dataCaixa: string;
  dataCompetencia: string;
}

export interface LancamentoExistente {
  external_id: string | null;
  data_caixa: string | null;
  valor_original: number;
  descricao: string;
}

export interface ContextoPreparacao {
  contaId: string;
  tipoConta: TipoConta;
  empresaId: string;
  moedaConta: Moeda;
  regras: RegraClassificacao[];
  /** taxa BRL por dia e moeda, já ordenada por data */
  cotacoes: { data: string; moeda: string; taxa_brl: number }[];
  existentes: LancamentoExistente[];
  /** para faturas de cartão: a data de caixa é o vencimento */
  vencimento?: string | null;
}

/** Última cotação conhecida até à data (último dia útil disponível). */
export function taxaAte(
  cotacoes: { data: string; moeda: string; taxa_brl: number }[],
  moeda: string,
  data: string,
): number | null {
  let melhor: { data: string; taxa_brl: number } | null = null;
  for (const c of cotacoes) {
    if (c.moeda !== moeda) continue;
    if (c.data > data) continue;
    if (!melhor || c.data > melhor.data) melhor = c;
  }
  return melhor?.taxa_brl ?? null;
}

function chaveDedup(dataCaixa: string, valor: number, descricao: string) {
  return `${dataCaixa}|${valor.toFixed(2)}|${descricao.trim().toLowerCase()}`;
}

export function prepararLinhas(
  linhas: LinhaImportada[],
  ctx: ContextoPreparacao,
): LinhaPreparada[] {
  const porExternalId = new Set(
    ctx.existentes.map((e) => e.external_id).filter((v): v is string => !!v),
  );
  const porHash = new Set(
    ctx.existentes.map((e) => chaveDedup(e.data_caixa ?? "", e.valor_original, e.descricao)),
  );
  const vistas = new Set<string>();

  return linhas.map((l) => {
    const dataCompetencia = l.data_competencia ?? l.data;
    const dataCaixa = ctx.vencimento ?? l.data;

    let cotacaoUsada: number | null = l.cotacao ?? null;
    if (l.moeda === "BRL") cotacaoUsada = 1;
    if (cotacaoUsada == null) cotacaoUsada = taxaAte(ctx.cotacoes, l.moeda, dataCaixa);
    const valorBrl = cotacaoUsada != null ? Number((l.valor * cotacaoUsada).toFixed(2)) : null;

    const regra = l.erro
      ? null
      : escolherRegra(ctx.regras, {
          empresa_id: ctx.empresaId,
          conta_id: ctx.contaId,
          tipo_conta: ctx.tipoConta,
          descricao: l.descricao,
          contraparte: l.contraparte,
          valor_original: l.valor,
        });

    let estado: EstadoLinha = "nova";
    let motivo: string | null = null;

    if (l.erro) {
      estado = "erro";
      motivo = l.erro;
    } else if (l.external_id && porExternalId.has(l.external_id)) {
      estado = "duplicada";
      motivo = "Já importada (mesmo identificador do banco)";
    } else {
      const chave = chaveDedup(dataCaixa, l.valor, l.descricao);
      if (porHash.has(chave)) {
        estado = "duplicada";
        motivo = "Já existe um lançamento igual nesta conta";
      } else if (vistas.has(chave)) {
        estado = "duplicada";
        motivo = "Linha repetida dentro do próprio ficheiro";
      }
      vistas.add(chave);
    }

    if (estado === "nova" && cotacaoUsada == null) {
      estado = "erro";
      motivo = `Sem cotação de ${l.moeda} para ${dataCaixa}`;
    }

    return { ...l, estado, motivo, cotacaoUsada, valorBrl, regra, dataCaixa, dataCompetencia };
  });
}

export interface ConferenciaSaldo {
  saldoInicial: number | null;
  movimentos: number;
  saldoCalculado: number | null;
  saldoExtrato: number | null;
  diferenca: number | null;
  bate: boolean;
}

export function conferirSaldo(
  linhas: LinhaPreparada[],
  saldoInicial: number | null | undefined,
  saldoExtrato: number | null | undefined,
): ConferenciaSaldo {
  const movimentos = linhas
    .filter((l) => l.estado !== "erro")
    .reduce((acc, l) => acc + l.valor, 0);
  const saldoCalculado = saldoInicial != null ? Number((saldoInicial + movimentos).toFixed(2)) : null;
  const diferenca =
    saldoCalculado != null && saldoExtrato != null
      ? Number((saldoCalculado - saldoExtrato).toFixed(2))
      : null;
  return {
    saldoInicial: saldoInicial ?? null,
    movimentos: Number(movimentos.toFixed(2)),
    saldoCalculado,
    saldoExtrato: saldoExtrato ?? null,
    diferenca,
    bate: diferenca != null ? Math.abs(diferenca) < 0.01 : false,
  };
}
