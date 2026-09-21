import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Equipamento,
  EquipamentoInput,
  ESTADOS_EQUIPAMENTO,
} from "@/hooks/useEquipamentos";
import { TipoEquipamentoCombobox } from "./TipoEquipamentoCombobox";
import { EquipamentoFotosManager } from "./EquipamentoFotosManager";
import { useColaboradores } from "@/hooks/useColaboradores";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  marca: z.string().max(100).optional().nullable(),
  modelo: z.string().max(100).optional().nullable(),
  numero_serie: z.string().max(100).optional().nullable(),
  patrimonio: z.string().max(50).optional().nullable(),
  estado: z.string().min(1, "Estado é obrigatório"),
  data_aquisicao: z.string().optional().nullable(),
  valor: z.coerce.number().min(0).optional().nullable(),
  colaborador_id: z.string().optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
  ativo: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface EquipamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento?: Equipamento | null;
  onSubmit: (data: EquipamentoInput & { id?: string }) => void;
  isLoading?: boolean;
}

export function EquipamentoForm({
  open,
  onOpenChange,
  equipamento,
  onSubmit,
  isLoading,
}: EquipamentoFormProps) {
  const { colaboradores } = useColaboradores();
  const colaboradoresAtivos = colaboradores?.filter((c) => c.ativo) || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      marca: "",
      modelo: "",
      numero_serie: "",
      patrimonio: "",
      estado: "bom",
      data_aquisicao: "",
      valor: undefined,
      colaborador_id: "none",
      observacoes: "",
      ativo: true,
    },
  });

  // Atualizar valores do formulário quando equipamento ou open mudar
  useEffect(() => {
    if (open) {
      form.reset({
        nome: equipamento?.nome || "",
        tipo: equipamento?.tipo || "",
        marca: equipamento?.marca || "",
        modelo: equipamento?.modelo || "",
        numero_serie: equipamento?.numero_serie || "",
        patrimonio: equipamento?.patrimonio || "",
        estado: equipamento?.estado || "bom",
        data_aquisicao: equipamento?.data_aquisicao || "",
        valor: equipamento?.valor || undefined,
        colaborador_id: equipamento?.colaborador_id || "none",
        observacoes: equipamento?.observacoes || "",
        ativo: equipamento?.ativo ?? true,
      });
    }
  }, [equipamento, open, form]);

  const handleSubmit = (data: FormData) => {
    const payload: EquipamentoInput & { id?: string } = {
      nome: data.nome,
      tipo: data.tipo,
      marca: data.marca || null,
      modelo: data.modelo || null,
      numero_serie: data.numero_serie || null,
      patrimonio: data.patrimonio || null,
      estado: data.estado,
      data_aquisicao: data.data_aquisicao || null,
      valor: data.valor || null,
      colaborador_id: data.colaborador_id === "none" ? null : data.colaborador_id || null,
      observacoes: data.observacoes || null,
      ativo: data.ativo,
    };

    if (equipamento?.id) {
      payload.id = equipamento.id;
    }

    onSubmit(payload);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {equipamento ? "Editar Equipamento" : "Novo Equipamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MacBook Pro 14" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tipo *</FormLabel>
                    <TipoEquipamentoCombobox
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Apple"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: M3 Pro"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: ABC123XYZ"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patrimonio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patrimônio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: PAT-001"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_EQUIPAMENTO.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
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
                name="data_aquisicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Aquisição</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="colaborador_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sem responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem responsável</SelectItem>
                        {colaboradoresAtivos.map((colaborador) => (
                          <SelectItem
                            key={colaborador.id}
                            value={colaborador.id}
                          >
                            {colaborador.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o equipamento..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Equipamento está em uso na empresa
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Seção de Fotos */}
            <Separator className="my-4" />
            {equipamento?.id ? (
              <EquipamentoFotosManager equipamentoId={equipamento.id} />
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/30">
                Salve o equipamento primeiro para adicionar fotos.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
