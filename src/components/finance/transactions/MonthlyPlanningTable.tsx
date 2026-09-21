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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MonthlyPlanning, MonthlyPlanningUpdate } from "@/types/financial";

interface MonthlyPlanningTableProps {
  data: MonthlyPlanning[];
  onUpdate: (id: string, updates: MonthlyPlanningUpdate) => void;
  isLoading?: boolean;
}

export const MonthlyPlanningTable = ({
  data,
  onUpdate,
  isLoading = false,
}: MonthlyPlanningTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<MonthlyPlanning>>({});

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    return format(date, "MMMM/yyyy", { locale: ptBR });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEdit = (row: MonthlyPlanning) => {
    setEditingId(row.id);
    setEditValues({
      revenue: row.revenue,
      expense: row.expense,
      tax: row.tax,
      distribution: row.distribution,
    });
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const calculateNetMargin = (row: MonthlyPlanning) => {
    const revenue = Number(row.revenue) || 0;
    const expense = Number(row.expense) || 0;
    const tax = Number(row.tax) || 0;
    return revenue - expense - tax;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Planejamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum planejamento cadastrado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Despesa</TableHead>
                  <TableHead className="text-right">Imposto</TableHead>
                  <TableHead className="text-right">Distribuição</TableHead>
                  <TableHead className="text-right">Margem Líq.</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const isEditing = editingId === row.id;
                  const netMargin = calculateNetMargin(row);

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {formatMonth(row.month)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 text-right"
                            value={editValues.revenue ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                revenue: Number(e.target.value),
                              })
                            }
                          />
                        ) : (
                          <span className="text-green-600">
                            {formatCurrency(row.revenue)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 text-right"
                            value={editValues.expense ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                expense: Number(e.target.value),
                              })
                            }
                          />
                        ) : (
                          <span className="text-red-600">
                            {formatCurrency(row.expense)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 text-right"
                            value={editValues.tax ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                tax: Number(e.target.value),
                              })
                            }
                          />
                        ) : (
                          <span className="text-amber-600">
                            {formatCurrency(row.tax)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 text-right"
                            value={editValues.distribution ?? ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                distribution: Number(e.target.value),
                              })
                            }
                          />
                        ) : (
                          formatCurrency(row.distribution)
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          netMargin >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(netMargin)}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={isLoading}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(row)}
                          >
                            Editar
                          </Button>
                        )}
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
