import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, Receipt } from "lucide-react";
import type { TransactionWithCategory, TRANSACTION_TYPE_LABELS } from "@/types/financial";

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
  limit?: number;
}

const typeConfig = {
  revenue: {
    icon: ArrowUpCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Receita",
  },
  expense: {
    icon: ArrowDownCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Despesa",
  },
  tax: {
    icon: Receipt,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Imposto",
  },
};

export const RecentTransactions = ({
  transactions,
  limit = 5,
}: RecentTransactionsProps) => {
  const recentTransactions = transactions.slice(0, limit);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma transação encontrada
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const config = typeConfig[transaction.type];
              const Icon = config.icon;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.description || config.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                        {transaction.category && (
                          <span> • {transaction.category.name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "revenue"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "revenue" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {transaction.is_forecast && (
                      <Badge variant="outline" className="text-xs">
                        Previsão
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
