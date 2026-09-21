import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { GripVertical, Pencil, Plus, TestTube2, Upload } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { formatMoeda, useLancamentos } from "@/hooks/useLancamentos";
import { regraBate, type RegraMatch } from "@/lib/classificacao/normalize";
import { RegraFormDialog, defaultRegra, type RegraFormValues } from "@/components/finance/classificar/RegraFormDialog";
import { ImportarRegrasCsvDialog } from "@/components/finance/classificar/ImportarRegrasCsvDialog";

interface RegraRow extends RegraMatch {
  nome: string;
  vezes_aplicada: number;
  categoria_id: string | null;
  centro_custo_id: string | null;
  empresa_id_destino: string | null;
  tipo: "receita" | "despesa" | "transferencia" | null;
  categoria?: { nome: string } | null;
  centro?: { nome: string } | null;
}

const SELECT =
  "id, nome, prioridade, conta_id, tipo_conta, campo, operador, padrao, valor_min, valor_max, sinal, categoria_id, centro_custo_id, empresa_id_destino, tipo, ativo, vezes_aplicada, created_at, categoria:categorias_financeiras(nome), centro:centros_custo(nome)";

export default function RegrasClassificacao() {
  const queryClient = useQueryClient();
  const { selectedEmpresaData, isConsolidado } = useEmpresa();
  const empresaId = isConsolidado ? null : selectedEmpresaData?.id ?? null;

  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [formOpen, setFormOpen] = useState(false);
  const [formInicial, setFormInicial] = useState<Partial<RegraFormValues>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [testar, setTestar] = useState<RegraRow | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);

  const { data: regras = [], isLoading } = useQuery({
    queryKey: ["regras-classificacao"],
    queryFn: async (): Promise<RegraRow[]> => {
      const { data, error } = await supabase
        .from("regras_classificacao")
        .select(SELECT)
        .order("prioridade", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RegraRow[];
    },
  });

  const { data: lancamentosMes = [] } = useLancamentos({ empresaId, mes });

  const alternarAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("regras_classificacao").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regras-classificacao"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const reordenar = useMutation({
    mutationFn: async (ordenadas: RegraRow[]) => {
      for (let i = 0; i < ordenadas.length; i++) {
        const { error } = await supabase
          .from("regras_classificacao")
          .update({ prioridade: (i + 1) * 10 })
          .eq("id", ordenadas[i].id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Prioridades atualizadas");
      queryClient.invalidateQueries({ queryKey: ["regras-classificacao"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const largar = (destinoId: string) => {
    if (!arrastando || arrastando === destinoId) return;
    const origemIdx = regras.findIndex((r) => r.id === arrastando);
    const destinoIdx = regras.findIndex((r) => r.id === destinoId);
    if (origemIdx < 0 || destinoIdx < 0) return;
    const copia = [...regras];
    const [movida] = copia.splice(origemIdx, 1);
    copia.splice(destinoIdx, 0, movida);
    setArrastando(null);
    reordenar.mutate(copia);
  };

  const apanhados = testar
    ? lancamentosMes.filter((l) =>
        regraBate(testar, {
          empresa_id: l.empresa_id,
          conta_id: l.conta_id,
          tipo_conta: (l.conta?.tipo ?? null) as RegraMatch["tipo_conta"],
          contraparte: l.contraparte,
          descricao: l.descricao,
          valor_original: l.valor_original,
        }),
      )
    : [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Regras de classificação</h1>
          <p className="text-sm text-muted-foreground">
            As regras são testadas de cima para baixo; a primeira que bater é aplicada.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Importar regras de CSV
          </Button>
          <Button onClick={() => { setFormInicial({ ...defaultRegra }); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova regra
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Mês usado no teste de regra</Label>
          <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-40" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-16">Prior.</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead className="text-right">Aplicada</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
              )}
              {!isLoading && regras.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Ainda não há regras. Importe o CSV ou crie a primeira.
                </TableCell></TableRow>
              )}
              {regras.map((r) => (
                <TableRow
                  key={r.id}
                  draggable
                  onDragStart={() => setArrastando(r.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => largar(r.id)}
                  className={arrastando === r.id ? "opacity-50" : undefined}
                >
                  <TableCell className="cursor-grab text-muted-foreground"><GripVertical className="w-4 h-4" /></TableCell>
                  <TableCell className="text-xs">{r.prioridade}</TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate">{r.nome}</TableCell>
                  <TableCell className="text-xs">
                    <span className="text-muted-foreground">{r.campo} {r.operador}</span>{" "}
                    <span className="font-mono">{r.padrao}</span>
                    {r.sinal !== "ambos" && <Badge variant="outline" className="ml-2">{r.sinal}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{r.categoria?.nome ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.centro?.nome ?? "—"}</TableCell>
                  <TableCell className="text-xs text-right">{r.vezes_aplicada ?? 0}×</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.ativo}
                      onCheckedChange={(v) => alternarAtivo.mutate({ id: r.id, ativo: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" title="Testar" onClick={() => setTestar(r)}>
                        <TestTube2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => {
                          setFormInicial({
                            id: r.id,
                            nome: r.nome,
                            prioridade: r.prioridade,
                            campo: r.campo,
                            operador: r.operador,
                            padrao: r.padrao,
                            sinal: r.sinal,
                            categoria_id: r.categoria_id ?? null,
                            centro_custo_id: r.centro_custo_id ?? null,
                            empresa_id_destino: r.empresa_id_destino ?? null,
                            tipo: r.tipo ?? null,
                            ativo: r.ativo,
                          });
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!testar} onOpenChange={(open) => !open && setTestar(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teste da regra</DialogTitle>
            <DialogDescription>
              Lançamentos de {mes} que esta regra apanharia: {apanhados.length}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            {apanhados.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 border-b border-border py-1.5">
                <span className="text-xs text-muted-foreground w-24">{l.data_caixa}</span>
                <span className="flex-1 truncate text-xs">{l.contraparte || l.descricao}</span>
                <span className="text-xs">{formatMoeda(l.valor_original, l.moeda_original)}</span>
              </div>
            ))}
            {apanhados.length === 0 && (
              <p className="text-muted-foreground py-4">Nenhum lançamento deste mês corresponde à regra.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RegraFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={formInicial}
        empresaIdAtual={empresaId}
        mes={mes}
      />
      <ImportarRegrasCsvDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
