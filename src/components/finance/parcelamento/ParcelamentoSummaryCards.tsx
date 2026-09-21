import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/taxCalculations";
import { DollarSign, CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { ParcelamentoSummary } from "@/hooks/useHublaEvents";

interface ParcelamentoSummaryCardsProps {
  summary: ParcelamentoSummary;
}

export function ParcelamentoSummaryCards({ summary }: ParcelamentoSummaryCardsProps) {
  const cards = [
    {
      title: "Total Parcelado",
      value: summary.totalParcelado,
      subtitle: `${summary.quantidadeParcelamentos} parcelamentos`,
      icon: DollarSign,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Pago",
      value: summary.totalPago,
      subtitle: "Parcelas recebidas",
      icon: CheckCircle,
      iconColor: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Atrasado",
      value: summary.totalAtrasado,
      subtitle: `${summary.quantidadeAtrasados} com atraso`,
      icon: AlertCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Total Agendado",
      value: summary.totalAgendado,
      subtitle: "Parcelas futuras",
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
