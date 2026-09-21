import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt } from "lucide-react";

interface NotaFiscalMes {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  valor: number;
  created_at: string;
  periodo_referencia: string;
}

interface NotasFiscaisMesListProps {
  notasFiscais: NotaFiscalMes[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const NotasFiscaisMesList = ({ notasFiscais }: NotasFiscaisMesListProps) => {
  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
  const mesAtualCapitalizado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Notas Fiscais do Mês - {mesAtualCapitalizado}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notasFiscais.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma nota fiscal enviada este mês
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Data de Envio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiscais.map((nota) => (
                <TableRow key={nota.id}>
                  <TableCell className="font-medium">{nota.email}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(nota.valor))}</TableCell>
                  <TableCell className="text-right">
                    {format(new Date(nota.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
