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
import { useMyReembolsos } from "@/hooks/useMyReembolsos";
import { AnexosPopover } from "./AnexosPopover";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const MyReembolsosList = () => {
  const { reembolsos, isLoading } = useMyReembolsos();
  const { setDuplicateData } = useDuplicate();
  const navigate = useNavigate();

  const handleDuplicate = (reembolso: any) => {
    setDuplicateData({
      type: 'reembolso',
      data: {
        nome: reembolso.nome,
        motivo: reembolso.motivo,
        valor: String(reembolso.valor),
        centroCusto: reembolso.centro_custo,
        tipoChavePix: reembolso.tipo_chave_pix,
        chavePix: reembolso.chave_pix,
      }
    });
    navigate('/solicitacoes');
    toast.info("Dados copiados! Preencha os campos restantes.");
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!reembolsos || reembolsos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Meus Reembolsos</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não tem reembolsos solicitados
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Meus Reembolsos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-subtle hover:bg-card-dark/50">
              <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data</TableHead>
              <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
              <TableHead className="text-muted-foreground font-medium">Motivo</TableHead>
              <TableHead className="text-muted-foreground font-medium">Centro de Custo</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data Prevista Pagto</TableHead>
              <TableHead className="text-muted-foreground font-medium">Comprovantes</TableHead>
              <TableHead className="text-muted-foreground font-medium">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reembolsos.map((reembolso) => (
              <TableRow key={reembolso.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{reembolso.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(reembolso.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(reembolso.valor))}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{reembolso.motivo}</TableCell>
                <TableCell className="text-muted-foreground">{reembolso.centro_custo}</TableCell>
                <TableCell>
                  <StatusWithComment status={reembolso.status as RequestStatus} comentario={reembolso.status_comentario} />
                </TableCell>
                <TableCell className="text-neon-green font-medium">
                  {reembolso.data_prevista_pagamento 
                    ? format(parseISO(reembolso.data_prevista_pagamento), "dd/MM/yyyy", { locale: ptBR })
                    : "Calculando..."}
                </TableCell>
                <TableCell>
                  <AnexosPopover
                    anexos={reembolso.reembolso_anexos || []}
                    bucketName="reembolsos"
                    legacyUrl={reembolso.comprovante_url}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDuplicate(reembolso)}
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
