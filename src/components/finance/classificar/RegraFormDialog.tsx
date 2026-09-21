import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoriasFinanceiras, useCentrosCusto } from "@/hooks/useFinanceCatalogos";
import { useEmpresa } from "@/contexts/EmpresaContext";

export interface RegraFormValues {
  id?: string;
  nome: string;
  prioridade: number;
  campo: "contraparte" | "descricao";
  operador: "igual" | "contem" | "comeca_com" | "regex";
  padrao: string;
  sinal: "entrada" | "saida" | "ambos";
  categoria_id: string | null;
  centro_custo_id: string | null;
  empresa_id_destino: string | null;
  tipo: "receita" | "despesa" | "transferencia" | null;
  ativo: boolean;
}

const VAZIO = "__nenhum__";

export const defaultRegra: RegraFormValues = {
  nome: "",
  prioridade: 100,
  campo: "contraparte",
  operador: "contem",
  padrao: "",
  sinal: "ambos",
  categoria_id: null,
  centro_custo_id: null,
  empresa_id_destino: null,
  tipo: null,
  ativo: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<RegraFormValues>;
  empresaIdAtual?: string | null;
  mes?: string;
}

export function RegraFormDialog({ open, onOpenChange, initial, empresaIdAtual, mes }: Props) {
  const [values, setValues] = useState<RegraFormValues>({ ...defaultRegra, ...initial });
  const [aplicarPendentes, setAplicarPendentes] = useState(true);
  const { empresas } = useEmpresa();
  const { data: categorias = [] } = useCategoriasFinanceiras();
  const { data: centros = [] } = useCentrosCusto();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setValues({ ...defaultRegra, ...initial });
  }, [open, initial]);

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: values.nome || values.padrao,
        prioridade: values.prioridade,
        campo: values.campo,
        operador: values.operador,
        padrao: values.padrao,
        sinal: values.sinal,
        categoria_id: values.categoria_id,
        centro_custo_id: values.centro_custo_id,
        empresa_id_destino: values.empresa_id_destino,
        tipo: values.tipo,
        ativo: values.ativo,
      };

      if (values.id) {
        const { error } = await supabase.from("regras_classificacao").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("regras_classificacao")
          .insert({ ...payload, created_by: userData.user?.id ?? null });
        if (error) throw error;
      }

      if (aplicarPendentes) {
        const { error } = await supabase.rpc("reclassificar_pendentes", {
          p_empresa_id: empresaIdAtual ?? null,
          p_mes: mes ? `${mes}-01` : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(values.id ? "Regra atualizada" : "Regra criada");
      queryClient.invalidateQueries({ queryKey: ["regras-classificacao"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{values.id ? "Editar regra" : "Nova regra de classificação"}</DialogTitle>
          <DialogDescription>
            A regra é aplicada automaticamente aos novos lançamentos, por ordem de prioridade.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Nome</Label>
            <Input value={values.nome} onChange={(e) => setValues({ ...values, nome: e.target.value })} placeholder="Ex.: Facebook Ads → Tráfego" />
          </div>

          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Input type="number" value={values.prioridade} onChange={(e) => setValues({ ...values, prioridade: Number(e.target.value) })} />
          </div>

          <div className="space-y-2">
            <Label>Campo</Label>
            <Select value={values.campo} onValueChange={(v) => setValues({ ...values, campo: v as RegraFormValues["campo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contraparte">Contraparte</SelectItem>
                <SelectItem value="descricao">Descrição</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Operador</Label>
            <Select value={values.operador} onValueChange={(v) => setValues({ ...values, operador: v as RegraFormValues["operador"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="igual">Igual a</SelectItem>
                <SelectItem value="contem">Contém</SelectItem>
                <SelectItem value="comeca_com">Começa com</SelectItem>
                <SelectItem value="regex">Expressão regular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sinal</Label>
            <Select value={values.sinal} onValueChange={(v) => setValues({ ...values, sinal: v as RegraFormValues["sinal"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ambos">Entradas e saídas</SelectItem>
                <SelectItem value="entrada">Só entradas</SelectItem>
                <SelectItem value="saida">Só saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Padrão</Label>
            <Input value={values.padrao} onChange={(e) => setValues({ ...values, padrao: e.target.value })} placeholder="FACEBK" />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={values.categoria_id ?? VAZIO} onValueChange={(v) => setValues({ ...values, categoria_id: v === VAZIO ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Sem categoria</SelectItem>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Centro de custo</Label>
            <Select value={values.centro_custo_id ?? VAZIO} onValueChange={(v) => setValues({ ...values, centro_custo_id: v === VAZIO ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Sem centro de custo</SelectItem>
                {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={values.tipo ?? VAZIO} onValueChange={(v) => setValues({ ...values, tipo: v === VAZIO ? null : (v as RegraFormValues["tipo"]) })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Não definir</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Empresa de destino</Label>
            <Select value={values.empresa_id_destino ?? VAZIO} onValueChange={(v) => setValues({ ...values, empresa_id_destino: v === VAZIO ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Manter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Manter a empresa do lançamento</SelectItem>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox id="aplicar" checked={aplicarPendentes} onCheckedChange={(v) => setAplicarPendentes(Boolean(v))} />
          <Label htmlFor="aplicar" className="text-sm font-normal">
            Aplicar já aos restantes lançamentos pendentes
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => salvar.mutate()} disabled={!values.padrao || salvar.isPending}>
            {salvar.isPending ? "A gravar…" : "Gravar regra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
