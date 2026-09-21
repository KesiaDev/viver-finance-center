import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoriasFinanceiras, useCentrosCusto, useContasFinanceiras } from "@/hooks/useFinanceCatalogos";
import { useEmpresa } from "@/contexts/EmpresaContext";

const VAZIO = "__nenhum__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaIdPadrao?: string | null;
}

export function NovoLancamentoDialog({ open, onOpenChange, empresaIdPadrao }: Props) {
  const { empresas } = useEmpresa();
  const { data: contas = [] } = useContasFinanceiras();
  const { data: categorias = [] } = useCategoriasFinanceiras();
  const { data: centros = [] } = useCentrosCusto();
  const queryClient = useQueryClient();

  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    empresa_id: empresaIdPadrao ?? "",
    conta_id: "",
    data_caixa: hoje,
    data_competencia: hoje,
    descricao: "",
    contraparte: "",
    valor_original: "",
    moeda_original: "BRL",
    cotacao: "",
    valor_brl: "",
    categoria_id: null as string | null,
    centro_custo_id: null as string | null,
    produto: "",
    tipo: null as string | null,
    pago_por_socio: "",
    status: "realizado",
    observacao: "",
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const valor = Number(form.valor_original.replace(",", "."));
      const cotacao = form.cotacao ? Number(form.cotacao.replace(",", ".")) : null;
      const valorBrl = form.valor_brl
        ? Number(form.valor_brl.replace(",", "."))
        : form.moeda_original === "BRL"
          ? valor
          : cotacao
            ? Number((valor * cotacao).toFixed(2))
            : null;

      const { error } = await supabase.from("lancamentos").insert({
        empresa_id: form.empresa_id || empresas[0]?.id,
        conta_id: form.conta_id || null,
        data_caixa: form.data_caixa || null,
        data_competencia: form.data_competencia || null,
        descricao: form.descricao,
        contraparte: form.contraparte || null,
        valor_original: valor,
        moeda_original: form.moeda_original,
        cotacao,
        valor_brl: valorBrl,
        categoria_id: form.categoria_id,
        centro_custo_id: form.centro_custo_id,
        produto: form.produto || null,
        tipo: form.tipo,
        pago_por_socio: form.pago_por_socio || null,
        status: form.status,
        status_classificacao: form.categoria_id ? "manual" : "pendente",
        source: "manual",
        observacao: form.observacao || null,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento criado");
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const contasEmpresa = contas.filter((c) => !form.empresa_id || c.empresa_id === form.empresa_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>
            Para ajustes manuais e contas sem extrato. Passa pelo motor de regras se ficar sem categoria.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={form.empresa_id} onValueChange={(v) => setForm({ ...form, empresa_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Select value={form.conta_id} onValueChange={(v) => setForm({ ...form, conta_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {contasEmpresa.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="previsto">Previsto</SelectItem>
                <SelectItem value="realizado">Realizado</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de caixa</Label>
            <Input type="date" value={form.data_caixa} onChange={(e) => setForm({ ...form, data_caixa: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Data de competência</Label>
            <Input type="date" value={form.data_competencia} onChange={(e) => setForm({ ...form, data_competencia: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Contraparte</Label>
            <Input value={form.contraparte} onChange={(e) => setForm({ ...form, contraparte: e.target.value })} />
          </div>

          <div className="col-span-3 space-y-2">
            <Label>Descrição</Label>
            <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Valor (negativo = saída)</Label>
            <Input value={form.valor_original} onChange={(e) => setForm({ ...form, valor_original: e.target.value })} placeholder="-1500,00" />
          </div>
          <div className="space-y-2">
            <Label>Moeda</Label>
            <Select value={form.moeda_original} onValueChange={(v) => setForm({ ...form, moeda_original: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cotação</Label>
            <Input value={form.cotacao} onChange={(e) => setForm({ ...form, cotacao: e.target.value })} placeholder="5,40" />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.categoria_id ?? VAZIO} onValueChange={(v) => setForm({ ...form, categoria_id: v === VAZIO ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Deixar em branco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Deixar para as regras</SelectItem>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Centro de custo</Label>
            <Select value={form.centro_custo_id ?? VAZIO} onValueChange={(v) => setForm({ ...form, centro_custo_id: v === VAZIO ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Sem centro</SelectItem>
                {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.tipo ?? VAZIO} onValueChange={(v) => setForm({ ...form, tipo: v === VAZIO ? null : v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={VAZIO}>Não definir</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Produto</Label>
            <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Pago por sócio</Label>
            <Input value={form.pago_por_socio} onChange={(e) => setForm({ ...form, pago_por_socio: e.target.value })} placeholder="Luciano / Alan" />
          </div>
          <div className="space-y-2">
            <Label>Valor em BRL (opcional)</Label>
            <Input value={form.valor_brl} onChange={(e) => setForm({ ...form, valor_brl: e.target.value })} />
          </div>

          <div className="col-span-3 space-y-2">
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => criar.mutate()}
            disabled={criar.isPending || !form.empresa_id || !form.valor_original || !form.descricao}
          >
            {criar.isPending ? "A gravar…" : "Criar lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
