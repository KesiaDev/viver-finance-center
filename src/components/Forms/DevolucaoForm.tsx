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
  nomeCliente: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  valor: z.string().min(1, "Valor é obrigatório"),
  motivo: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres").max(500),
  numeroNota: z.string().min(1, "Link da venda Hubla é obrigatório").url("Por favor, insira um link válido (deve começar com http:// ou https://)"),
  tipoChavePix: z.enum(["CPF", "CNPJ", "Email", "Telefone", "Aleatória"], {
    required_error: "Tipo de chave PIX é obrigatório",
  }),
  chavePix: z.string().min(1, "Chave PIX é obrigatória").max(100),
});

type FormValues = z.infer<typeof formSchema>;

export const DevolucaoForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([{ id: crypto.randomUUID(), descricao: '', file: null }]);
  const [anexosError, setAnexosError] = useState<string>('');

  const { draft, saveDraft, isSaving, deleteDraft, hasDraft } = useDrafts('devolucao');
  const { duplicateData, clearDuplicate } = useDuplicate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCliente: "",
      valor: "",
      motivo: "",
      numeroNota: "",
      tipoChavePix: "CPF",
      chavePix: "",
    },
  });

  // Carregar dados de duplicação (prioridade sobre rascunho)
  useEffect(() => {
    if (duplicateData?.type === 'devolucao' && duplicateData.data) {
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
            type: 'devolucao',
            data: values,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,type' })
          .then(() => {
            console.log('Rascunho devolução auto-salvo');
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
      // Buscar nome do usuário do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const responsavelNome = profileData?.nome_completo || user.email || 'Usuário';

      const { data: devolucaoData, error: insertError } = await supabase
        .from('devolucoes')
        .insert({
          user_id: user.id,
          nome_cliente: data.nomeCliente,
          valor: parseFloat(data.valor.replace(',', '.')),
          motivo: data.motivo,
          link_venda_hubla: data.numeroNota,
          responsavel: responsavelNome,
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
          .from('devolucoes')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('devolucoes')
          .getPublicUrl(filePath);

        const { error: anexoError } = await supabase
          .from('devolucao_anexos')
          .insert({
            devolucao_id: devolucaoData.id,
            descricao: anexo.descricao.trim(),
            arquivo_url: urlData.publicUrl,
            ordem: i,
          });

        if (anexoError) throw anexoError;
      }

      toast.success("Solicitação enviada com sucesso!", {
        description: "A devolução ao cliente foi registrada e aguarda validação da diretoria.",
      });

      try {
        await supabase.functions.invoke('discord-notify', {
          body: {
            type: 'devolucao',
            data: {
              nomeCliente: data.nomeCliente,
              valor: data.valor,
              responsavel: responsavelNome,
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
      queryClient.invalidateQueries({ queryKey: ["my-devolucoes"] });
      queryClient.invalidateQueries({ queryKey: ["devolucoes"] });
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
      nomeCliente: "",
      valor: "",
      motivo: "",
      numeroNota: "",
      tipoChavePix: "CPF",
      chavePix: "",
    });
    toast.info("Rascunho descartado");
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Devolução ao Cliente</CardTitle>
        <CardDescription>
          Registre devoluções e reembolsos para clientes.
          <br />
          <span className="text-neon-green text-sm font-medium">
            ⚡ Pagamento previsto para: 5 dias úteis após validação
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
              name="nomeCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Devolução (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroNota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link venda Hubla</FormLabel>
                    <FormControl>
                      <Input placeholder="https://go.hubla.com/exemplo-venda" {...field} />
                    </FormControl>
                    <FormDescription>
                      Cole aqui o link completo da venda na plataforma Hubla
                    </FormDescription>
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
                  <FormLabel>Motivo da Devolução</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente o motivo da devolução"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Justificativa completa é necessária para validação da diretoria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <div className="border-t border-subtle pt-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Dados para Devolução PIX</h3>
              
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
                      <FormDescription>
                        Tipo de chave PIX do cliente para receber a devolução
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chavePix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a chave PIX do cliente" {...field} />
                      </FormControl>
                      <FormDescription>
                        Chave PIX para efetuar a devolução ao cliente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
