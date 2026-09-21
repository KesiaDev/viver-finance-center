import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Receipt, DollarSign, FileText, Users, Calendar, AlertTriangle, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Regras = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const rules = [
    {
      icon: Receipt,
      title: "1. Reembolsos",
      items: [
        "Antes de realizar qualquer despesa, é obrigatório solicitar validação prévia da Diretoria.",
        "Reembolsos autorizados serão pagos no dia 10 do mês seguinte.",
        "É obrigatório anexar comprovante e justificativa no formulário.",
        "Reembolsos solicitados sem validação prévia, sem comprovante ou por mensagem não serão reembolsados.",
        "Caso a solicitação retorne para ajuste, o prazo passa a contar a partir do reenvio completo."
      ],
      color: "text-cyan",
      bgColor: "bg-cyan/10",
      actionLabel: "Solicitar Reembolso",
      actionPath: "/solicitacoes",
    },
    {
      icon: DollarSign,
      title: "2. Pagamentos a Fornecedores",
      items: [
        "Todas as faturas, boletos e notas recebidas em um mês são pagas no dia 30 do mês seguinte (ou no dia útil anterior).",
        "Não realizamos pagamentos dentro do mesmo mês, independentemente da data de envio, vencimento ou urgência."
      ],
      color: "text-orange",
      bgColor: "bg-orange/10",
    },
    {
      icon: Users,
      title: "3. Prestadores de Serviço / PJ",
      items: [
        "Notas fiscais devem ser enviadas até o dia 02 pela Central Financeira.",
        "Pagamentos são realizados até o 5º dia útil do mês, para notas enviadas dentro do prazo.",
        "Notas enviadas após o dia 02 serão pagas no dia 30 do mesmo mês.",
        "Pagamentos são feitos exclusivamente para a conta bancária vinculada ao CNPJ da nota.",
        "Notas com divergências serão devolvidas para correção e a data do pagamento será atualizada."
      ],
      color: "text-neon-green",
      bgColor: "bg-neonGreen/10",
      actionLabel: "Enviar Nota Fiscal",
      actionPath: "/notas-fiscais",
    },
    {
      icon: FileText,
      title: "4. Comissões",
      items: [
        "Os valores das comissões devem ser informados pela Diretoria até o dia 10 do mês subsequente ao fechamento.",
        "A nota fiscal de comissão deve ser enviada até o dia 10 do mês de pagamento.",
        "Pagamento é realizado no dia 15 do mês seguinte ao subsequente.",
        "Exemplo: Comissão referente a Outubro → NF enviada até 10/12 → pagamento 15/12."
      ],
      color: "text-magenta",
      bgColor: "bg-magenta/10",
      actionLabel: "Enviar Nota de Comissão",
      actionPath: "/notas-fiscais",
    },
    {
      icon: Calendar,
      title: "5. Devoluções a Clientes",
      items: [
        "Devoluções são realizadas em até 5 dias úteis após validação.",
        "É obrigatório anexar o comprovante do pagamento original e preencher o formulário específico.",
        "A devolução será feita somente para a mesma conta que realizou o pagamento.",
        "Obs.: Esta é a única operação financeira processada dentro do mesmo mês."
      ],
      color: "text-cyan",
      bgColor: "bg-cyan/10",
      actionLabel: "Solicitar Devolução",
      actionPath: "/solicitacoes",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Instruções e Políticas Financeiras</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>Toda a organização do fluxo financeiro é planejada no mês anterior.</p>
            <p>Não realizamos pagamentos dentro do mesmo mês, exceto devoluções a clientes.</p>
            <p>As solicitações de Reembolso, Devolução a Cliente e envio de Nota Fiscal, devem ser feitas exclusivamente pela Central Financeira.</p>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["item-0"]} className="space-y-4">
          {rules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg shadow-card hover:shadow-card-hover transition-all hover:border-primary/30 px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${rule.bgColor} flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${rule.color}`} />
                    </div>
                    <span className="text-lg font-semibold text-foreground text-left">{rule.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed ml-16">
                    {rule.items.map((item, idx) => (
                      <li key={idx} className="ml-2">{item}</li>
                    ))}
                  </ol>
                  
                  {user && rule.actionPath && (
                    <div className="mt-4 pt-4 border-t border-border ml-16">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(rule.actionPath)}
                        className="gap-2"
                      >
                        {rule.actionLabel}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {!user && (
          <Card className="mt-8 shadow-lg border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <LogIn className="w-5 h-5" />
                Acesse o Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Para enviar solicitações de reembolso, devoluções ou notas fiscais, você precisa estar logado no sistema.
              </p>
              <Button onClick={() => navigate("/auth")} className="gap-2">
                <LogIn className="w-4 h-4" />
                Fazer Login ou Cadastrar
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 shadow-card border-orange/50 bg-orange/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange">
              <AlertTriangle className="w-5 h-5" />
              Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              • Solicitações fora do prazo, incompletas ou enviadas por mensagem não serão processadas.
            </p>
            <p>
              • Em caso de dúvida sobre centro de custo, categoria ou procedimento, consulte o Financeiro antes de enviar.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Regras;
