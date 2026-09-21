import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Send, Save, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AnexosManager, Anexo } from "./AnexosManager";
import { useQueryClient } from "@tanstack/react-query";
import { useDrafts } from "@/hooks/useDrafts";
import { useDuplicate } from "@/contexts/DuplicateContext";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  data: z.string().min(1, "Data é obrigatória"),
  motivo: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres").max(500),
  valor: z.string().min(1, "Valor é obrigatório"),
  centroCusto: z.enum(["Vendas", "Marketing", "Produto", "Parceria", "Operação"], {
    required_error: "Centro de custo é obrigatório",
  }),
  tipoChavePix: z.enum(["CPF", "CNPJ", "Email", "Telefone", "Aleatória"], {
    required_error: "Tipo de chave PIX é obrigatório",
  }),
  chavePix: z.string().min(1, "Chave PIX é obrigatória").max(100),
});

type FormValues = z.infer<typeof formSchema>;

export const ReembolsoForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([{ id: crypto.randomUUID(), descricao: '', file: null }]);
  const [anexosError, setAnexosError] = useState<string>('');
  
  const { draft, saveDraft, isSaving, deleteDraft, hasDraft } = useDrafts('reembolso');
  const { duplicateData, clearDuplicate } = useDuplicate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      data: "",
      motivo: "",
      valor: "",
      centroCusto: "Vendas",
      tipoChavePix: "CPF",
      chavePix: "",
    },
  });

  // Carregar dados de duplicação (prioridade sobre rascunho)
  useEffect(() => {
    if (duplicateData?.type === 'reembolso' && duplicateData.data) {
      form.reset(duplicateData.data as FormValues);
      clearDuplicate();
      toast.info("Formulário preenchido com dados da solicitação anterior");
    }
  }, [duplicateData, clearDuplicate, form]);

  // Carregar rascunho
  useEffect(() => {
    if (draft?.data && !duplicateData) {
      form.reset(draft.data as FormValues);
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
      
      const hasContent = Object.values(values).some(v => 
        v !== "" && v !== undefined && v !== null
      );
      
      if (hasContent) {
        // Salvar silenciosamente (sem toast)
        supabase
          .from("drafts")
          .upsert({
            user_id: currentUser.id,
            type: 'reembolso',
            data: values,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,type' })
          .then(() => {
            console.log('Rascunho reembolso auto-salvo');
          });
      }
    };
  }, []);

  const validateAnexos = (): boolean => {
    const validAnexos = anexos.filter(a => a.descricao.trim() && a.file);
    
    if (validAnexos.length === 0) {
      setAnexosError("Adicione pelo menos um anexo com descrição e arquivo");
      return false;
    }

    const descricoes = validAnexos.map(a => a.descricao.trim().toLowerCase());
    const uniqueDescricoes = new Set(descricoes);
    if (descricoes.length !== uniqueDescricoes.size) {
      setAnexosError("Cada anexo deve ter uma descrição única");
      return false;
    }

    for (const anexo of anexos) {
      if (anexo.descricao.trim() && !anexo.file) {
        setAnexosError("Todos os anexos com descrição devem ter um arquivo");
        return false;
      }
      if (!anexo.descricao.trim() && anexo.file) {
        setAnexosError("Todos os arquivos devem ter uma descrição");
        return false;
      }
    }

    setAnexosError('');
    return true;
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para enviar uma solicitação", {
        action: {
          label: "Fazer Login",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }

    if (!validateAnexos()) {
      return;
    }

    setUploading(true);
    try {
      const { data: reembolsoData, error: insertError } = await supabase
        .from('reembolsos')
        .insert({
          user_id: user.id,
          nome: data.nome,
          data: data.data,
          motivo: data.motivo,
          valor: parseFloat(data.valor.replace(',', '.')),
          centro_custo: data.centroCusto,
          tipo_chave_pix: data.tipoChavePix,
          chave_pix: data.chavePix,
          status: 'pendente',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      const validAnexos = anexos.filter(a => a.descricao.trim() && a.file);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      for (let i = 0; i < validAnexos.length; i++) {
        const anexo = validAnexos[i];
        const file = anexo.file!;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${user.id}/${year}/${month}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('reembolsos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('reembolsos')
          .getPublicUrl(filePath);

        const { error: anexoError } = await supabase
          .from('reembolso_anexos')
          .insert({
            reembolso_id: reembolsoData.id,
            descricao: anexo.descricao.trim(),
            arquivo_url: urlData.publicUrl,
            ordem: i,
          });

        if (anexoError) throw anexoError;
      }

      toast.success("Solicitação enviada com sucesso!", {
        description: "Sua solicitação de reembolso foi registrada e está em análise.",
      });

      try {
        await supabase.functions.invoke('discord-notify', {
          body: {
            type: 'reembolso',
            data: {
              nome: data.nome,
              valor: data.valor,
              centroCusto: data.centroCusto,
              motivo: data.motivo,
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
      
      form.reset();
      setAnexos([{ id: crypto.randomUUID(), descricao: '', file: null }]);
      queryClient.invalidateQueries({ queryKey: ["my-reembolsos"] });
      queryClient.invalidateQueries({ queryKey: ["reembolsos"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar solicitação");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = () => {
    const values = form.getValues();
    saveDraft(values);
  };

  const handleDiscardDraft = () => {
    deleteDraft();
    form.reset({
      nome: "",
      data: "",
      motivo: "",
      valor: "",
      centroCusto: "Vendas",
      tipoChavePix: "CPF",
      chavePix: "",
    });
    toast.info("Rascunho descartado");
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Solicitação de Reembolso</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para solicitar reembolso de despesas.
          <br />
          <span className="text-neon-green text-sm font-medium">
            💰 Pagamento previsto para: dia 10 do mês seguinte à solicitação
          </span>
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
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Despesa</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormDescription>
                      Valor total de todos os comprovantes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Produto">Produto</SelectItem>
                      <SelectItem value="Parceria">Parceria</SelectItem>
                      <SelectItem value="Operação">Operação</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoChavePix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Chave PIX</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CPF">CPF</SelectItem>
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Telefone">Telefone</SelectItem>
                        <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chavePix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite sua chave PIX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo/Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o motivo do reembolso e detalhes da despesa"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Seja específico sobre o motivo e contexto da despesa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-subtle pt-6">
              <AnexosManager
                anexos={anexos}
                onChange={setAnexos}
                error={anexosError}
              />
            </div>

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
              <Button type="submit" className="flex-1 gap-2" disabled={uploading}>
                <Send className="w-4 h-4" />
                {uploading ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
