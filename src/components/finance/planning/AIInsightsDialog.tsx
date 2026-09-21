import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Target,
  FileText,
  Loader2,
  Clock,
  CalendarClock
} from "lucide-react";
import { toast } from "sonner";
import type { InsightsResponse, InsightItem, RecommendationItem } from "@/hooks/useAIInsights";

interface AIInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: InsightsResponse | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  selectedPeriod: string;
}

const InsightCard = ({ 
  items, 
  type 
}: { 
  items: InsightItem[]; 
  type: 'forte' | 'melhoria' | 'atencao' 
}) => {
  const config = {
    forte: {
      icon: CheckCircle2,
      title: "Pontos Fortes",
      bgClass: "bg-green-500/10 border-green-500/20",
      iconClass: "text-green-500",
      badgeClass: "bg-green-500/20 text-green-700 dark:text-green-400",
    },
    melhoria: {
      icon: TrendingUp,
      title: "Pontos de Melhoria",
      bgClass: "bg-amber-500/10 border-amber-500/20",
      iconClass: "text-amber-500",
      badgeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    },
    atencao: {
      icon: AlertTriangle,
      title: "Pontos de Atenção",
      bgClass: "bg-red-500/10 border-red-500/20",
      iconClass: "text-red-500",
      badgeClass: "bg-red-500/20 text-red-700 dark:text-red-400",
    },
  };

  const { icon: Icon, title, bgClass, iconClass, badgeClass } = config[type];

  return (
    <div className={`rounded-lg border p-4 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary" className={badgeClass}>
          {items.length}
        </Badge>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="text-sm">
            <span className="font-medium">{item.titulo}</span>
            <p className="text-muted-foreground mt-0.5">{item.descricao}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const RecommendationsCard = ({ items }: { items: RecommendationItem[] }) => {
  const prazoColors: Record<string, string> = {
    "urgente (mês vigente)": "bg-red-500/20 text-red-700 dark:text-red-400",
    "urgente": "bg-red-500/20 text-red-700 dark:text-red-400",
    "curto prazo": "bg-green-500/20 text-green-700 dark:text-green-400",
    "médio prazo": "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    "longo prazo": "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  };

  const getPrazoColor = (prazo: string) => {
    const lowerPrazo = prazo.toLowerCase();
    for (const [key, value] of Object.entries(prazoColors)) {
      if (lowerPrazo.includes(key)) return value;
    }
    return "bg-muted";
  };

  return (
    <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Recomendações Estratégicas</h3>
      </div>
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="text-sm border-l-2 border-primary/30 pl-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium">{item.acao}</span>
              <Badge 
                variant="secondary" 
                className={getPrazoColor(item.prazo)}
              >
                {item.prazo}
              </Badge>
            </div>
            <p className="text-muted-foreground">{item.impacto}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TemporalContextAlert = ({ metadata }: { metadata: InsightsResponse['metadata'] }) => {
  const hasCurrentMonth = metadata.mesVigente !== null;
  const hasFutureMonths = metadata.mesesProjetados > 0;
  
  if (!hasCurrentMonth && !hasFutureMonths) return null;

  return (
    <Alert className="border-blue-500/30 bg-blue-500/10">
      <CalendarClock className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-sm">
        <span className="font-medium text-blue-700 dark:text-blue-400">Contexto Temporal: </span>
        {metadata.avisoContexto}
        {hasCurrentMonth && metadata.diasRestantes && (
          <span className="ml-1 inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-blue-600 dark:text-blue-300 font-medium">
              {metadata.diasRestantes} dias restantes em {metadata.mesVigente}
            </span>
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const AIInsightsDialog = ({
  open,
  onOpenChange,
  insights,
  isLoading,
  error,
  onRegenerate,
  selectedPeriod,
}: AIInsightsDialogProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!insights) return;

    const text = `
📊 RELATÓRIO DE INSIGHTS FINANCEIROS - ${selectedPeriod.toUpperCase()}
Gerado em: ${new Date(insights.metadata.geradoEm).toLocaleString('pt-BR')}

📋 RESUMO EXECUTIVO
${insights.insights.resumoExecutivo}

✅ PONTOS FORTES
${insights.insights.pontosFortes.map(p => `• ${p.titulo}: ${p.descricao}`).join('\n')}

📈 PONTOS DE MELHORIA
${insights.insights.pontosMelhoria.map(p => `• ${p.titulo}: ${p.descricao}`).join('\n')}

⚠️ PONTOS DE ATENÇÃO
${insights.insights.pontosAtencao.map(p => `• ${p.titulo}: ${p.descricao}`).join('\n')}

🎯 RECOMENDAÇÕES ESTRATÉGICAS
${insights.insights.recomendacoes.map(r => `• ${r.acao} (${r.prazo}): ${r.impacto}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Relatório copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const periodLabels: Record<string, string> = {
    '2025': 'Ano 2025',
    '2026': 'Ano 2026',
    'last12': 'Últimos 12 Meses',
    'last6': 'Últimos 6 Meses',
    'last3': 'Últimos 3 Meses',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">AI Insights</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Análise estratégica - {periodLabels[selectedPeriod] || selectedPeriod}
                </p>
              </div>
            </div>
            {insights && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={copied}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Gerar Novamente
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative p-4 rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium">Analisando dados financeiros...</p>
                  <p className="text-sm text-muted-foreground">
                    A IA está processando os dados do seu planejamento
                  </p>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-destructive">Erro ao gerar insights</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={onRegenerate} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            )}

            {insights && !isLoading && (
              <>
                {/* Contexto Temporal */}
                <TemporalContextAlert metadata={insights.metadata} />

                {/* Resumo Executivo */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Resumo Executivo</h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {insights.insights.resumoExecutivo}
                  </p>
                </div>

                {/* Grid de Insights */}
                <div className="grid gap-4 md:grid-cols-2">
                  <InsightCard items={insights.insights.pontosFortes} type="forte" />
                  <InsightCard items={insights.insights.pontosMelhoria} type="melhoria" />
                </div>

                {/* Pontos de Atenção */}
                <InsightCard items={insights.insights.pontosAtencao} type="atencao" />

                {/* Recomendações */}
                <RecommendationsCard items={insights.insights.recomendacoes} />

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      <span>{insights.metadata.mesesAnalisados} meses analisados</span>
                    </div>
                    {insights.metadata.mesesRealizados > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        {insights.metadata.mesesRealizados} realizados
                      </span>
                    )}
                    {insights.metadata.mesVigente && (
                      <span className="text-amber-600 dark:text-amber-400">
                        1 em andamento
                      </span>
                    )}
                    {insights.metadata.mesesProjetados > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {insights.metadata.mesesProjetados} projetados
                      </span>
                    )}
                  </div>
                  <span>
                    Gerado em {new Date(insights.metadata.geradoEm).toLocaleString('pt-BR')}
                  </span>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
