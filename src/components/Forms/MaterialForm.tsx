import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Package, Save, FileText, Trash2, Plus } from "lucide-react";
import { useDrafts } from "@/hooks/useDrafts";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useQueryClient } from "@tanstack/react-query";
import { MaterialItemRow } from "./MaterialItemRow";

const itemSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres").max(200, "Descrição muito longa"),
  quantidade: z.string().refine((val) => {
    if (!val) return false;
    const num = parseInt(val);
    return !isNaN(num) && num >= 1;
  }, "Quantidade deve ser pelo menos 1"),
  link: z.string().url("URL inválida").or(z.literal("")),
  valor: z.string().refine((val) => {
    if (!val) return false;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Valor unitário deve ser maior que zero"),
});

const formSchema = z.object({
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
  centroCusto: z.enum(["Produto/IA/Dados", "Vendas", "Marketing", "Operação", "Educação/CS"], {
    required_error: "Centro de custo é obrigatório",
  }),
  justificativa: z.string().min(20, "Justificativa deve ter pelo menos 20 caracteres").max(1000, "Justificativa muito longa"),
});

type FormValues = z.infer<typeof formSchema>;

const defaultItem = { descricao: "", quantidade: "1", link: "", valor: "" };

export const MaterialForm = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { draft, saveDraft, isSaving, deleteDraft, hasDraft } = useDrafts('material');
  const { duplicateData, clearDuplicate } = useDuplicate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itens: [defaultItem],
      centroCusto: undefined,
      justificativa: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  const watchedItens = useWatch({
    control: form.control,
    name: "itens",
  });
  
  const valorTotal = useMemo(() => {
    if (!watchedItens) return 0;
    return watchedItens.reduce((acc, item) => {
      const valor = parseFloat(item?.valor) || 0;
      const quantidade = parseInt(item?.quantidade) || 1;
      return acc + valor * quantidade;
    }, 0);
  }, [watchedItens]);

  // Carregar dados de duplicação (prioridade sobre rascunho)
  useEffect(() => {
    if (duplicateData?.type === 'material' && duplicateData.data) {
      const data = duplicateData.data as any;
      // Se for do formato antigo (sem itens), converter
      if (data.material && !data.itens) {
        form.reset({
          itens: [{ descricao: data.material, link: "", valor: "" }],
          centroCusto: data.centroCusto,
          justificativa: data.justificativa,
        });
      } else {
        form.reset(data as FormValues);
      }
      clearDuplicate();
      toast.info("Formulário preenchido com dados da solicitação anterior");
    }
  }, [duplicateData, clearDuplicate, form]);

  // Carregar rascunho
  useEffect(() => {
    if (draft?.data && !duplicateData) {
      const data = draft.data as any;
      // Se for do formato antigo, converter
      if (data.material && !data.itens) {
        form.reset({
          itens: [{ descricao: data.material, link: "", valor: "" }],
          centroCusto: data.centroCusto,
          justificativa: data.justificativa,
        });
      } else {
        form.reset(data as FormValues);
      }
    }
  }, [draft, duplicateData, form]);

  // Ref para acessar valores atualizados no cleanup
  const formValuesRef = useRef<FormValues>();
  const userRef = useRef(user);
  
  // Manter refs atualizadas
  useEffect(() => {
    formValuesRef.current = form.getValues();
    userRef.current = user;
  });

  // Observar mudanças no form para atualizar ref
  useEffect(() => {
    const subscription = form.watch((values) => {
      formValuesRef.current = values as FormValues;
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-save ao desmontar (trocar de aba)
  useEffect(() => {
    return () => {
      const values = formValuesRef.current;
      const currentUser = userRef.current;
      
      if (!values || !currentUser) return;
      
      const hasContent = values.itens?.some(item => 
        item.descricao || item.link || item.valor || item.quantidade
      ) || values.justificativa;
      
      if (hasContent) {
        supabase
          .from("drafts")
          .upsert({
            user_id: currentUser.id,
            type: 'material',
            data: values,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,type' })
          .then(() => {
            console.log('Rascunho material auto-salvo');
          });
      }
    };
  }, []);

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer uma solicitação");
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar nome do usuário do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const solicitanteNome = profileData?.nome_completo || user.email || 'Usuário';

      // Calcular valor total diretamente dos dados validados (valor unitário × quantidade)
      const valorTotalCalculado = data.itens.reduce((acc, item) => {
        return acc + parseFloat(item.valor) * (parseInt(item.quantidade) || 1);
      }, 0);

      // Criar material com valor total (mantém campo material para compatibilidade)
      const primeiroItem = data.itens[0];
      const descricaoResumo = data.itens.length === 1 
        ? primeiroItem.descricao 
        : `${primeiroItem.descricao} (+${data.itens.length - 1} itens)`;

      const { data: materialData, error: materialError } = await supabase
        .from('materiais')
        .insert({
          user_id: user.id,
          nome_solicitante: solicitanteNome,
          material: descricaoResumo,
          centro_custo: data.centroCusto,
          justificativa: data.justificativa,
          valor_total: valorTotalCalculado,
          status: 'pendente',
        })
        .select()
        .single();

      if (materialError) throw materialError;

      // Inserir itens
      const itensToInsert = data.itens.map(item => ({
        material_id: materialData.id,
        descricao: item.descricao,
        link: item.link || null,
        valor: parseFloat(item.valor),
        quantidade: parseInt(item.quantidade) || 1,
      }));

      const { error: itensError } = await supabase
        .from('material_itens')
        .insert(itensToInsert);

      if (itensError) throw itensError;

      toast.success("Solicitação de material enviada com sucesso!");

      try {
        const itensResumo = data.itens.slice(0, 3).map(i => 
          `• ${i.descricao} - R$ ${parseFloat(i.valor).toFixed(2)}`
        ).join('\n');
        
        await supabase.functions.invoke('discord-notify', {
          body: {
            type: 'material',
            data: {
              nomeSolicitante: solicitanteNome,
              material: `${data.itens.length} item(s):\n${itensResumo}${data.itens.length > 3 ? `\n... e mais ${data.itens.length - 3} item(s)` : ''}`,
              centroCusto: data.centroCusto,
              justificativa: data.justificativa,
              valorTotal: `R$ ${valorTotal.toFixed(2)}`,
            }
          }
        });
      } catch (discordError) {
        console.error('Erro ao notificar Discord:', discordError);
      }

      // Excluir rascunho após envio bem-sucedido
      if (hasDraft) {
        deleteDraft();
      }

      form.reset({
        itens: [defaultItem],
        centroCusto: undefined,
        justificativa: "",
      });
      queryClient.invalidateQueries({ queryKey: ["my-materiais"] });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const values = form.getValues();
    saveDraft(values);
  };

  const handleDiscardDraft = () => {
    deleteDraft();
    form.reset({
      itens: [defaultItem],
      centroCusto: undefined,
      justificativa: "",
    });
    toast.info("Rascunho descartado");
  };

  const handleAddItem = () => {
    append(defaultItem);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Solicitação de Material
        </CardTitle>
        <CardDescription>
          Adicione os materiais que você precisa solicitar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasDraft && (
          <Alert className="mb-4 border-primary/50 bg-primary/10">
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Você tem um rascunho salvo. Os dados foram carregados automaticamente.</span>
              <Button variant="ghost" size="sm" onClick={handleDiscardDraft} className="ml-2">
                <Trash2 className="w-4 h-4 mr-1" />
                Descartar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção de Itens */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Itens da Solicitação</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <MaterialItemRow
                    key={field.id}
                    index={index}
                    control={form.control}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </div>

              {form.formState.errors.itens?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.itens.root.message}</p>
              )}

              {/* Valor Total */}
              <div className="flex justify-end">
                <div className="bg-muted px-4 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground">Valor Total: </span>
                  <span className="text-lg font-semibold text-foreground">
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Campos Gerais */}
            <FormField
              control={form.control}
              name="centroCusto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Produto/IA/Dados">Produto/IA/Dados</SelectItem>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operação">Operação</SelectItem>
                      <SelectItem value="Educação/CS">Educação/CS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explique o motivo da solicitação" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Rascunho"}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
