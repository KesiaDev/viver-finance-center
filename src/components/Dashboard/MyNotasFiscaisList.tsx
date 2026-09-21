import { format } from "date-fns";
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
import { AnexosPopover } from "./AnexosPopover";
import { useMyNotasFiscais } from "@/hooks/useMyNotasFiscais";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const MyNotasFiscaisList = () => {
  const { notasFiscais, isLoading } = useMyNotasFiscais();
  const { setDuplicateData } = useDuplicate();
  const navigate = useNavigate();

  const handleDuplicate = (nota: any) => {
    setDuplicateData({
      type: 'nota_fiscal',
      data: {
        nome: nota.nome,
        cnpj: nota.cnpj,
        tipoChavePix: nota.tipo_chave_pix || 'CNPJ',
        chavePix: nota.chave_pix,
        periodoReferencia: nota.periodo_referencia,
        mesPagamento: nota.mes_pagamento || '',
        valor: String(nota.valor),
      }
    });
    navigate('/notas-fiscais');
    toast.info("Dados copiados! Atualize os campos necessários.");
  };

  const getAnexos = (nota: any) => {
    if (nota.nota_fiscal_anexos && nota.nota_fiscal_anexos.length > 0) {
      return nota.nota_fiscal_anexos.map((a: any) => ({
        id: a.id,
        descricao: a.descricao,
        arquivo_url: a.arquivo_url,
      }));
    }
    if (nota.nota_url) {
      return [{ id: 'legacy', descricao: "Nota Fiscal", arquivo_url: nota.nota_url }];
    }
    return [];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando suas notas fiscais...
        </CardContent>
      </Card>
    );
  }

  if (!notasFiscais || notasFiscais.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não enviou nenhuma nota fiscal
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Minhas Notas Fiscais Enviadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-subtle hover:bg-card-dark/50">
                <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
                <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-muted-foreground font-medium hidden md:table-cell">CNPJ</TableHead>
                <TableHead className="text-muted-foreground font-medium">Data</TableHead>
                <TableHead className="text-muted-foreground font-medium">Valor</TableHead>
                <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Período</TableHead>
                <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Pagamento</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Anexos</TableHead>
                <TableHead className="text-muted-foreground font-medium">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiscais.map((nota) => (
                <TableRow key={nota.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                  <TableCell className="font-medium text-foreground">{nota.nome}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{nota.descricao || "-"}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{nota.cnpj}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(nota.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-primary font-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(nota.valor))}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">{nota.periodo_referencia}</TableCell>
                  <TableCell className="text-muted-foreground hidden lg:table-cell">{nota.mes_pagamento || "-"}</TableCell>
                  <TableCell>
                    <StatusWithComment status={nota.status as RequestStatus} comentario={nota.status_comentario} />
                  </TableCell>
                  <TableCell>
                    <AnexosPopover 
                      anexos={getAnexos(nota)} 
                      bucketName="notas-fiscais"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDuplicate(nota)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Duplicar nota fiscal</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
