import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Send, Upload, Wand2, Loader2, Save, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { useDrafts } from "@/hooks/useDrafts";

const formSchema = z.object({
  nome: z.string().min(3, "Razão Social deve ter pelo menos 3 caracteres"),
  nomeCompleto: z.string().min(3, "Nome Completo deve ter pelo menos 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  email: z.string().email("Email inválido"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  area: z.string().min(1, "Área é obrigatória"),
  funcao: z.string().min(1, "Função é obrigatória"),
  remuneracao: z.string().min(1, "Remuneração é obrigatória"),
  remuneracaoExtenso: z.string().optional(),
  variavel: z.string().optional(),
  dataInicioContrato: z.string().min(1, "Data de início é obrigatória"),
  tipoChavePix: z.enum(["CNPJ", "Email", "Telefone", "Aleatória"]).optional(),
  chavePix: z.string().optional(),
  escopoTrabalho: z.string().min(10, "Escopo deve ter pelo menos 10 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export const ContratoForm = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [cartaoCnpjFile, setCartaoCnpjFile] = useState<File | null>(null);
  const [documentoFotoFile, setDocumentoFotoFile] = useState<File | null>(null);
  const { draft, deleteDraft, hasDraft } = useDrafts('contrato');

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleExtractCnpjData = async () => {
    if (!cartaoCnpjFile) {
      toast.error("Selecione o arquivo do Cartão CNPJ primeiro.");
      return;
    }

    setExtracting(true);
    try {
      const base64 = await fileToBase64(cartaoCnpjFile);
      const { data, error } = await supabase.functions.invoke("extract-cnpj-data", {
        body: { fileBase64: base64, mimeType: cartaoCnpjFile.type },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.razao_social) form.setValue("nome", data.razao_social);
      if (data.cnpj) form.setValue("cnpj", data.cnpj);
      if (data.endereco) form.setValue("endereco", data.endereco);

      toast.success("Dados extraídos com sucesso! Revise antes de enviar.");
    } catch (error: any) {
      console.error("Extraction error:", error);
      toast.error("Erro ao extrair dados. Preencha manualmente.");
    } finally {
      setExtracting(false);
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "", nomeCompleto: "", cnpj: "", email: "", endereco: "",
      area: "", funcao: "", remuneracao: "", remuneracaoExtenso: "", variavel: "",
      dataInicioContrato: "", chavePix: "", escopoTrabalho: "",
    },
  });

  // Carregar rascunho
  useEffect(() => {
    if (draft?.data) {
      form.reset(draft.data as FormValues);
    }
  }, [draft, form]);

  // Refs para auto-save no cleanup
  const formValuesRef = useRef<FormValues>();
  const userRef = useRef(user);

  useEffect(() => {
    formValuesRef.current = form.getValues();
    userRef.current = user;
  });

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
      const hasContent = Object.values(values).some(v => v !== "" && v !== undefined && v !== null);
      if (hasContent) {
        supabase
          .from("drafts")
          .upsert({
            user_id: currentUser.id,
            type: 'contrato',
            data: values,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,type' })
          .then(() => console.log('Rascunho contrato auto-salvo'));
      }
    };
  }, []);

  const uploadFile = async (file: File, folder: string) => {
    const timestamp = Date.now();
    const filePath = `${user!.id}/${folder}/${timestamp}_${file.name}`;
    const { error } = await supabase.storage
      .from("contratos-docs")
      .upload(filePath, file);
    if (error) throw new Error(`Erro ao enviar ${folder}: ${error.message}`);
    const { data: urlData } = supabase.storage
      .from("contratos-docs")
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    if (!cartaoCnpjFile) {
      toast.error("O Cartão CNPJ é obrigatório.");
      return;
    }
    if (!documentoFotoFile) {
      toast.error("O Documento com foto é obrigatório.");
      return;
    }

    setSubmitting(true);

    try {
      const [cartaoCnpjUrl, documentoFotoUrl] = await Promise.all([
        uploadFile(cartaoCnpjFile, "cartao-cnpj"),
        uploadFile(documentoFotoFile, "documento-foto"),
      ]);

      const { error } = await supabase.from("solicitacoes_contrato").insert({
        user_id: user.id,
        nome: values.nome,
        nome_completo: values.nomeCompleto || null,
        cpf: null,
        cnpj: values.cnpj,
        email: values.email,
        endereco: values.endereco,
        area: values.area,
        funcao: values.funcao,
        remuneracao: parseFloat(values.remuneracao.replace(/[^\d.,]/g, "").replace(",", ".")),
        remuneracao_extenso: values.remuneracaoExtenso || null,
        variavel: values.variavel || null,
        data_inicio_contrato: values.dataInicioContrato,
        tipo_chave_pix: values.tipoChavePix || null,
        chave_pix: values.chavePix || null,
        escopo_trabalho: values.escopoTrabalho,
        cartao_cnpj_url: cartaoCnpjUrl,
        documento_foto_url: documentoFotoUrl,
      } as any);

      if (error) throw error;

      toast.success("Solicitação de contrato enviada com sucesso!");
      if (hasDraft) deleteDraft();
      form.reset();
      setCartaoCnpjFile(null);
      setDocumentoFotoFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-contratos"] });
    } catch (error: any) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-primary">Solicitação de Contrato PJ</CardTitle>
        <CardDescription>Preencha os dados do novo colaborador para gerar o contrato</CardDescription>
      </CardHeader>
      <CardContent>
        {hasDraft && (
          <Alert className="mb-4 border-primary/50 bg-primary/10">
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Você tem um rascunho salvo. Os dados foram carregados automaticamente.</span>
              <Button variant="ghost" size="sm" onClick={() => { deleteDraft(); form.reset({ nome: "", nomeCompleto: "", cnpj: "", email: "", endereco: "", area: "", funcao: "", remuneracao: "", remuneracaoExtenso: "", variavel: "", dataInicioContrato: "", chavePix: "", escopoTrabalho: "" }); toast.info("Rascunho descartado"); }} className="ml-2">
                <Trash2 className="w-4 h-4 mr-1" />
                Descartar
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-subtle pb-2">Documentos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Cartão CNPJ *
                  </Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setCartaoCnpjFile(e.target.files?.[0] || null)}
                  />
                  {cartaoCnpjFile && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Arquivo: {cartaoCnpjFile.name}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExtractCnpjData}
                        disabled={extracting}
                        className="text-xs"
                      >
                        {extracting ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Extraindo...</>
                        ) : (
                          <><Wand2 className="w-3 h-3 mr-1" /> Extrair dados com IA</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Documento com Foto *
                  </Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentoFotoFile(e.target.files?.[0] || null)}
                  />
                  {documentoFotoFile && (
                    <p className="text-xs text-muted-foreground">Arquivo: {documentoFotoFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dados do Novo Colaborador */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-subtle pb-2">Dados do Novo Colaborador</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl><Input placeholder="Razão social da empresa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nomeCompleto" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input placeholder="Nome completo do colaborador" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="endereco" render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl><Input placeholder="Rua, número, bairro, cidade, estado, CEP" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Dados Contratuais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-subtle pb-2">Dados Contratuais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="area" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <FormControl><Input placeholder="Ex: Tecnologia" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="funcao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função/Cargo</FormLabel>
                    <FormControl><Input placeholder="Ex: Desenvolvedor" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="remuneracao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remuneração (R$)</FormLabel>
                    <FormControl><Input placeholder="0,00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="variavel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remuneração Variável (opcional)</FormLabel>
                    <FormControl><Input placeholder="Descrição da parte variável" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="remuneracaoExtenso" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por Extenso (opcional)</FormLabel>
                  <FormControl><Input placeholder="Ex: cinco mil reais" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="dataInicioContrato" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Dados Bancários */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-subtle pb-2">Dados Bancários</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="tipoChavePix" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Chave PIX</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Telefone">Telefone</SelectItem>
                        <SelectItem value="Aleatória">Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="chavePix" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl><Input placeholder="Chave PIX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Escopo de Trabalho */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-subtle pb-2">Escopo de Trabalho</h3>
              <FormField control={form.control} name="escopoTrabalho" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição das Atividades e Entregas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente o escopo de trabalho, atividades, entregas e responsabilidades..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Button type="submit" disabled={submitting} className="w-full md:w-auto">
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
