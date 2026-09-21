import { normalizarContraparte } from "@/lib/classificacao/normalize";
import { parseValor, type LinhaImportada, type Moeda, type ResultadoParse } from "./tipos";

/**
 * Extrai as linhas de compra de uma fatura de cartão em PDF (texto já extraído).
 * Suporta os dois formatos que usamos:
 *  - Itaú / Azul / The One:  "28/06 FACEBK *CWHZ3TZT72 R$5.000,00"  (parcela opcional "05/12")
 *  - Santander:              "01-07-2026 DESCRIÇÃO LOCAL\ 529,92 EUR 614,95 3.335,67 5,42"
 *
 * Nas faturas do Itaú há um bloco final "Compras parceladas — próximas faturas" que repete
 * as mesmas compras com a parcela seguinte. Essas linhas são descartadas.
 */

const RE_ITAU = /^(\d{2})\/(\d{2})\s+(.+?)\s+(-\s*)?R?\$?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/;
const RE_SANTANDER = /^(\d{2})-(\d{2})-(\d{4})\s+(.+?)\s{1,}(-?\s*[\d.,]+(?:\s+(?:USD|BRL|EUR)\s+[\d.,\s]+)?)\s*$/;
const RE_PARCELA = /\s(\d{2})\/(\d{2})\s*$/;
const RE_IOF_REPASSE = /Repasse de IOF em R\$\s*(-?[\d.]*\d,\d{2})/i;
const RE_IGNORAR = /DEB\s*AUTOM|PAGAMENTO EFETUADO|PAGTO|DEBITO AUT|SALDO DA FATURA|TOTAL D[AE]/i;

export interface OpcoesFaturaPdf {
  /** Vencimento da fatura: vira a data_caixa de todas as linhas. */
  vencimento: string;
  /** Ano usado para completar datas no formato dd/mm. */
  anoReferencia: number;
  moeda?: Moeda;
}

function ajustarAno(dia: string, mes: string, vencimento: string, anoRef: number): string {
  // numa fatura, compras de meses posteriores ao vencimento são do ano anterior
  const mesVenc = Number(vencimento.slice(5, 7));
  const m = Number(mes);
  const ano = m > mesVenc + 1 ? anoRef - 1 : anoRef;
  return `${ano}-${mes}-${dia}`;
}

/** Na cauda de uma linha Santander, o valor em reais é o penúltimo número quando há sigla de moeda. */
function valorSantander(cauda: string): number | null {
  const temSigla = /\s(USD|BRL|EUR)\s/.test(` ${cauda} `);
  const numeros = cauda.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g) ?? [];
  if (!numeros.length) return null;
  if (temSigla && numeros.length >= 2) return parseValor(numeros[numeros.length - 2]);
  return parseValor(numeros[numeros.length - 1]);
}

export function parseFaturaTexto(texto: string, opcoes: OpcoesFaturaPdf): ResultadoParse {
  const moeda = opcoes.moeda ?? "BRL";
  const avisos: string[] = [];
  const brutas: LinhaImportada[] = [];

  // no Santander, uma compra pode partir-se em várias linhas: junta-as antes de processar
  const cruas = texto.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim());
  const fundidas: string[] = [];
  for (let i = 0; i < cruas.length; i++) {
    let linha = cruas[i];
    if (!linha) continue;
    if (/^\d{2}-\d{2}-\d{4}\s/.test(linha) && !/\d,\d{2}\s*$/.test(linha)) {
      let j = i + 1;
      while (j < cruas.length && j <= i + 3) {
        const seguinte = cruas[j];
        if (!seguinte || /^\d{2}[-/]\d{2}/.test(seguinte)) break;
        linha = `${linha} ${seguinte}`.replace(/\s+/g, " ").trim();
        i = j;
        if (/\d,\d{2}$/.test(linha)) break;
        j++;
      }
    }
    fundidas.push(linha);
  }

  for (const original of fundidas) {
    const linha = original;
    if (!linha) continue;

    // repasse de IOF das transações internacionais entra como despesa própria
    const mIof = linha.match(RE_IOF_REPASSE);
    if (mIof) {
      const v = parseValor(mIof[1]);
      if (v && Math.abs(v) > 0) {
        brutas.push({
          data: opcoes.vencimento,
          data_competencia: opcoes.vencimento,
          descricao: "REPASSE DE IOF",
          contraparte: "IOF",
          valor: -Math.abs(v),
          moeda,
          raw: { linha },
        });
      }
      continue;
    }

    let dataCompra: string | null = null;
    let descricaoBruta = "";
    let bruto: number | null = null;

    const mI = linha.match(RE_ITAU);
    const mS = linha.match(RE_SANTANDER);

    if (mI) {
      dataCompra = ajustarAno(mI[1], mI[2], opcoes.vencimento, opcoes.anoReferencia);
      descricaoBruta = mI[3].trim();
      const v = parseValor(mI[5]);
      bruto = v == null ? null : mI[4] ? -Math.abs(v) : v;
    } else if (mS) {
      dataCompra = `${mS[3]}-${mS[2]}-${mS[1]}`;
      descricaoBruta = mS[4].trim().replace(/\\.*$/, "").trim();
      bruto = valorSantander(mS[5]);
    } else {
      continue;
    }

    if (bruto == null || Math.abs(bruto) === 0) continue;
    // ignora linhas de boleto/identificação que não são compras
    if (/^\d{8,}\//.test(descricaoBruta) || /\bFT\s+N\b/.test(descricaoBruta)) continue;
    if (RE_IGNORAR.test(descricaoBruta)) continue;

    // parcela no fim da descrição
    let parcela: string | null = null;
    const mp = descricaoBruta.match(RE_PARCELA);
    if (mp) {
      parcela = `${mp[1]}/${mp[2]}`;
      descricaoBruta = descricaoBruta.slice(0, mp.index).trim();
    } else {
      const colada = descricaoBruta.match(/[A-Za-z](\d{2})\/(\d{2})$/);
      if (colada) {
        parcela = `${colada[1]}/${colada[2]}`;
        descricaoBruta = descricaoBruta.slice(0, descricaoBruta.length - 5).trim();
      }
    }

    // estorno: valor negativo na fatura -> despesa positiva que abate a categoria
    const valor = bruto < 0 ? Math.abs(bruto) : -Math.abs(bruto);

    brutas.push({
      data: opcoes.vencimento,
      data_competencia: dataCompra,
      descricao: descricaoBruta,
      contraparte: normalizarContraparte(descricaoBruta),
      valor,
      moeda,
      parcela,
      external_id: null,
      raw: { linha },
    });
  }

  // descarta o bloco "compras parceladas — próximas faturas": mesma descrição e mesmo
  // valor, com o número da parcela imediatamente a seguir a uma já vista
  const vistas = new Map<string, number>();
  const linhas: LinhaImportada[] = [];
  let descartadasFuturas = 0;
  for (const l of brutas) {
    if (l.parcela) {
      const [n] = l.parcela.split("/").map(Number);
      const chave = `${l.descricao}|${l.valor}|${l.parcela.split("/")[1]}`;
      const anterior = vistas.get(chave);
      if (anterior != null && n > anterior) {
        descartadasFuturas++;
        continue;
      }
      vistas.set(chave, n);
    }
    linhas.push(l);
  }

  if (descartadasFuturas) {
    avisos.push(`${descartadasFuturas} linha(s) de parcelas de próximas faturas foram ignoradas.`);
  }
  if (!linhas.length) avisos.push("Não encontrei linhas de compra reconhecíveis nesta fatura.");
  return { linhas, moeda, avisos };
}

/** Soma das linhas (despesas positivas, estornos negativos) para conferir com o total da fatura. */
export function somaFatura(linhas: LinhaImportada[]): number {
  return Number(linhas.reduce((acc, l) => acc - l.valor, 0).toFixed(2));
}
