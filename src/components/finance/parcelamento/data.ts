// ==============================
// Dados hardcoded do Dashboard de Parcelamento Inteligente
// ==============================

export const gmvData = [
  { mes: "Abr/25", pago: 1000, atrasado: 0, esperado: 0 },
  { mes: "Mai/25", pago: 5193, atrasado: 0, esperado: 0 },
  { mes: "Jun/25", pago: 13443, atrasado: 0, esperado: 0 },
  { mes: "Jul/25", pago: 65304, atrasado: 1000, esperado: 0 },
  { mes: "Ago/25", pago: 119672, atrasado: 5193, esperado: 0 },
  { mes: "Set/25", pago: 137415, atrasado: 13777, esperado: 0 },
  { mes: "Out/25", pago: 191136, atrasado: 28176, esperado: 0 },
  { mes: "Nov/25", pago: 223486, atrasado: 42048, esperado: 0 },
  { mes: "Dez/25", pago: 339784, atrasado: 68735, esperado: 0 },
  { mes: "Jan/26", pago: 386882, atrasado: 121111, esperado: 0 },
  { mes: "Fev/26", pago: 308112, atrasado: 126037, esperado: 149235 },
  { mes: "Mar/26", pago: 0, atrasado: 0, esperado: 583384 },
  { mes: "Abr/26", pago: 0, atrasado: 0, esperado: 570384 },
  { mes: "Mai/26", pago: 0, atrasado: 0, esperado: 566190 },
  { mes: "Jun/26", pago: 0, atrasado: 0, esperado: 556107 },
  { mes: "Jul/26", pago: 0, atrasado: 0, esperado: 503247 },
  { mes: "Ago/26", pago: 0, atrasado: 0, esperado: 444683 },
  { mes: "Set/26", pago: 0, atrasado: 0, esperado: 418357 },
  { mes: "Out/26", pago: 0, atrasado: 0, esperado: 350638 },
  { mes: "Nov/26", pago: 0, atrasado: 0, esperado: 304416 },
  { mes: "Dez/26", pago: 0, atrasado: 0, esperado: 188378 },
  { mes: "Jan/27", pago: 0, atrasado: 0, esperado: 89753 },
];

export const inadimplenciaData = [
  { mes: "Jul/25", taxa: 1.5, atrasado: 1000, total: 66304 },
  { mes: "Ago/25", taxa: 4.2, atrasado: 5193, total: 124866 },
  { mes: "Set/25", taxa: 9.1, atrasado: 13777, total: 151191 },
  { mes: "Out/25", taxa: 12.8, atrasado: 28176, total: 219312 },
  { mes: "Nov/25", taxa: 15.8, atrasado: 42048, total: 265534 },
  { mes: "Dez/25", taxa: 16.8, atrasado: 68735, total: 408519 },
  { mes: "Jan/26", taxa: 23.8, atrasado: 121111, total: 507993 },
  { mes: "Fev/26", taxa: 29.0, atrasado: 126037, total: 434149 },
];

export const crescimentoData = [
  { mes: "Set/25", valor: 13777, crescimento: null },
  { mes: "Out/25", valor: 28176, crescimento: 104.5 },
  { mes: "Nov/25", valor: 42048, crescimento: 49.2 },
  { mes: "Dez/25", valor: 68735, crescimento: 63.5 },
  { mes: "Jan/26", valor: 121111, crescimento: 76.2 },
  { mes: "Fev/26", valor: 126037, crescimento: 4.1 },
];

export const faturasPorStatus = [
  { mes: "Abr/25", pago: 1, atrasado: 0, cancelado: 0, esperado: 0 },
  { mes: "Mai/25", pago: 6, atrasado: 0, cancelado: 0, esperado: 0 },
  { mes: "Jun/25", pago: 16, atrasado: 0, cancelado: 6, esperado: 0 },
  { mes: "Jul/25", pago: 50, atrasado: 2, cancelado: 10, esperado: 0 },
  { mes: "Ago/25", pago: 85, atrasado: 4, cancelado: 20, esperado: 0 },
  { mes: "Set/25", pago: 85, atrasado: 15, cancelado: 25, esperado: 0 },
  { mes: "Out/25", pago: 109, atrasado: 19, cancelado: 34, esperado: 0 },
  { mes: "Nov/25", pago: 119, atrasado: 24, cancelado: 41, esperado: 0 },
  { mes: "Dez/25", pago: 164, atrasado: 33, cancelado: 47, esperado: 0 },
  { mes: "Jan/26", pago: 163, atrasado: 55, cancelado: 54, esperado: 0 },
  { mes: "Fev/26", pago: 115, atrasado: 54, cancelado: 56, esperado: 76 },
];

export const gmvComCancelado = [
  { mes: "Jun/25", cancelado: 7250, pago: 4750, atrasado: 0 },
  { mes: "Jul/25", cancelado: 12021, pago: 6583, atrasado: 1250 },
  { mes: "Ago/25", cancelado: 31300, pago: 18593, atrasado: 0 },
  { mes: "Set/25", cancelado: 40791, pago: 11290, atrasado: 7108 },
  { mes: "Out/25", cancelado: 64842, pago: 15797, atrasado: 5858 },
  { mes: "Nov/25", cancelado: 78482, pago: 10050, atrasado: 4539 },
  { mes: "Dez/25", cancelado: 95822, pago: 10050, atrasado: 1000 },
  { mes: "Jan/26", cancelado: 115632, pago: 0, atrasado: 0 },
  { mes: "Fev/26", cancelado: 121803, pago: 0, atrasado: 0 },
];

export const topDevedores = [
  { nome: "Marcelo Costa Soares", valor: 14050, faturas: 5, dataCompra: "2025-09-18" },
  { nome: "Renan Santos Ribeiro", valor: 13325, faturas: 5, dataCompra: "2025-09-26" },
  { nome: "Savio Goncalves Viana", valor: 13325, faturas: 5, dataCompra: "2025-08-22" },
  { nome: "Rogerio H. de Araujo", valor: 12600, faturas: 4, dataCompra: "2025-10-25" },
  { nome: "Carlos A. dos Santos", valor: 12600, faturas: 4, dataCompra: "2025-10-27" },
  { nome: "Marta d s Giove", valor: 12220, faturas: 4, dataCompra: "2025-09-30" },
  { nome: "Airton Galvão Penko", valor: 10521, faturas: 4, dataCompra: "2025-10-13" },
  { nome: "Lucas Lopes Duarte", valor: 10300, faturas: 2, dataCompra: "2025-11-21" },
  { nome: "Claudio Cunha", valor: 9985, faturas: 5, dataCompra: "2025-09-04" },
  { nome: "Arthur Galvao", valor: 9450, faturas: 3, dataCompra: "2025-11-28" },
];

export const distribuicaoFaixa = [
  { faixa: "R$0-2k", usuarios: 8 },
  { faixa: "R$2k-5k", usuarios: 45 },
  { faixa: "R$5k-10k", usuarios: 22 },
  { faixa: "R$10k-20k", usuarios: 8 },
];

export const distribuicaoFaturas = [
  { qtd: "1", usuarios: 28 },
  { qtd: "2", usuarios: 25 },
  { qtd: "3", usuarios: 11 },
  { qtd: "4", usuarios: 6 },
  { qtd: "5", usuarios: 8 },
  { qtd: "6", usuarios: 4 },
  { qtd: "7", usuarios: 1 },
];

export const kpisGlobais = {
  gmvPago: 1790000,
  gmvPagoFaturas: 913,
  gmvAtrasado: 406000,
  gmvAtrasadoFaturas: 206,
  renovacaoEsperada: 4730000,
  renovacaoEsperadaFaturas: 1859,
  canceladoTotal: 1360000,
  canceladoFaturas: 616,
  taxaInadimplencia: 18.5,
  taxaCancelamento: 35.5,
  usuariosInadimplentes: 83,
  ticketMedioAtrasado: 5130,
  crescimentoFev: 4.1,
  crescimentoJan: 76.2,
};

// ==============================
// Textos de Insights
// ==============================

export const insightsInadimplencia = [
  {
    tipo: "danger" as const,
    icone: "⚠️",
    texto: "A taxa de inadimplência saltou de 1.5% em jul/25 para 29.0% em fev/26 — um crescimento de quase 20x em 8 meses. A tendência é de forte deterioração.",
  },
  {
    tipo: "warning" as const,
    icone: "⚡",
    texto: "O crescimento mensal desacelerou drasticamente de +76.2% (jan) para +4.1% (fev), o que pode indicar estabilização ou efeito sazonal.",
  },
  {
    tipo: "info" as const,
    icone: "💡",
    texto: "O GMV atrasado em fev/26 (R$ 126k) é quase equivalente ao valor total pago em ago/25 (R$ 120k), mostrando a escala do problema.",
  },
];

export const insightsCancelamentos = [
  {
    tipo: "danger" as const,
    icone: "⚠️",
    texto: "No 2º dataset (que inclui cancelamentos), o volume cancelado supera o pago a partir de set/25 e domina completamente a partir de jan/26.",
  },
  {
    tipo: "warning" as const,
    icone: "⚡",
    texto: "Os cancelamentos cresceram de R$ 7.2k em jun/25 para R$ 122k em fev/26 — um aumento de 17x em 9 meses.",
  },
  {
    tipo: "info" as const,
    icone: "💡",
    texto: "O padrão sugere que há um churn elevado: muitos assinantes entram mas cancelam nas primeiras parcelas, especialmente a partir do 3º-4º mês.",
  },
];

export const insightsDevedores = [
  {
    tipo: "danger" as const,
    icone: "⚠️",
    texto: "54% dos inadimplentes (45 pessoas) têm entre R$ 2k e R$ 5k atrasados — essa é a faixa que concentra o maior volume de risco.",
  },
  {
    tipo: "warning" as const,
    icone: "⚡",
    texto: "64% dos inadimplentes (53 pessoas) têm 1-2 faturas atrasadas, indicando inadimplência recente que ainda pode ser recuperável.",
  },
  {
    tipo: "info" as const,
    icone: "💡",
    texto: "100% das compras foram feitas via cartão de crédito e todas referentes ao produto Plataforma LLMIDIA.",
  },
];

export const resumoExecutivo =
  "O sistema de parcelamento inteligente movimentou R$ 1.79M em pagamentos efetivados, mas acumula R$ 406k em atraso (18.5% do GMV faturado) e R$ 1.36M em cancelamentos. A taxa de inadimplência cresceu de 1.5% para 29% em 8 meses, embora o ritmo de crescimento tenha desacelerado em fevereiro. A receita futura esperada é de R$ 4.73M em 1.859 faturas, mas está sob risco dado o comportamento histórico.";

export const riscosCriticos = [
  "Inadimplência acelerando: A taxa subiu 20x em 8 meses (1.5% → 29%). Se mantiver a trajetória, pode ultrapassar 35% até abril/26.",
  "Churn massivo: 35.5% das faturas já emitidas foram canceladas. O cancelado (R$ 1.36M) é 76% do pago (R$ 1.79M).",
  "Receita futura em risco: R$ 4.73M de renovações esperadas, mas o histórico de churn sugere que 35-50% pode ser perdido.",
  "Concentração extrema: 100% da base é de um único produto (LLMIDIA), criando risco sistêmico.",
];

export const oportunidades = [
  "Desaceleração da inadimplência: O crescimento caiu de +76% para +4% em fev, sinalizando possível estabilização.",
  "Recuperação acessível: 64% dos inadimplentes (53 pessoas) têm apenas 1-2 faturas atrasadas — são mais fáceis de recuperar.",
  "Base crescente: O GMV pago cresceu de R$ 1k (abr/25) para R$ 387k (jan/26), mostrando tração comercial forte.",
  "Ticket alto: Ticket médio de R$ 5.1k de atraso indica produtos de alto valor, onde a negociação 1-a-1 pode ser viável.",
];

export const recomendacoes = [
  {
    titulo: "Cobrança segmentada",
    texto: "Priorizar os 53 inadimplentes com 1-2 faturas (mais recuperáveis) antes dos 30 com 3+ faturas.",
    icone: "🎯",
  },
  {
    titulo: "Régua de cobrança antecipada",
    texto: "Implementar lembretes 3, 7 e 15 dias antes do vencimento.",
    icone: "📧",
  },
  {
    titulo: "Renegociação do Top 10",
    texto: "Os 10 maiores devedores somam ~R$ 120k. Oferecer desconto de 10-20% para quitação à vista.",
    icone: "🤝",
  },
  {
    titulo: "Análise de crédito pré-venda",
    texto: "Implementar score de crédito ou limite de parcelas para perfis de risco elevado.",
    icone: "🔍",
  },
  {
    titulo: "Dunning automático",
    texto: "Automatizar retry de cobrança no cartão em D+1, D+3, D+7 e D+15 após vencimento.",
    icone: "🔄",
  },
  {
    titulo: "Revisão do modelo de parcelamento",
    texto: "Considerar reduzir o número máximo de parcelas ou exigir entrada maior.",
    icone: "📋",
  },
];

export const cenarios = [
  { nome: "Otimista", churn: 20, recuperacao: 60, valor: 4020000, cor: "#10b981" },
  { nome: "Base", churn: 35, recuperacao: 30, valor: 3190000, cor: "#f59e0b" },
  { nome: "Pessimista", churn: 50, recuperacao: 10, valor: 2410000, cor: "#ef4444" },
];

// ==============================
// Helpers de formatação
// ==============================

const fmtFull = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatCurrencyBR = (v: number) => fmtFull.format(v);
export const formatCurrencyCompact = (v: number) => fmtCompact.format(v);
