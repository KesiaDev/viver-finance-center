import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, AlertCircle, Save, FileText, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnexosManager, Anexo, getAnexoDescricaoFinal } from "./AnexosManager";
import { useDrafts } from "@/hooks/useDrafts";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { MonthPicker } from "@/components/ui/month-picker";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  cnpj: z.string().min(14, "CNPJ inválido").max(18),
  tipoChavePix: z.enum(["CPF", "CNPJ", "Email", "Telefone", "Aleatória"], {
    required_error: "Tipo de chave PIX é obrigatório",
  }),
  chavePix: z.string().min(5, "Chave PIX é obrigatória"),
  periodoReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Selecione um período válido"),
  mesPagamento: z.string().regex(/^\d{4}-\d{2}$/, "Selecione um mês válido"),
  valor: z.string().min(1, "Valor é obrigatório"),
  observacoes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const NotaFiscalForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([{ id: crypto.randomUUID(), descricao: '', file: null }]);
  const [anexosError, setAnexosError] = useState<string | undefined>();

  const { draft, saveDraft, isSaving, deleteDraft, hasDraft } = useDrafts('nota_fiscal');
  const { duplicateData, clearDuplicate } = useDuplicate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      tipoChavePix: "CNPJ",
      chavePix: "",
      periodoReferencia: "",
      mesPagamento: "",
      valor: "",
      observacoes: "",
    },
  });

  // Carregar dados de duplicação (prioridade sobre rascunho)
  useEffect(() => {
    if (duplicateData?.type === 'nota_fiscal' && duplicateData.data) {
      form.reset(duplicateData.data as FormValues);
      clearDuplicate();
      toast.info("Formulário preenchido com dados da nota anterior");
    }
  }, [duplicateData, clearDuplicate, form]);

  // Carregar rascunho
  useEffect(() => {
    if (draft?.data && !duplicateData) {
      form.reset(draft.data as FormValues);
    }
  }, [draft, duplicateData, form]);

  // Refs para acessar valores atualizados no cleanup
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

  // Auto-save ao desmontar (trocar de aba/tela)
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
            type: 'nota_fiscal',
            data: values,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,type' })
          .then(() => {
            console.log('Rascunho nota_fiscal auto-salvo');
          });
      }
    };
  }, []);

  const validateAnexos = (): boolean => {
    const anexosPreenchidos = anexos.filter(a => {
      const descricaoFinal = getAnexoDescricaoFinal(a);
      return descricaoFinal.trim() || a.file;
    });
    
    if (anexosPreenchidos.length === 0) {
      setAnexosError("Adicione pelo menos um anexo com descrição e arquivo");
      return false;
    }
    
    const anexosIncompletos = anexosPreenchidos.filter(a => {
      const descricaoFinal = getAnexoDescricaoFinal(a);
      return !descricaoFinal.trim() || !a.file;
    });
    
    if (anexosIncompletos.length > 0) {
      setAnexosError("Cada anexo precisa ter descrição e arquivo");
      return false;
    }
    
    setAnexosError(undefined);
    return true;
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para enviar uma nota fiscal", {
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
      const { data: notaFiscal, error: insertError } = await supabase
        .from('notas_fiscais')
        .insert({
          user_id: user.id,
          nome: data.nome,
          cnpj: data.cnpj,
          periodo_referencia: data.periodoReferencia,
          mes_pagamento: data.mesPagamento,
          valor: parseFloat(data.valor.replace(',', '.')),
          nota_url: '',
          tipo_chave_pix: data.tipoChavePix,
          chave_pix: data.chavePix,
          status: 'pendente',
          descricao: data.observacoes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const validAnexos = anexos.filter(a => {
        const descricaoFinal = getAnexoDescricaoFinal(a);
        return descricaoFinal.trim() && a.file;
      });
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      let firstUrl = '';

      for (let i = 0; i < validAnexos.length; i++) {
        const anexo = validAnexos[i];
        const file = anexo.file!;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${user.id}/${year}/${month}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('notas-fiscais')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('notas-fiscais')
          .getPublicUrl(filePath);

        if (i === 0) {
          firstUrl = urlData.publicUrl;
        }

        const descricaoFinal = getAnexoDescricaoFinal(anexo);
        const { error: anexoError } = await supabase
          .from('nota_fiscal_anexos')
          .insert({
            nota_fiscal_id: notaFiscal.id,
            descricao: descricaoFinal,
            arquivo_url: urlData.publicUrl,
            ordem: i,
          });

        if (anexoError) throw anexoError;
      }

      if (firstUrl) {
        await supabase
          .from('notas_fiscais')
          .update({ nota_url: firstUrl })
          .eq('id', notaFiscal.id);
      }

      toast.success("Nota fiscal enviada com sucesso!", {
        description: "Sua nota fiscal foi registrada e será processada em breve.",
      });

      try {
        await supabase.functions.invoke('discord-notify', {
          body: {
            type: 'nota_fiscal',
            data: {
              nome: data.nome,
              valor: data.valor,
              cnpj: data.cnpj,
              periodoReferencia: data.periodoReferencia,
              mesPagamento: data.mesPagamento,
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
      queryClient.invalidateQueries({ queryKey: ["my-notas-fiscais"] });
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar nota fiscal");
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
      cnpj: "",
      tipoChavePix: "CNPJ",
      chavePix: "",
      periodoReferencia: "",
      mesPagamento: "",
      valor: "",
      observacoes: "",
    });
    toast.info("Rascunho descartado");
  };

  return (
    <Card className="shadow-card max-w-3xl">
      <CardHeader>
        <CardTitle>Envio de Nota Fiscal</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para enviar sua nota fiscal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Prazo Importante</AlertTitle>
          <AlertDescription>
            Notas fiscais devem ser enviadas até o dia 02 de cada mês. Quem não enviar até essa data receberá somente no dia 30.
          </AlertDescription>
        </Alert>

        {hasDraft && (
          <Alert className="border-primary/50 bg-primary/10">
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
                  <FormLabel>Nome/Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo ou razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

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
                        <SelectItem value="Email">E-mail</SelectItem>
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
                      <Input placeholder="Informe sua chave PIX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <strong>Importante:</strong> A conta bancária vinculada à chave PIX deve estar no nome do CNPJ informado acima, 
                independentemente do tipo de chave escolhida (e-mail, aleatória, telefone, etc.).
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodoReferencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de Referência</FormLabel>
                    <FormControl>
                      <MonthPicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione o período"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mesPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Pagamento</FormLabel>
                    <FormControl>
                      <MonthPicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione o mês"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Nota (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais (opcional)"
                      className="min-h-[80px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AnexosManager
              anexos={anexos}
              onChange={setAnexos}
              error={anexosError}
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
              <Button type="submit" className="flex-1 gap-2" disabled={uploading}>
                <Send className="w-4 h-4" />
                {uploading ? "Enviando..." : "Enviar Nota Fiscal"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
