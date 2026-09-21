import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoriasFinanceiras, useCentrosCusto } from "@/hooks/useFinanceCatalogos";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { formatMoeda, type LancamentoRow } from "@/hooks/useLancamentos";

const VAZIO = "__nenhum__";

interface Parte {
  percentual: string;
  valor: string;
  categoria_id: string | null;
  centro_custo_id: string | null;
  empresa_id: string;
}

interface Props {
  lancamento: LancamentoRow | null;
  onOpenChange: (open: boolean) => void;
}

export function DividirLancamentoDialog({ lancamento, onOpenChange }: Props) {
  const { empresas } = useEmpresa();
  const { data: categorias = [] } = useCategoriasFinanceiras();
  const { data: centros = [] } = useCentrosCusto();
  const queryClient = useQueryClient();
  const [modo, setModo] = useState<"percentual" | "valor">("percentual");
  const [partes, setPartes] = useState<Parte[]>([]);

  const total = lancamento?.valor_original ?? 0;

  useEffect(() => {
    if (lancamento) {
      const base: Parte = {
        percentual: "50",
        valor: (total / 2).toFixed(2),
        categoria_id: lancamento.categoria_id,
        centro_custo_id: lancamento.centro_custo_id,
        empresa_id: lancamento.empresa_id,
      };
      setPartes([base, { ...base }]);
    }
  }, [lancamento, total]);

  const valores = useMemo(
    () =>
      partes.map((p) =>
        modo === "percentual"
          ? Number(((total * (Number(p.percentual) || 0)) / 100).toFixed(2))
          : Number(Number(p.valor.replace(",", ".")) || 0),
      ),
    [partes, modo, total],
  );

  const soma = valores.reduce((a, b) => a + b, 0);
  const diferenca = Number((total - soma).toFixed(2));
  const fecha = Math.abs(diferenca) < 0.01;

  const dividir = useMutation({
    mutationFn: async () => {
      if (!lancamento) return;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      const novos = partes.map((p, i) => ({
        empresa_id: p.empresa_id,
        conta_id: lancamento.conta_id,
        data_caixa: lancamento.data_caixa,
        data_competencia: lancamento.data_competencia,
        descricao: `${lancamento.descricao} (divisão ${i + 1}/${partes.length})`,
        contraparte: lancamento.contraparte,
        valor_original: valores[i],
        moeda_original: lancamento.moeda_original,
        cotacao: lancamento.cotacao,
        valor_brl:
          lancamento.valor_brl != null && total !== 0
            ? Number(((lancamento.valor_brl * valores[i]) / total).toFixed(2))
            : null,
        categoria_id: p.categoria_id,
        centro_custo_id: p.centro_custo_id,
        tipo: lancamento.tipo,
        status: lancamento.status,
        status_classificacao: p.categoria_id ? "manual" : "pendente",
        source: lancamento.source,
        observacao: `Dividido a partir do lançamento ${lancamento.id}`,
        created_by: uid,
      }));

      const { error: insErr } = await supabase.from("lancamentos").insert(novos);
      if (insErr) throw insErr;

      const { error: delErr } = await supabase.from("lancamentos").delete().eq("id", lancamento.id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      toast.success("Lançamento dividido");
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!lancamento} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Dividir lançamento</DialogTitle>
          <DialogDescription>
            {lancamento?.contraparte || lancamento?.descricao} · total {formatMoeda(total, lancamento?.moeda_original)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Label className="text-sm">Dividir por</Label>
          <Select value={modo} onValueChange={(v) => setModo(v as "percentual" | "valor")}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentual">Percentagem</SelectItem>
              <SelectItem value="valor">Valor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {partes.map((parte, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end border border-subtle rounded-md p-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">{modo === "percentual" ? "%" : "Valor"}</Label>
                <Input
                  value={modo === "percentual" ? parte.percentual : parte.valor}
                  onChange={(e) => {
                    const copia = [...partes];
                    copia[i] = modo === "percentual"
                      ? { ...parte, percentual: e.target.value }
                      : { ...parte, valor: e.target.value };
                    setPartes(copia);
                  }}
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={parte.categoria_id ?? VAZIO}
                  onValueChange={(v) => {
                    const copia = [...partes];
                    copia[i] = { ...parte, categoria_id: v === VAZIO ? null : v };
                    setPartes(copia);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VAZIO}>Sem categoria</SelectItem>
                    {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Centro de custo</Label>
                <Select
                  value={parte.centro_custo_id ?? VAZIO}
                  onValueChange={(v) => {
                    const copia = [...partes];
                    copia[i] = { ...parte, centro_custo_id: v === VAZIO ? null : v };
                    setPartes(copia);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VAZIO}>Sem centro</SelectItem>
                    {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Empresa</Label>
                <Select
                  value={parte.empresa_id}
                  onValueChange={(v) => {
                    const copia = [...partes];
                    copia[i] = { ...parte, empresa_id: v };
                    setPartes(copia);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={partes.length <= 2}
                  onClick={() => setPartes(partes.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="col-span-12 text-xs text-muted-foreground">
                = {formatMoeda(valores[i], lancamento?.moeda_original)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPartes([
                ...partes,
                { percentual: "0", valor: "0", categoria_id: null, centro_custo_id: null, empresa_id: lancamento?.empresa_id ?? "" },
              ])
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar parte
          </Button>
          <span className={fecha ? "text-muted-foreground" : "text-destructive"}>
            Soma {formatMoeda(soma, lancamento?.moeda_original)} · diferença {formatMoeda(diferenca, lancamento?.moeda_original)}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => dividir.mutate()} disabled={!fecha || dividir.isPending}>
            {dividir.isPending ? "A dividir…" : "Dividir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
