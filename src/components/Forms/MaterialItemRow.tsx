import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2 } from "lucide-react";
import { Control } from "react-hook-form";

interface MaterialItem {
  descricao: string;
  quantidade: string;
  link: string;
  valor: string;
}

interface MaterialItemRowProps {
  index: number;
  control: Control<any>;
  onRemove: () => void;
  canRemove: boolean;
}

export const MaterialItemRow = ({ index, control, onRemove, canRemove }: MaterialItemRowProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 sm:grid-cols-4">
        <FormField
          control={control}
          name={`itens.${index}.descricao`}
          render={({ field }) => (
            <FormItem className="sm:col-span-4">
              <FormLabel>Descrição do Material *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Teclado mecânico sem fio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`itens.${index}.quantidade`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qtd *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`itens.${index}.link`}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Link do Produto</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`itens.${index}.valor`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Unit. (R$) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
