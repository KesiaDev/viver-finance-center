import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TransactionWithCategory, TransactionType } from "@/types/financial";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  onEdit?: (transaction: TransactionWithCategory) => void;
  onDelete?: (transactionId: string) => void;
}

const typeConfig: Record<TransactionType, { icon: typeof ArrowUpCircle; color: string; label: string }> = {
  revenue: { icon: ArrowUpCircle, color: "text-green-600", label: "Receita" },
  expense: { icon: ArrowDownCircle, color: "text-red-600", label: "Despesa" },
  tax: { icon: Receipt, color: "text-amber-600", label: "Imposto" },
};

export const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      !search ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === "all" || t.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transações</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="revenue">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="tax">Impostos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma transação encontrada
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const config = typeConfig[transaction.type];
                  const Icon = config.icon;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.description || "—"}
                          {transaction.is_forecast && (
                            <Badge variant="outline" className="text-xs">
                              Previsão
                            </Badge>
                          )}
                          {transaction.is_recurring && (
                            <Badge variant="secondary" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.category ? (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: transaction.category.color || undefined,
                              color: transaction.category.color || undefined,
                            }}
                          >
                            {transaction.category.name}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${config.color}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(transaction)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(transaction.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
