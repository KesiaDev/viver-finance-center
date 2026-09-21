import { useState } from "react";
import { useMyMateriais } from "@/hooks/useMyMateriais";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RequestStatus } from "./StatusBadge";
import { StatusWithComment } from "./StatusWithComment";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useNavigate } from "react-router-dom";
import { Copy, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface MaterialItem {
  id: string;
  descricao: string;
  link: string | null;
  valor: number;
  quantidade?: number;
}

export const MyMateriaisList = () => {
  const { materiais, isLoading } = useMyMateriais();
  const { setDuplicateData } = useDuplicate();
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDuplicate = (material: any) => {
    const itens = material.material_itens?.map((item: MaterialItem) => ({
      descricao: item.descricao,
      quantidade: item.quantidade?.toString() || "1",
      link: item.link || "",
      valor: item.valor?.toString() || "",
    })) || [{ descricao: material.material, quantidade: "1", link: "", valor: "" }];

    setDuplicateData({
      type: 'material',
      data: {
        itens,
        centroCusto: material.centro_custo,
        justificativa: material.justificativa,
      }
    });
    navigate('/solicitacoes');
    toast.info("Dados copiados! Preencha os campos restantes.");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando suas solicitações de materiais...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!materiais || materiais.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Minhas Solicitações de Materiais</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não solicitou nenhum material
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Minhas Solicitações de Materiais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiais.map((material) => {
                const itens = (material as any).material_itens || [];
                const isExpanded = expandedRows.has(material.id);
                const valorTotal = (material as any).valor_total || itens.reduce((acc: number, i: MaterialItem) => acc + (i.valor || 0) * (i.quantidade || 1), 0);

                return (
                  <Collapsible key={material.id} asChild open={isExpanded}>
                    <>
                      <TableRow className="group">
                        <TableCell>
                          {itens.length > 0 && (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRow(material.id)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{material.material}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                            {itens.length || 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{material.centro_custo}</TableCell>
                        <TableCell>
                          <StatusWithComment status={material.status as RequestStatus} comentario={material.status_comentario} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(material.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDuplicate(material)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Duplicar solicitação</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      {itens.length > 0 && (
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30 hover:bg-muted/50">
                            <TableCell colSpan={8} className="p-0">
                              <div className="px-8 py-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Itens da solicitação:</p>
                                <div className="space-y-2">
                                   {itens.map((item: MaterialItem) => {
                                     const qtd = item.quantidade || 1;
                                     const totalItem = item.valor * qtd;
                                     return (
                                       <div key={item.id} className="flex items-center justify-between text-sm bg-background rounded px-3 py-2">
                                         <div className="flex items-center gap-3">
                                           <span>{item.descricao}</span>
                                           {item.link && (
                                             <a
                                               href={item.link}
                                               target="_blank"
                                               rel="noopener noreferrer"
                                               className="text-primary hover:underline flex items-center gap-1"
                                             >
                                               <ExternalLink className="h-3 w-3" />
                                               Ver produto
                                             </a>
                                           )}
                                         </div>
                                         <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                           <span>Qtd: <span className="font-medium text-foreground">{qtd}</span></span>
                                           <span>R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} un.</span>
                                           <span className="font-semibold text-foreground">
                                             Total: R$ {totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                           </span>
                                         </div>
                                       </div>
                                     );
                                   })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      )}
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
