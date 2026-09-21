import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusWithComment } from "./StatusWithComment";
import { RequestStatus } from "./StatusBadge";
import { useMyContratos } from "@/hooks/useMyContratos";
import { ExternalLink } from "lucide-react";

export const MyContratosList = () => {
  const { contratos, isLoading } = useMyContratos();

  if (isLoading) return <div className="text-center py-8">Carregando...</div>;

  if (!contratos || contratos.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-primary">Meus Contratos</CardTitle></CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não tem solicitações de contrato
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader><CardTitle className="text-primary">Meus Contratos</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-subtle hover:bg-card-dark/50">
              <TableHead className="text-muted-foreground font-medium">Nome</TableHead>
              <TableHead className="text-muted-foreground font-medium">Função</TableHead>
              <TableHead className="text-muted-foreground font-medium">Remuneração</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data Início</TableHead>
              <TableHead className="text-muted-foreground font-medium">Data Solicitação</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Contrato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((c) => (
              <TableRow key={c.id} className="border-subtle hover:bg-card-dark/50 transition-colors">
                <TableCell className="font-medium text-foreground">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground">{c.funcao}</TableCell>
                <TableCell className="text-primary font-semibold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.remuneracao))}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(c.data_inicio_contrato), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <StatusWithComment status={c.status as RequestStatus} comentario={c.status_comentario} />
                </TableCell>
                <TableCell>
                  {c.contrato_url ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={c.contrato_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" /> Ver
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
