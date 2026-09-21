import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlanningData {
  month: string;
  initial_balance: number | null;
  revenue: number | null;
  other_revenue: number | null;
  forecast_revenue: number | null;
  revenue_new_sales: number | null;
  revenue_recurring_previous: number | null;
  expense: number | null;
  other_expense: number | null;
  forecast_expense: number | null;
  tax: number | null;
  distribution: number | null;
}

interface InsightsRequest {
  planningData: PlanningData[];
  selectedPeriod: string;
  months: string[];
  currentDate: string;
}

type MonthType = 'past' | 'current' | 'future';

function getMonthType(monthStr: string, currentDate: Date): MonthType {
  const monthDate = new Date(monthStr + '-01T00:00:00');
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

  if (monthStart < currentMonthStart) return 'past';
  if (monthStart.getTime() === currentMonthStart.getTime()) return 'current';
  return 'future';
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
}

function getDaysRemaining(currentDate: Date): number {
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - currentDate.getDate();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planningData, selectedPeriod, months, currentDate: currentDateStr } = await req.json() as InsightsRequest;
    
    const currentDate = new Date(currentDateStr);
    const daysRemaining = getDaysRemaining(currentDate);
    const currentMonthLabel = formatMonthLabel(
      `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    );
    
    console.log("Planning Insights - Recebido:", { 
      selectedPeriod, 
      monthsCount: months.length,
      planningDataCount: planningData.length,
      currentDate: currentDateStr,
      daysRemaining
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Filtrar dados do período selecionado
    const monthsSet = new Set(months);
    const filteredData = planningData.filter(p => monthsSet.has(p.month));

    // Classificar meses por tipo temporal
    const classifiedData = filteredData.map(p => ({
      ...p,
      monthType: getMonthType(p.month, currentDate),
      label: formatMonthLabel(p.month),
    }));

    const pastMonths = classifiedData.filter(m => m.monthType === 'past');
    const currentMonth = classifiedData.find(m => m.monthType === 'current');
    const futureMonths = classifiedData.filter(m => m.monthType === 'future');

    // Calcular métricas agregadas
    const totals = filteredData.reduce((acc, p) => ({
      revenue: acc.revenue + (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0) + (Number(p.forecast_revenue) || 0),
      expense: acc.expense + (Number(p.expense) || 0) + (Number(p.other_expense) || 0) + (Number(p.forecast_expense) || 0),
      tax: acc.tax + (Number(p.tax) || 0),
      distribution: acc.distribution + (Number(p.distribution) || 0),
      newSales: acc.newSales + (Number(p.revenue_new_sales) || 0),
      recurring: acc.recurring + (Number(p.revenue_recurring_previous) || 0),
    }), {
      revenue: 0,
      expense: 0,
      tax: 0,
      distribution: 0,
      newSales: 0,
      recurring: 0,
    });

    const netResult = totals.revenue - totals.expense - totals.tax - totals.distribution;
    const margin = totals.revenue > 0 ? (netResult / totals.revenue) * 100 : 0;
    const recurringPercentage = totals.revenue > 0 ? (totals.recurring / totals.revenue) * 100 : 0;

    // Formatar dados mensais para o prompt
    const formatMonthData = (p: typeof classifiedData[0], suffix: string) => {
      const totalRevenue = (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0) + (Number(p.forecast_revenue) || 0);
      const totalExpense = (Number(p.expense) || 0) + (Number(p.other_expense) || 0) + (Number(p.forecast_expense) || 0);
      const tax = Number(p.tax) || 0;
      const distribution = Number(p.distribution) || 0;
      const result = totalRevenue - totalExpense - tax - distribution;
      
      return `- ${p.label}: Receita R$${totalRevenue.toLocaleString('pt-BR')}, Despesa R$${totalExpense.toLocaleString('pt-BR')}, Impostos R$${tax.toLocaleString('pt-BR')}, Resultado R$${result.toLocaleString('pt-BR')} ${suffix}`;
    };

    // Construir seções de dados por tipo temporal
    let dataSection = '';
    
    if (pastMonths.length > 0) {
      dataSection += `\nDADOS REALIZADOS (meses já fechados - valores reais):\n`;
      dataSection += pastMonths.map(p => formatMonthData(p, '[REAL]')).join('\n');
    }
    
    if (currentMonth) {
      dataSection += `\n\nMÊS VIGENTE (${currentMonthLabel} - ainda em andamento, faltam ${daysRemaining} dias):\n`;
      dataSection += formatMonthData(currentMonth, '[PARCIAL - mês ainda não fechou]');
    }
    
    if (futureMonths.length > 0) {
      dataSection += `\n\nPROJEÇÕES (meses futuros - valores planejados que podem ser ajustados):\n`;
      dataSection += futureMonths.map(p => formatMonthData(p, '[PROJEÇÃO]')).join('\n');
    }

    // Construir aviso de contexto temporal
    let avisoContexto = '';
    if (currentMonth && futureMonths.length > 0) {
      avisoContexto = `Análise considera ${currentMonthLabel} como mês em andamento (faltam ${daysRemaining} dias) e ${futureMonths.length} mês(es) como projeção.`;
    } else if (currentMonth) {
      avisoContexto = `Análise considera ${currentMonthLabel} como mês em andamento (faltam ${daysRemaining} dias para o fechamento).`;
    } else if (futureMonths.length > 0) {
      avisoContexto = `Análise baseada em ${futureMonths.length} mês(es) de projeção - valores podem ser ajustados.`;
    } else {
      avisoContexto = `Análise baseada em ${pastMonths.length} meses de dados realizados.`;
    }

    const systemPrompt = `Você é um consultor financeiro estratégico experiente, especializado em análise de planejamento financeiro para empresas de tecnologia e educação.

Sua análise será apresentada em reunião de diretoria, portanto deve ser:
- Objetiva e orientada a ações
- Com dados específicos e percentuais
- Focada em decisões estratégicas
- Em português brasileiro

IMPORTANTE SOBRE CONTEXTO TEMPORAL:
1. Para meses REALIZADOS: analise resultados concretos e tendências históricas
2. Para o MÊS VIGENTE: considere que os dados são PARCIAIS, faltam dias para fechar. Indique oportunidades de ação imediata.
3. Para meses FUTUROS: trate como PROJEÇÕES/FORECAST, não como dados garantidos. Destaque riscos e oportunidades de ajuste.

Quando houver mês vigente, SEMPRE inclua recomendações de ações urgentes que podem ser tomadas antes do fechamento.
Quando houver projeções futuras, destaque que ainda há tempo para ajustar o planejamento.

IMPORTANTE: Responda APENAS com o JSON válido no formato especificado, sem markdown, sem código, sem explicações adicionais.`;

    const userPrompt = `Analise os seguintes dados financeiros da empresa Viver de IA e forneça insights estratégicos.

CONTEXTO:
- Empresa: Viver de IA (educação em IA)
- Período Analisado: ${selectedPeriod}
- Data da Análise: ${currentDate.toLocaleDateString('pt-BR')}
- Regime Tributário: Lucro Presumido (a partir de Nov/2025)

CONTEXTO TEMPORAL IMPORTANTE:
${avisoContexto}

RESUMO DO PERÍODO:
- Receita Total: R$ ${totals.revenue.toLocaleString('pt-BR')}
- Despesas Totais: R$ ${totals.expense.toLocaleString('pt-BR')}
- Impostos: R$ ${totals.tax.toLocaleString('pt-BR')}
- Distribuição: R$ ${totals.distribution.toLocaleString('pt-BR')}
- Resultado Líquido: R$ ${netResult.toLocaleString('pt-BR')}
- Margem Líquida: ${margin.toFixed(1)}%
- Receita Recorrente: ${recurringPercentage.toFixed(1)}% do total
- Vendas Novas: R$ ${totals.newSales.toLocaleString('pt-BR')}
${dataSection}

Forneça sua análise no seguinte formato JSON (sem markdown):
{
  "resumoExecutivo": "2-3 frases resumindo a situação financeira, mencionando o contexto temporal (ex: 'Com X meses fechados e Y em andamento...')",
  "pontosFortes": [
    {"titulo": "título curto", "descricao": "explicação com dados específicos"},
    ...3-5 pontos
  ],
  "pontosMelhoria": [
    {"titulo": "título curto", "descricao": "explicação com sugestão de ação"},
    ...3-5 pontos
  ],
  "pontosAtencao": [
    {"titulo": "título curto", "descricao": "explicação do risco e urgência. Se for sobre mês vigente, indicar que ainda há tempo para agir"},
    ...2-4 pontos críticos
  ],
  "recomendacoes": [
    {"acao": "ação específica", "impacto": "resultado esperado", "prazo": "URGENTE (mês vigente) / curto prazo / médio prazo / longo prazo"},
    ...3-5 recomendações, priorizando ações urgentes para o mês vigente se aplicável
  ]
}`;

    console.log("Planning Insights - Enviando para Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Lovable AI:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("Planning Insights - Resposta recebida, processando...");

    if (!content) {
      throw new Error("Resposta vazia da IA");
    }

    // Limpar resposta (remover possíveis marcadores de código)
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    // Parse do JSON
    const insights = JSON.parse(cleanContent);

    console.log("Planning Insights - Sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        metadata: {
          periodo: selectedPeriod,
          dataAnalise: currentDate.toISOString(),
          mesesAnalisados: months.length,
          mesesRealizados: pastMonths.length,
          mesVigente: currentMonth ? currentMonthLabel : null,
          diasRestantes: currentMonth ? daysRemaining : null,
          mesesProjetados: futureMonths.length,
          avisoContexto,
          geradoEm: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro em planning-insights:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar insights" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
