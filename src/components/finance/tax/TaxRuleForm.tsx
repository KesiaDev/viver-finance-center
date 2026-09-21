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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaxRule, TaxRuleInsert } from "@/types/financial";

const taxRuleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  regime: z.enum(["simples_nacional", "lucro_presumido", "lucro_real"]),
  aliquot_percentage: z.coerce.number().min(0).max(100),
  min_revenue: z.coerce.number().min(0).nullable(),
  max_revenue: z.coerce.number().min(0).nullable(),
  is_active: z.boolean(),
});

type TaxRuleFormData = z.infer<typeof taxRuleSchema>;

interface TaxRuleFormProps {
  rule?: TaxRule;
  onSubmit: (data: TaxRuleInsert) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const regimeOptions = [
  { value: "simples_nacional", label: "Simples Nacional" },
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "lucro_real", label: "Lucro Real" },
];

export const TaxRuleForm = ({
  rule,
  onSubmit,
  onCancel,
  isLoading = false,
}: TaxRuleFormProps) => {
  const form = useForm<TaxRuleFormData>({
    resolver: zodResolver(taxRuleSchema),
    defaultValues: {
      name: rule?.name || "",
      regime: rule?.regime || "simples_nacional",
      aliquot_percentage: rule?.aliquot_percentage || 0,
      min_revenue: rule?.min_revenue || null,
      max_revenue: rule?.max_revenue || null,
      is_active: rule?.is_active ?? true,
    },
  });

  const handleSubmit = (data: TaxRuleFormData) => {
    onSubmit({
      name: data.name,
      regime: data.regime,
      aliquot_percentage: data.aliquot_percentage,
      min_revenue: data.min_revenue,
      max_revenue: data.max_revenue,
      is_active: data.is_active,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Regra</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Faixa 1 - Simples" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="regime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regime Tributário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {regimeOptions.map((option) => (
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
          name="aliquot_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alíquota (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" max="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receita Mínima (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Opcional"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receita Máxima (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Opcional"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Regra Ativa</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
            {isLoading ? "Salvando..." : rule ? "Atualizar" : "Criar Regra"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
