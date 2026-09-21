import { User, FileText, MessageSquare, Calendar, Mail, MapPin, CreditCard, Briefcase, Laptop } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Colaborador } from "@/hooks/useColaboradores";
import { ColaboradorDocumentos } from "./ColaboradorDocumentos";
import { ColaboradorNotas } from "./ColaboradorNotas";
import { ColaboradorEquipamentos } from "@/components/Equipamentos/ColaboradorEquipamentos";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ColaboradorDetalhesProps {
  colaborador: Colaborador | null;
  open: boolean;
  onClose: () => void;
}

export const ColaboradorDetalhes = ({ colaborador, open, onClose }: ColaboradorDetalhesProps) => {
  if (!colaborador) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-subtle pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DrawerTitle className="text-lg">{colaborador.nome}</DrawerTitle>
              <p className="text-sm text-muted-foreground">{colaborador.funcao} • {colaborador.area}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge variant={colaborador.ativo ? "default" : "secondary"}>
                {colaborador.ativo ? "Ativo" : "Inativo"}
              </Badge>
              {colaborador.is_admin && (
                <Badge className="bg-cyan text-cyan-foreground">Admin</Badge>
              )}
              {colaborador.has_finance_access && (
                <Badge className="bg-emerald-500 text-white">Financeiro</Badge>
              )}
            </div>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-4">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="dados" className="flex-1">
                <User className="w-4 h-4 mr-2" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="equipamentos" className="flex-1">
                <Laptop className="w-4 h-4 mr-2" />
                Equipamentos
              </TabsTrigger>
              <TabsTrigger value="documentos" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="notas" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Info */}
                <div className="p-4 rounded-lg border border-subtle bg-card-dark space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contato</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{colaborador.email}</span>
                    </div>
                    {colaborador.endereco && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{colaborador.endereco}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="p-4 rounded-lg border border-subtle bg-card-dark space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Documentos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">CPF</span>
                      <span className="text-sm font-mono">{colaborador.cpf}</span>
                    </div>
                    {colaborador.cnpj && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CNPJ</span>
                        <span className="text-sm font-mono">{colaborador.cnpj}</span>
                      </div>
                    )}
                    {colaborador.data_nascimento && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nascimento</span>
                        <span className="text-sm">{format(parseISO(colaborador.data_nascimento), "dd/MM/yyyy")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Info */}
                <div className="p-4 rounded-lg border border-subtle bg-card-dark space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Trabalho</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Área</span>
                      <span className="text-sm">{colaborador.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Função</span>
                      <span className="text-sm">{colaborador.funcao}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Remuneração</span>
                      <span className="text-sm font-medium text-primary">{formatCurrency(colaborador.remuneracao)}</span>
                    </div>
                    {colaborador.variavel && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Variável</span>
                        <span className="text-sm">{colaborador.variavel}</span>
                      </div>
                    )}
                    {colaborador.regra_ote && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Regra OTE</span>
                        <span className="text-sm">{colaborador.regra_ote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contract Info */}
                <div className="p-4 rounded-lg border border-subtle bg-card-dark space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contrato</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Início: {format(parseISO(colaborador.data_inicio_contrato), "dd/MM/yyyy")}
                      </span>
                    </div>
                    {colaborador.data_fim_contrato && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          Fim: {format(parseISO(colaborador.data_fim_contrato), "dd/MM/yyyy")}
                        </span>
                      </div>
                    )}
                    {colaborador.chave_pix_cnpj && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">PIX: {colaborador.chave_pix_cnpj}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipamentos">
              <ColaboradorEquipamentos colaboradorId={colaborador.id} />
            </TabsContent>

            <TabsContent value="documentos">
              <ColaboradorDocumentos colaboradorId={colaborador.id} />
            </TabsContent>

            <TabsContent value="notas">
              <ColaboradorNotas colaboradorId={colaborador.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
