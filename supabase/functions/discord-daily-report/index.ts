import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MonthlyPlanning {
  month: string;
  revenue: number | null;
  planned_revenue: number | null;
  other_revenue: number | null;
  forecast_revenue: number | null;
  revenue_new_sales: number | null; // Valor Atingido (vendas manuais)
  expense: number | null;
  planned_expense: number | null;
  other_expense: number | null;
  forecast_expense: number | null;
  tax: number | null;
  distribution: number | null;
  initial_balance: number | null;
  platform_fee: number | null;
}

interface MonthlyTarget {
  revenue_target: number | null;
}

interface SalesTargetConfig {
  annualTarget: number;
  cashPercentage: number;
  recurringPercentage: number;
  recurringInstallments: number;
}

// Calcula a meta do mês baseado em À Vista + Recorrente (igual ao Simulador de Metas de Vendas)
// Agora usa metas mensais customizadas da tabela sales_target_monthly
function calculateMonthlyTarget(
  currentMonthIndex: number, // 0-11 (janeiro = 0)
  config: SalesTargetConfig,
  customTargets: Record<string, number>, // Metas customizadas por mês (chave: "YYYY-MM-01")
  selectedYear: number
): number {
  const { annualTarget, cashPercentage, recurringPercentage, recurringInstallments } = config;
  const defaultTarget = annualTarget / 12;
  
  // Usar meta customizada do mês atual se existir
  const currentMonthKey = `${selectedYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`;
  const monthlyTargetValue = customTargets[currentMonthKey] ?? defaultTarget;
  
  // À Vista do mês atual (baseado na meta do mês, não na média)
  const cashAmount = monthlyTargetValue * (cashPercentage / 100);
  
  // Recorrente acumulado (parcelas de cada mês usando suas metas específicas)
  let recurringAccumulated = 0;
  for (let i = 0; i <= currentMonthIndex; i++) {
    const prevMonthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}-01`;
    const prevTarget = customTargets[prevMonthKey] ?? defaultTarget;
    const prevRecurringAmount = prevTarget * (recurringPercentage / 100);
    const prevInstallment = prevRecurringAmount / recurringInstallments;
    
    const installmentNumber = currentMonthIndex - i + 1;
    if (installmentNumber <= recurringInstallments) {
      recurringAccumulated += prevInstallment;
    }
  }
  
  return cashAmount + recurringAccumulated;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function createProgressBar(percent: number): string {
  const filled = Math.min(Math.max(Math.round(percent / 5), 0), 20);
  const empty = 20 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getMonthLabel(month: string): string {
  const date = new Date(month + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// Calcula o Saldo Final do Planejamento até o mês alvo (IGUAL PlanningTable.tsx)
function calculateAccumulatedCash(
  planningData: MonthlyPlanning[], 
  upToMonth: string,
  hublaFeePercentage: number = 17
): number {
  // Ordenar dados por mês
  const sortedData = [...planningData].sort((a, b) => 
    a.month.localeCompare(b.month)
  );
  
  const targetDate = new Date(upToMonth + "-01T00:00:00");
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  let previousSaldoFinal = 0;
  let finalBalance = 0;
  
  for (let i = 0; i < sortedData.length; i++) {
    const data = sortedData[i];
    const monthDate = new Date(data.month + "-01T00:00:00");
    
    // Parar se passou do mês alvo
    if (monthDate > targetDate) break;
    
    // Determinar tipo do mês
    const isPast = monthDate < currentMonthStart;
    const isCurrent = monthDate.getMonth() === today.getMonth() && 
                      monthDate.getFullYear() === today.getFullYear();
    
    // Valores do banco
    const revenue = Number(data.revenue) || 0;
    const plannedRevenue = Number(data.planned_revenue) || 0;
    const otherRevenue = Number(data.other_revenue) || 0;
    const forecastRevenue = Number(data.forecast_revenue) || 0;
    const expense = Number(data.expense) || 0;
    const plannedExpense = Number(data.planned_expense) || 0;
    const otherExpense = Number(data.other_expense) || 0;
    const forecastExpense = Number(data.forecast_expense) || 0;
    const tax = Number(data.tax) || 0;
    const distribution = Number(data.distribution) || 0;
    
    // Saldo inicial: primeiro mês usa banco, demais herdam saldo anterior
    const initialBalance = i === 0 
      ? (Number(data.initial_balance) || 0)
      : previousSaldoFinal;
    
    // Totais incluindo TODOS os componentes (igual PlanningTable)
    const totalRevenue = revenue + plannedRevenue + otherRevenue + forecastRevenue;
    const totalExpense = expense + plannedExpense + otherExpense + forecastExpense;
    
    // Taxa Hubla: lógica por tipo de mês (igual PlanningTable)
    let platformFee: number;
    if (isPast) {
      // Mês passado: usa valor do banco
      platformFee = Number(data.platform_fee) || 0;
    } else if (isCurrent) {
      // Mês atual: apenas sobre forecast
      platformFee = forecastRevenue * (hublaFeePercentage / 100);
    } else {
      // Mês futuro: sobre receita total
      platformFee = totalRevenue * (hublaFeePercentage / 100);
    }
    
    // Saldo Final = Saldo Inicial + Receitas - Despesas - Taxa Hubla - Impostos - Distribuição
    finalBalance = initialBalance + totalRevenue - totalExpense - platformFee - tax - distribution;
    previousSaldoFinal = finalBalance;
  }
  
  return finalBalance;
}

// Cria embed para relatório mensal (modelo simplificado)
function createMonthlyEmbed(
  target: number,
  salesAchieved: number,
  totalDespesas: number,
  netMarginTotal: number,
  netProfitTotal: number
) {
  // Progresso da meta baseado no valor Atingido (vendas manuais), não nas receitas
  const progressPercent = target > 0 ? (salesAchieved / target) * 100 : 0;
  const gap = target - salesAchieved;
  const progressBar = createProgressBar(progressPercent);
  const gapText = gap > 0 ? `Faltam ${formatCurrency(gap)}` : `Meta superada em ${formatCurrency(Math.abs(gap))}!`;

  return {
    title: `📊 RESUMO FINANCEIRO DIÁRIO`,
    description: `**${formatDate()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━`,
    color: progressPercent >= 100 ? 0x22c55e : progressPercent >= 70 ? 0xf59e0b : 0xef4444,
    fields: [
      {
        name: "🎯 Meta do Mês",
        value: formatCurrency(target),
        inline: false,
      },
      {
        name: "📈 Progresso da Meta",
        value: `\`${progressBar}\` **${formatPercent(progressPercent)}**\n${gapText}`,
        inline: false,
      },
      {
        name: "📉 DESPESAS",
        value: formatCurrency(totalDespesas),
        inline: false,
      },
      {
        name: "📈 MARGEM LÍQUIDA",
        value: formatPercent(netMarginTotal),
        inline: false,
      },
      {
        name: "💵 GERAÇÃO DE CAIXA",
        value: formatCurrency(netProfitTotal),
        inline: false,
      },
    ],
    footer: {
      text: "Viver de IA • Relatório Automático",
    },
    timestamp: new Date().toISOString(),
  };
}

// Cria embed para relatório anual
function createAnnualEmbed(
  year: string,
  totalRevenue: number,
  totalExpense: number,
  totalTax: number,
  totalDistribution: number,
  cashGeneration: number,
  avgMlPercent: number,
  initialBalance: number,
  finalBalance: number,
  annualTarget: number
) {
  const progressPercent = annualTarget > 0 ? (totalRevenue / annualTarget) * 100 : 0;
  const gap = annualTarget - totalRevenue;
  const progressBar = createProgressBar(progressPercent);
  const gapText = gap > 0 ? `Faltam ${formatCurrency(gap)}` : `Meta superada em ${formatCurrency(Math.abs(gap))}!`;

  return {
    title: `📊 RESUMO ANUAL - ${year}`,
    description: `**${formatDate()}**\n━━━━━━━━━━━━━━━━━━━━━━━━━`,
    color: progressPercent >= 100 ? 0x22c55e : progressPercent >= 70 ? 0xf59e0b : 0xef4444,
    fields: [
      {
        name: "🎯 Meta Anual",
        value: formatCurrency(annualTarget),
        inline: false,
      },
      {
        name: "📈 Progresso da Meta",
        value: `\`${progressBar}\` **${formatPercent(progressPercent)}**\n${gapText}`,
        inline: false,
      },
      {
        name: "💰 RECEITAS TOTAIS",
        value: formatCurrency(totalRevenue),
        inline: true,
      },
      {
        name: "📉 DESPESAS TOTAIS",
        value: formatCurrency(totalExpense),
        inline: true,
      },
      {
        name: "📈 ML% MÉDIO",
        value: formatPercent(avgMlPercent),
        inline: true,
      },
      {
        name: "💸 IMPOSTOS + DISTRIBUIÇÃO",
        value: `• Impostos: ${formatCurrency(totalTax)}\n• Distribuição: ${formatCurrency(totalDistribution)}`,
        inline: true,
      },
      {
        name: "💵 GERAÇÃO DE CAIXA",
        value: formatCurrency(cashGeneration),
        inline: true,
      },
      {
        name: "\u200B",
        value: "",
        inline: true,
      },
      {
        name: "\u200B",
        value: "━━━━━━━━━━━━━━━━━━━━━━━━━",
        inline: false,
      },
      {
        name: "🏦 SALDO INICIAL",
        value: formatCurrency(initialBalance),
        inline: true,
      },
      {
        name: "🏦 SALDO FINAL",
        value: formatCurrency(finalBalance),
        inline: true,
      },
    ],
    footer: {
      text: "Viver de IA • Relatório Anual",
    },
    timestamp: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ler parâmetros do body (opcionais)
    const body = await req.json().catch(() => ({}));
    
    // Verificar se a automação está ativa (ignora se for execução manual)
    if (!body.manual) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const checkSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: config } = await checkSupabase
        .from("automation_config")
        .select("is_active")
        .eq("function_name", "discord-daily-report")
        .maybeSingle();
      
      if (!config?.is_active) {
        console.log("Automação pausada - ignorando execução agendada");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Automação pausada - execução ignorada",
            skipped: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    const reportType = body.type || 'current'; // 'current', 'monthly', 'annual'
    const targetMonth = body.month; // Para tipo 'monthly' (formato: 'yyyy-MM-01')
    const targetYear = body.year; // Para tipo 'annual' (ex: '2025')

    console.log(`Tipo de relatório: ${reportType}, mês: ${targetMonth}, ano: ${targetYear}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Buscar todos os webhooks configurados
    const discordWebhookUrl1 = Deno.env.get("DISCORD_WEBHOOK_URL");
    const discordWebhookUrl2 = Deno.env.get("DISCORD_WEBHOOK_URL_2");
    const discordWebhookUrl3 = Deno.env.get("DISCORD_WEBHOOK_URL_3");
    
    // Mapear webhooks por nome
    const webhookMap: Record<string, string | undefined> = {
      primary: discordWebhookUrl1,
      secondary: discordWebhookUrl2,
      tertiary: discordWebhookUrl3,
    };
    
    // Criar cliente Supabase antecipadamente para buscar configuração
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar configuração de webhooks - prioridade:
    // 1. body.webhooks (chamada direta do frontend/modal)
    // 2. body.config.webhooks (via manage-automation "Executar Agora")
    // 3. Buscar do banco de dados (via pg_cron automático)
    // 4. Fallback para todos os webhooks
    let requestedWebhooks: string[] = ['primary', 'secondary', 'tertiary'];
    
    if (body.webhooks && Array.isArray(body.webhooks)) {
      // Chamada direta do modal de relatório
      requestedWebhooks = body.webhooks;
      console.log(`Webhooks do body.webhooks: ${requestedWebhooks.join(', ')}`);
    } else if (body.config?.webhooks && Array.isArray(body.config.webhooks)) {
      // Chamada via manage-automation (Executar Agora)
      requestedWebhooks = body.config.webhooks;
      console.log(`Webhooks do body.config.webhooks: ${requestedWebhooks.join(', ')}`);
    } else {
      // Buscar configuração do banco de dados (pg_cron ou sem configuração)
      const { data: automationConfig, error: configError } = await supabase
        .from("automation_config")
        .select("config")
        .eq("function_name", "discord-daily-report")
        .maybeSingle();
      
      if (!configError && automationConfig?.config?.webhooks && Array.isArray(automationConfig.config.webhooks)) {
        requestedWebhooks = automationConfig.config.webhooks;
        console.log(`Webhooks carregados do banco: ${requestedWebhooks.join(', ')}`);
      } else {
        console.log(`Usando fallback - todos os webhooks: ${requestedWebhooks.join(', ')}`);
      }
    }
    
    const webhooks = requestedWebhooks
      .map((name: string) => webhookMap[name])
      .filter(Boolean) as string[];

    if (webhooks.length === 0) {
      throw new Error("Nenhum DISCORD_WEBHOOK_URL configurado");
    }
    
    console.log(`${webhooks.length} webhook(s) Discord configurado(s) de ${requestedWebhooks.length} solicitado(s)`);

    // supabase já foi criado acima para buscar configuração de webhooks

    let embed;

    if (reportType === 'annual') {
      // === RELATÓRIO ANUAL ===
      const year = targetYear || new Date().getFullYear().toString();
      const startMonth = `${year}-01-01`;
      const endMonth = `${year}-12-31`;

      // Buscar todos os dados de planejamento do ano
      const { data: yearPlanningData, error: planningError } = await supabase
        .from("monthly_planning")
        .select("*")
        .gte("month", startMonth)
        .lte("month", endMonth)
        .order("month", { ascending: true });

      if (planningError) {
        console.error("Erro ao buscar planning:", planningError);
      }

      // Buscar sales_targets para o ano
      const { data: periodData } = await supabase
        .from("financial_periods")
        .select("id")
        .ilike("name", `%${year}%`)
        .maybeSingle();

      let annualTarget = 0;
      if (periodData?.id) {
        const { data: salesTargetData } = await supabase
          .from("sales_targets")
          .select("annual_target")
          .eq("period_id", periodData.id)
          .maybeSingle();
        annualTarget = salesTargetData?.annual_target || 0;
      }

      const planningArray = (yearPlanningData as MonthlyPlanning[]) || [];

      // Calcular totais do ano
      let totalRevenue = 0;
      let totalOperationalExpense = 0;
      let totalTax = 0;
      let totalDistribution = 0;
      let totalPlatformFee = 0;
      let initialBalance = 0;
      let mlSum = 0;
      let monthsWithRevenue = 0;

      for (let i = 0; i < planningArray.length; i++) {
        const p = planningArray[i];
        const revenue = (Number(p.revenue) || 0) + (Number(p.other_revenue) || 0) + (Number(p.forecast_revenue) || 0);
        const expense = (Number(p.expense) || 0) + (Number(p.other_expense) || 0) + (Number(p.forecast_expense) || 0);
        
        totalRevenue += revenue;
        totalOperationalExpense += expense;
        totalTax += Number(p.tax) || 0;
        totalDistribution += Number(p.distribution) || 0;
        totalPlatformFee += Number(p.platform_fee) || 0;

        if (i === 0) {
          initialBalance = Number(p.initial_balance) || 0;
        }

        if (revenue > 0) {
          const ebitda = revenue - expense;
          const netProfit = ebitda - (Number(p.tax) || 0) - (Number(p.distribution) || 0);
          mlSum += (netProfit / revenue) * 100;
          monthsWithRevenue++;
        }
      }

      const totalExpense = totalOperationalExpense + totalTax + totalDistribution + totalPlatformFee;
      const cashGeneration = totalRevenue - totalExpense;
      const avgMlPercent = monthsWithRevenue > 0 ? mlSum / monthsWithRevenue : 0;
      const finalBalance = initialBalance + cashGeneration;

      embed = createAnnualEmbed(
        year,
        totalRevenue,
        totalExpense,
        totalTax,
        totalDistribution,
        cashGeneration,
        avgMlPercent,
        initialBalance,
        finalBalance,
        annualTarget
      );

    } else {
      // === RELATÓRIO MENSAL (current ou monthly) ===
      const currentMonth = reportType === 'monthly' && targetMonth 
        ? targetMonth 
        : getCurrentMonth();
      
      const monthLabel = getMonthLabel(currentMonth);
      console.log(`Buscando dados para o mês: ${currentMonth}`);

      // Buscar TODOS os dados de planejamento até o mês atual (para calcular caixa acumulado)
      const { data: allPlanningData, error: planningError } = await supabase
        .from("monthly_planning")
        .select("*")
        .lte("month", currentMonth)
        .order("month", { ascending: true });

      if (planningError) {
        console.error("Erro ao buscar planning:", planningError);
      }

      // Buscar meta do mês
      const { data: targetData, error: targetError } = await supabase
        .from("monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();

      if (targetError) {
        console.error("Erro ao buscar target:", targetError);
      }

      // Buscar configuração de sales_targets para calcular meta correta
      const currentYear = new Date().getFullYear();
      const { data: periodData } = await supabase
        .from("financial_periods")
        .select("id")
        .ilike("name", `%${currentYear}%`)
        .maybeSingle();

      let salesConfig: SalesTargetConfig = {
        annualTarget: 0,
        cashPercentage: 70,
        recurringPercentage: 30,
        recurringInstallments: 12
      };

      if (periodData?.id) {
        const { data: salesTargetData } = await supabase
          .from("sales_targets")
          .select("annual_target, cash_sale_percentage, recurring_sale_percentage, recurring_installments")
          .eq("period_id", periodData.id)
          .maybeSingle();
        
        if (salesTargetData) {
          salesConfig = {
            annualTarget: salesTargetData.annual_target || 0,
            cashPercentage: salesTargetData.cash_sale_percentage || 70,
            recurringPercentage: salesTargetData.recurring_sale_percentage || 30,
            recurringInstallments: salesTargetData.recurring_installments || 12
          };
        }
      }

      // Buscar metas mensais customizadas da tabela sales_target_monthly
      const { data: monthlyTargetsData } = await supabase
        .from("sales_target_monthly")
        .select("month, monthly_target, sales_target_id")
        .order("created_at", { ascending: false });

      // Criar mapa de metas customizadas por mês
      const customMonthlyTargets: Record<string, number> = {};
      if (monthlyTargetsData) {
        for (const mt of monthlyTargetsData) {
          // Usar apenas o primeiro (mais recente) para cada mês
          if (!customMonthlyTargets[mt.month]) {
            customMonthlyTargets[mt.month] = Number(mt.monthly_target) || 0;
          }
        }
      }
      
      console.log(`Metas customizadas carregadas: ${Object.keys(customMonthlyTargets).length} meses`);

      // Buscar saldos de caixa e taxa Hubla
      const { data: configData, error: configError } = await supabase
        .from("financial_config")
        .select("key, value")
        .in("key", ["saldo_livre", "saldo_retido", "hubla_fee_percentage"]);

      if (configError) {
        console.error("Erro ao buscar config:", configError);
      }

      const saldoLivre = configData?.find((c: { key: string; value: number }) => c.key === "saldo_livre")?.value || 0;
      const saldoRetido = configData?.find((c: { key: string; value: number }) => c.key === "saldo_retido")?.value || 0;
      const saldoTotal = saldoLivre + saldoRetido;
      const hublaFeePercentage = configData?.find((c: { key: string; value: number }) => c.key === "hubla_fee_percentage")?.value || 17;

      // Pegar dados do mês
      const currentMonthData = (allPlanningData as MonthlyPlanning[] | null)?.find(
        (d) => d.month === currentMonth
      );
      
      // Calcular meta do mês baseado em À Vista + Recorrente usando metas customizadas
      const currentMonthIndex = new Date().getMonth(); // 0 para janeiro
      const target = calculateMonthlyTarget(currentMonthIndex, salesConfig, customMonthlyTargets, currentYear);
      
      // Log detalhado para debug
      const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`;
      const customTarget = customMonthlyTargets[currentMonthKey];
      console.log(`Meta do mês ${currentMonthKey}: customizada=${customTarget ? formatCurrency(customTarget) : 'N/A'}, default=${formatCurrency(salesConfig.annualTarget / 12)}`);
      console.log(`Meta calculada (À Vista + Recorrente): ${formatCurrency(target)}`);
      console.log(`Config: annualTarget=${salesConfig.annualTarget}, cash=${salesConfig.cashPercentage}%, recurring=${salesConfig.recurringPercentage}%`);

      // ============================================================
      // CÁLCULO DE RECEITAS E DESPESAS (IGUAL AO PLANNINGTABLE)
      // ============================================================
      
      // RECEITAS - componentes individuais
      const revenue = Number(currentMonthData?.revenue) || 0;
      const plannedRevenue = Number(currentMonthData?.planned_revenue) || 0;
      const otherRevenue = Number(currentMonthData?.other_revenue) || 0;
      const forecastRevenue = Number(currentMonthData?.forecast_revenue) || 0;
      
      // RECEITA TOTAL (igual ao PlanningTable)
      const totalRevenue = revenue + plannedRevenue + otherRevenue + forecastRevenue;
      
      // Para exibição separada (Realizada vs Prevista)
      const revenueRealizada = revenue + otherRevenue;
      const revenuePrevista = plannedRevenue + forecastRevenue;

      // VALOR ATINGIDO - Prioriza vendas manuais (revenue_new_sales) como na tela de Metas de Vendas
      const salesAchieved = Number(currentMonthData?.revenue_new_sales) || revenueRealizada;
      console.log(`Valor Atingido: revenue_new_sales=${currentMonthData?.revenue_new_sales}, salesAchieved=${formatCurrency(salesAchieved)}`);

      // DESPESAS - componentes individuais
      const expense = Number(currentMonthData?.expense) || 0;
      const plannedExpense = Number(currentMonthData?.planned_expense) || 0;
      const otherExpense = Number(currentMonthData?.other_expense) || 0;
      const forecastExpense = Number(currentMonthData?.forecast_expense) || 0;
      const tax = Number(currentMonthData?.tax) || 0;
      
      // Para mês atual: Taxa Hubla calculada dinamicamente sobre forecast_revenue (igual ao PlanningTable)
      const platformFee = forecastRevenue * (hublaFeePercentage / 100);
      
      console.log(`Taxa Hubla: ${hublaFeePercentage}% sobre forecast_revenue=${formatCurrency(forecastRevenue)} = ${formatCurrency(platformFee)}`);
      
      // DESPESA TOTAL (igual ao PlanningTable: expense + planned + other + forecast + platformFee + tax)
      // Nota: Para mês atual, tax geralmente é 0 no banco (imposto calculado dinamicamente no frontend)
      const totalExpenseBase = expense + plannedExpense + otherExpense + forecastExpense;
      const totalExpense = totalExpenseBase + platformFee + tax;
      
      // Para exibição separada
      const expenseRealizada = expense + otherExpense + tax;
      const expensePrevista = plannedExpense + forecastExpense + platformFee;
      
      // ============================================================
      // CÁLCULOS SIMPLIFICADOS PARA O NOVO MODELO
      // ============================================================
      
      // RECEITAS (apenas realizadas até o momento)
      const totalReceitas = revenueRealizada;
      
      // DESPESAS (TODAS do mês: realizadas + previstas + forecast + taxa Hubla + impostos)
      // Para visualizar a margem considerando todos os compromissos contra receitas realizadas
      const totalDespesas = totalExpense;
      
      // MARGEM LÍQUIDA (receitas realizadas vs todas despesas do mês)
      const netMarginTotal = totalReceitas > 0 
        ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 
        : 0;
      
      // GERAÇÃO DE CAIXA (receitas realizadas - despesas totais do mês)
      const netProfitTotal = totalReceitas - totalDespesas;
      
      console.log(`Receitas (Realizadas): ${formatCurrency(totalReceitas)}`);
      console.log(`Despesas (Total Mês): ${formatCurrency(totalDespesas)}`);
      console.log(`ML Realizada: ${netMarginTotal.toFixed(2)}%`);
      console.log(`Lucro Líquido: ${formatCurrency(netProfitTotal)}`);

      embed = createMonthlyEmbed(
        target,
        salesAchieved,
        totalDespesas,
        netMarginTotal,
        netProfitTotal
      );
    }

    // Se for apenas preview, retornar o embed sem enviar
    if (body.preview === true) {
      console.log("Modo preview - retornando embed sem enviar");
      return new Response(
        JSON.stringify({ 
          success: true, 
          preview: true,
          embed,
          reportType
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enviar para TODOS os canais Discord configurados
    const sendPromises = webhooks.map(async (webhookUrl, index) => {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro ao enviar para webhook ${index + 1}: ${errorText}`);
          return false;
        }
        
        console.log(`Relatório enviado com sucesso para webhook ${index + 1}`);
        return true;
      } catch (error) {
        console.error(`Erro ao enviar para webhook ${index + 1}:`, error);
        return false;
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(Boolean).length;

    console.log(`Relatório ${reportType} enviado para ${successCount}/${webhooks.length} canal(is) Discord`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Resumo enviado para ${successCount}/${webhooks.length} canal(is) Discord`,
        reportType,
        channels: {
          total: webhooks.length,
          success: successCount
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na função discord-daily-report:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
