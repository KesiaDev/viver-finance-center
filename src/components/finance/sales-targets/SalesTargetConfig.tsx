import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesTarget, SalesTargetInsert } from "@/types/financial";

const salesTargetSchema = z.object({
  monthly_target: z.coerce.number().min(0, "Valor deve ser positivo"),
  cash_sale_percentage: z.coerce.number().min(0).max(100),
  recurring_sale_percentage: z.coerce.number().min(0).max(100),
  target_ml_percentage: z.coerce.number().min(0).max(100),
});

type SalesTargetFormData = z.infer<typeof salesTargetSchema>;

interface SalesTargetConfigProps {
  salesTarget?: SalesTarget;
  periodId: string;
  onSubmit: (data: SalesTargetInsert) => void;
  isLoading?: boolean;
}

export const SalesTargetConfig = ({
  salesTarget,
  periodId,
  onSubmit,
  isLoading = false,
}: SalesTargetConfigProps) => {
  const form = useForm<SalesTargetFormData>({
    resolver: zodResolver(salesTargetSchema),
    defaultValues: {
      monthly_target: salesTarget?.monthly_target || 0,
      cash_sale_percentage: salesTarget?.cash_sale_percentage || 50,
      recurring_sale_percentage: salesTarget?.recurring_sale_percentage || 50,
      target_ml_percentage: salesTarget?.target_ml_percentage || 30,
    },
  });

  const cashPercentage = form.watch("cash_sale_percentage");

  const handleSubmit = (data: SalesTargetFormData) => {
    onSubmit({
      ...data,
      period_id: periodId,
      recurring_sale_percentage: 100 - data.cash_sale_percentage,
      recurring_installments: 12, // Fixo em 12 parcelas
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Meta de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="monthly_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Mensal (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cash_sale_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distribuição À Vista / Recorrente</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    À Vista: {cashPercentage}% | Recorrente: {100 - cashPercentage}%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_ml_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta de Margem Líquida (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
