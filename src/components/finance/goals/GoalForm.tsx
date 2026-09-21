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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Goal, GoalInsert, GoalType } from "@/types/financial";

const goalSchema = z.object({
  type: z.enum(["sales_volume", "sales_value", "net_margin_percentage"]),
  target_value: z.coerce.number().positive("Valor deve ser positivo"),
  description: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  goal?: Goal;
  periodId: string;
  onSubmit: (data: GoalInsert) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const goalTypeOptions = [
  { value: "sales_volume", label: "Volume de Vendas" },
  { value: "sales_value", label: "Valor de Vendas" },
  { value: "net_margin_percentage", label: "Margem Líquida (%)" },
];

export const GoalForm = ({
  goal,
  periodId,
  onSubmit,
  onCancel,
  isLoading = false,
}: GoalFormProps) => {
  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      type: goal?.type || "sales_value",
      target_value: goal?.target_value || 0,
      description: goal?.description || "",
    },
  });

  const handleSubmit = (data: GoalFormData) => {
    onSubmit({
      type: data.type,
      target_value: data.target_value,
      description: data.description,
      period_id: periodId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Meta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {goalTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da Meta</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a meta..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : goal ? "Atualizar" : "Criar Meta"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
