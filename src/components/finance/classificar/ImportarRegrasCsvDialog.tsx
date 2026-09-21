import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseCsvRegras, construirRegras, type ResultadoImportacao } from "@/lib/classificacao/csvRegras";
import { useCategoriasFinanceiras, useCentrosCusto } from "@/hooks/useFinanceCatalogos";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { normalizarTexto } from "@/lib/classificacao/normalize";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportarRegrasCsvDialog({ open, onOpenChange }: Props) {
  const { data: categorias = [] } = useCategoriasFinanceiras();
  const { data: centros = [] } = useCentrosCusto();
  const { empresas } = useEmpresa();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<ResultadoImportacao | null>(null);
  const [gravando, setGravando] = useState(false);

  const lerFicheiro = async (file: File) => {
    try {
      const texto = await file.text();
      const linhas = parseCsvRegras(texto);
      setPreview(construirRegras(linhas));
      toast.success(`${linhas.length} linhas lidas do ficheiro`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const idCategoria = (nome: string) =>
    categorias.find((c) => normalizarTexto(c.nome) === normalizarTexto(nome))?.id ?? null;
  const idCentro = (nome: string | null) =>
    nome ? centros.find((c) => normalizarTexto(c.nome) === normalizarTexto(nome))?.id ?? null : null;
  const idEmpresa = (slug: string | null) =>
    slug ? empresas.find((e) => e.slug === slug)?.id ?? null : null;

  const gravar = async () => {
    if (!preview) return;
    setGravando(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const rows = preview.regras.map((r, i) => ({
        nome: `${r.contraparte} → ${r.categoriaNome}`,
        prioridade: 100 + i,
        campo: "contraparte" as const,
        operador: r.operador,
        padrao: r.contraparte,
        sinal: "ambos" as const,
        categoria_id: idCategoria(r.categoriaNome),
        centro_custo_id: idCentro(r.centroCustoNome),
        empresa_id_destino: idEmpresa(r.empresaDestino),
        ativo: true,
        created_by: userData.user?.id ?? null,
      }));

      const semCategoria = rows.filter((r) => !r.categoria_id).length;
      const { error } = await supabase.from("regras_classificacao").insert(rows);
      if (error) throw error;

      toast.success(
        semCategoria > 0
          ? `${rows.length} regras criadas (${semCategoria} sem categoria correspondente)`
          : `${rows.length} regras criadas`,
      );
      queryClient.invalidateQueries({ queryKey: ["regras-classificacao"] });
      setPreview(null);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGravando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar regras de CSV</DialogTitle>
          <DialogDescription>
            Ficheiro com separador ponto e vírgula e as colunas origem; data; recebedor_ou_descricao; valor; o_que_e;
            centro_custo; categoria_usada_no_resultado.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void lerFicheiro(file);
          }}
        />

        {preview && (
          <Tabs defaultValue="criar" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="criar">Regras a criar ({preview.regras.length})</TabsTrigger>
              <TabsTrigger value="ambiguas">Ambíguas ({preview.ambiguas.length})</TabsTrigger>
              <TabsTrigger value="ignoradas">Ignoradas ({preview.ignoradas.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="criar" className="flex-1 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {preview.regras.map((r) => (
                  <div key={r.contraparte} className="flex items-center justify-between gap-3 border-b border-border py-1.5">
                    <span className="font-mono text-xs truncate">{r.contraparte}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{r.operador}</Badge>
                      <span>{r.categoriaNome}</span>
                      {r.centroCustoNome && <Badge variant="secondary">{r.centroCustoNome}</Badge>}
                      {r.empresaDestino && <Badge>{r.empresaDestino}</Badge>}
                      <span className="text-xs text-muted-foreground">{r.ocorrencias}×</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ambiguas" className="flex-1 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {preview.ambiguas.map((a) => (
                  <div key={a.contraparte} className="flex items-center justify-between gap-3 border-b border-border py-1.5">
                    <span className="font-mono text-xs truncate">{a.contraparte}</span>
                    <span className="text-muted-foreground shrink-0">
                      {a.categorias.join(" / ")} · {a.ocorrencias}×
                    </span>
                  </div>
                ))}
                {preview.ambiguas.length === 0 && (
                  <p className="text-muted-foreground py-4">Nenhuma contraparte ambígua.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ignoradas" className="flex-1 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {preview.ignoradas.map((ig, i) => (
                  <div key={`${ig.contraparte}-${i}`} className="flex items-center justify-between gap-3 border-b border-border py-1.5">
                    <span className="font-mono text-xs truncate">{ig.contraparte}</span>
                    <span className="text-muted-foreground shrink-0">{ig.motivo} · {ig.ocorrencias}×</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={gravar} disabled={!preview || preview.regras.length === 0 || gravando}>
            {gravando ? "A gravar…" : `Criar ${preview?.regras.length ?? 0} regras`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
