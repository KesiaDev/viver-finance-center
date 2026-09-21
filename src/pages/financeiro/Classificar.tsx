import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Scissors, Wand2 } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useCategoriasFinanceiras, useCentrosCusto, useContasFinanceiras } from "@/hooks/useFinanceCatalogos";
import { formatMoeda, useLancamentos, type LancamentoRow } from "@/hooks/useLancamentos";
import { normalizarContraparte } from "@/lib/classificacao/normalize";
import { DividirLancamentoDialog } from "@/components/finance/classificar/DividirLancamentoDialog";
import { NovoLancamentoDialog } from "@/components/finance/classificar/NovoLancamentoDialog";
import { RegraFormDialog, defaultRegra, type RegraFormValues } from "@/components/finance/classificar/RegraFormDialog";

const TODOS = "__todos__";
const VAZIO = "__nenhum__";

const ESTADO_LABEL: Record<string, string> = {
  pendente: "Pendente",
  regra: "Por regra",
  manual: "Manual",
};

export default function Classificar() {
  const { empresas, selectedEmpresaData, isConsolidado } = useEmpresa();
  const { data: contas = [] } = useContasFinanceiras();
  const { data: categorias = [] } = useCategoriasFinanceiras();
  const { data: centros = [] } = useCentrosCusto();
  const queryClient = useQueryClient();

  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [contaId, setContaId] = useState<string>(TODOS);
  const [estado, setEstado] = useState<string>(TODOS);
  const [dividir, setDividir] = useState<LancamentoRow | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [regraOpen, setRegraOpen] = useState(false);
  const [regraInicial, setRegraInicial] = useState<Partial<RegraFormValues>>({});

  const empresaId = isConsolidado ? null : selectedEmpresaData?.id ?? null;

  const { data: lancamentos = [], isLoading } = useLancamentos({
    empresaId,
    mes,
    contaId: contaId === TODOS ? null : contaId,
    statusClassificacao: estado === TODOS ? null : estado,
  });

  const contagens = useMemo(() => {
    const total = lancamentos.length;
    const porRegra = lancamentos.filter((l) => l.status_classificacao === "regra").length;
    const manuais = lancamentos.filter((l) => l.status_classificacao === "manual").length;
    const pendentes = lancamentos.filter((l) => l.status_classificacao === "pendente").length;
    const automatica = total > 0 ? Math.round((porRegra / total) * 100) : 0;
    return { total, porRegra, manuais, pendentes, automatica };
  }, [lancamentos]);

  const atualizar = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("lancamentos")
        .update({ ...patch, status_classificacao: "manual" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lancamentos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const reclassificar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("reclassificar_pendentes", {
        p_empresa_id: empresaId,
        p_mes: `${mes}-01`,
      });
      if (error) throw error;
      return data as unknown as { total: number; classificados: number }[];
    },
    onSuccess: (data) => {
      const r = Array.isArray(data) ? data[0] : undefined;
      toast.success(`${r?.classificados ?? 0} de ${r?.total ?? 0} pendentes classificados`);
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criarRegraDe = (l: LancamentoRow) => {
    const padrao = normalizarContraparte(l.contraparte || l.descricao);
    setRegraInicial({
      ...defaultRegra,
      nome: `${padrao} → ${l.categoria?.nome ?? "classificar"}`,
      campo: l.contraparte ? "contraparte" : "descricao",
      operador: l.conta?.tipo === "cartao" ? "contem" : "igual",
      padrao,
      sinal: l.valor_original < 0 ? "saida" : "entrada",
      categoria_id: l.categoria_id,
      centro_custo_id: l.centro_custo_id,
      tipo: l.tipo,
    });
    setRegraOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Classificar lançamentos</h1>
          <p className="text-sm text-muted-foreground">
            Cada movimento recebe categoria, centro de custo e empresa — por regra ou à mão.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reclassificar.mutate()} disabled={reclassificar.isPending}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reaplicar regras
          </Button>
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo lançamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Classificados por regra</p>
          <p className="text-2xl font-semibold">{contagens.porRegra}</p>
          <p className="text-xs text-muted-foreground">{contagens.automatica}% automático</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Classificados à mão</p>
          <p className="text-2xl font-semibold">{contagens.manuais}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-semibold">{contagens.pendentes}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground">Total do mês</p>
          <p className="text-2xl font-semibold">{contagens.total}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Mês</Label>
          <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Conta</Label>
          <Select value={contaId} onValueChange={setContaId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as contas</SelectItem>
              {contas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Estado</Label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="regra">Por regra</SelectItem>
              <SelectItem value="manual">Manuais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Contraparte</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Centro de custo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
              )}
              {!isLoading && lancamentos.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Sem lançamentos neste mês.
                </TableCell></TableRow>
              )}
              {lancamentos.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">{l.data_caixa ?? "—"}</TableCell>
                  <TableCell className="text-xs">{l.conta?.nome ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate">{l.contraparte ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate">{l.descricao}</TableCell>
                  <TableCell className="text-right whitespace-nowrap text-xs">
                    <div>{formatMoeda(l.valor_original, l.moeda_original)}</div>
                    {l.moeda_original !== "BRL" && (
                      <div className="text-muted-foreground">{formatMoeda(l.valor_brl)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={l.categoria_id ?? VAZIO}
                      onValueChange={(v) =>
                        atualizar.mutate({ id: l.id, patch: { categoria_id: v === VAZIO ? null : v } })
                      }
                    >
                      <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VAZIO}>Sem categoria</SelectItem>
                        {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={l.centro_custo_id ?? VAZIO}
                      onValueChange={(v) =>
                        atualizar.mutate({ id: l.id, patch: { centro_custo_id: v === VAZIO ? null : v } })
                      }
                    >
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VAZIO}>Sem centro</SelectItem>
                        {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={l.empresa_id}
                      onValueChange={(v) => atualizar.mutate({ id: l.id, patch: { empresa_id: v } })}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.status_classificacao === "pendente" ? "destructive" : "secondary"}>
                      {ESTADO_LABEL[l.status_classificacao] ?? l.status_classificacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" title="Dividir" onClick={() => setDividir(l)}>
                        <Scissors className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Criar regra a partir deste" onClick={() => criarRegraDe(l)}>
                        <Wand2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DividirLancamentoDialog lancamento={dividir} onOpenChange={(open) => !open && setDividir(null)} />
      <NovoLancamentoDialog open={novoOpen} onOpenChange={setNovoOpen} empresaIdPadrao={empresaId} />
      <RegraFormDialog
        open={regraOpen}
        onOpenChange={setRegraOpen}
        initial={regraInicial}
        empresaIdAtual={empresaId}
        mes={mes}
      />
    </div>
  );
}
