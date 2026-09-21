import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SolicitacaoContrato } from "@/hooks/useMyContratos";

interface EditContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: SolicitacaoContrato | null;
  onSave: (id: string, data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export const EditContratoDialog = ({ open, onOpenChange, contrato, onSave, isLoading }: EditContratoDialogProps) => {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [area, setArea] = useState("");
  const [funcao, setFuncao] = useState("");
  const [remuneracao, setRemuneracao] = useState("");
  const [remuneracaoExtenso, setRemuneracaoExtenso] = useState("");
  const [variavel, setVariavel] = useState("");
  const [escopoTrabalho, setEscopoTrabalho] = useState("");

  useEffect(() => {
    if (contrato) {
      setNome(contrato.nome || "");
      setCnpj(contrato.cnpj || "");
      setEmail(contrato.email || "");
      setEndereco(contrato.endereco || "");
      setArea(contrato.area || "");
      setFuncao(contrato.funcao || "");
      setRemuneracao(String(contrato.remuneracao || ""));
      setRemuneracaoExtenso(contrato.remuneracao_extenso || "");
      setVariavel(contrato.variavel || "");
      setEscopoTrabalho(contrato.escopo_trabalho || "");
    }
  }, [contrato]);

  const handleSave = () => {
    if (!contrato) return;
    onSave(contrato.id, {
      nome,
      cnpj,
      email,
      endereco,
      area,
      funcao,
      remuneracao: parseFloat(remuneracao.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
      remuneracao_extenso: remuneracaoExtenso || null,
      variavel: variavel || null,
      escopo_trabalho: escopoTrabalho,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Solicitação de Contrato</DialogTitle>
          <DialogDescription>Altere os dados da solicitação antes de enviar para assinatura.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input value={funcao} onChange={(e) => setFuncao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remuneração (R$)</Label>
              <Input value={remuneracao} onChange={(e) => setRemuneracao(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Endereço Completo</Label>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor por Extenso</Label>
            <Input value={remuneracaoExtenso} onChange={(e) => setRemuneracaoExtenso(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Remuneração Variável</Label>
            <Input value={variavel} onChange={(e) => setVariavel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Escopo de Trabalho</Label>
            <Textarea value={escopoTrabalho} onChange={(e) => setEscopoTrabalho(e.target.value)} className="min-h-[100px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
