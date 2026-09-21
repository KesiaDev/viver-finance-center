import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RequestStatus } from "./StatusBadge";
import { StatusWithComment } from "./StatusWithComment";
import { useMyDevolucoes } from "@/hooks/useMyDevolucoes";
import { AnexosPopover } from "./AnexosPopover";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const MyDevolucoesList = () => {
  const { devolucoes, isLoading } = useMyDevolucoes();
  const { setDuplicateData } = useDuplicate();
  const navigate = useNavigate();

  const handleDuplicate = (devolucao: any) => {
    setDuplicateData({
      type: 'devolucao',
      data: {
        nomeCliente: devolucao.nome_cliente,
        valor: String(devolucao.valor),
        motivo: devolucao.motivo,
        numeroNota: devolucao.link_venda_hubla,
        tipoChavePix: devolucao.tipo_chave_pix,
        chavePix: devolucao.chave_pix,
      }
    });
    navigate('/solicitacoes');
    toast.info("Dados copiados! Preencha os campos restantes.");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!devolucoes || devolucoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Minhas Devoluções</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não tem devoluções solicitadas
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Minhas Devoluções</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-subtle hover:bg-card-dark/50">
              <TableHead className="text-muted-foreground font-medium">Cliente</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data</TableHead>
              <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
              <TableHead className="text-muted-foreground font-medium">Motivo</TableHead>
              <TableHead className="text-muted-foreground font-medium">Responsável</TableHead>
              <TableHead className="text-muted-foreground font-medium">Tipo PIX</TableHead>
              <TableHead className="text-muted-foreground font-medium">Chave PIX</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data Prevista Pagto</TableHead>
              <TableHead className="text-muted-foreground font-medium">Comprovantes</TableHead>
              <TableHead className="text-muted-foreground font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devolucoes.map((devolucao) => (
              <TableRow key={devolucao.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{devolucao.nome_cliente}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(devolucao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(devolucao.valor))}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{devolucao.motivo}</TableCell>
                <TableCell className="text-muted-foreground">{devolucao.responsavel}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-cyan/10 text-cyan text-xs font-medium border border-cyan/20">
                    {devolucao.tipo_chave_pix || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground max-w-[180px] truncate">
                  {devolucao.chave_pix || 'Não informada'}
                </TableCell>
                <TableCell>
                  <StatusWithComment status={devolucao.status as RequestStatus} comentario={devolucao.status_comentario} />
                </TableCell>
                <TableCell className="text-neon-green font-medium">
                  {devolucao.data_prevista_pagamento 
                    ? format(parseISO(devolucao.data_prevista_pagamento), "dd/MM/yyyy", { locale: ptBR })
                    : "Calculando..."}
                </TableCell>
                <TableCell>
                  <AnexosPopover
                    anexos={devolucao.devolucao_anexos || []}
                    bucketName="devolucoes"
                    legacyUrl={devolucao.comprovante_original_url}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDuplicate(devolucao)}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
