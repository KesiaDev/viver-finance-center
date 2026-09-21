import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Eye } from "lucide-react";
import { ModeloContrato } from "@/hooks/useModelosContrato";

const PLACEHOLDERS = [
  { key: "{{nome}}", desc: "Nome do contratado" },
  { key: "{{cnpj}}", desc: "CNPJ do contratado" },
  { key: "{{endereco}}", desc: "Endereço do contratado" },
  { key: "{{email}}", desc: "Email do contratado" },
  { key: "{{funcao}}", desc: "Função/cargo" },
  { key: "{{area}}", desc: "Área de atuação" },
  { key: "{{remuneracao}}", desc: "Valor formatado em R$" },
  { key: "{{remuneracao_extenso}}", desc: "Valor por extenso" },
  { key: "{{remuneracao_completa}}", desc: "Valor + extenso" },
  { key: "{{escopo_trabalho}}", desc: "Descrição do escopo" },
  { key: "{{data_inicio}}", desc: "Data de início formatada" },
  { key: "{{data_documento}}", desc: "Data atual por extenso" },
];

const SAMPLE_DATA: Record<string, string> = {
  "{{nome}}": "João da Silva",
  "{{cnpj}}": "12.345.678/0001-90",
  "{{endereco}}": "Rua Exemplo, 123, São Paulo/SP",
  "{{email}}": "joao@email.com",
  "{{funcao}}": "Desenvolvedor",
  "{{area}}": "Tecnologia",
  "{{remuneracao}}": "R$ 10.000,00",
  "{{remuneracao_extenso}}": "dez mil reais",
  "{{remuneracao_completa}}": "R$ 10.000,00 (dez mil reais)",
  "{{escopo_trabalho}}": "Desenvolvimento de software e manutenção de sistemas.",
  "{{data_inicio}}": "01/03/2026",
  "{{data_documento}}": "9 de fevereiro de 2026",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo?: ModeloContrato | null;
  onSave: (data: { nome: string; cargo_funcao: string; conteudo: string; is_default: boolean }) => void;
  isLoading: boolean;
}

export const ModeloContratoForm = ({ open, onOpenChange, modelo, onSave, isLoading }: Props) => {
  const [nome, setNome] = useState("");
  const [cargoFuncao, setCargoFuncao] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (modelo) {
      setNome(modelo.nome);
      setCargoFuncao(modelo.cargo_funcao);
      setConteudo(modelo.conteudo);
      setIsDefault(modelo.is_default);
    } else {
      setNome("");
      setCargoFuncao("");
      setConteudo("");
      setIsDefault(false);
    }
    setShowPreview(false);
  }, [modelo, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nome, cargo_funcao: cargoFuncao, conteudo, is_default: isDefault });
    onOpenChange(false);
  };

  const isHtmlTemplate = conteudo.trim().startsWith("<!DOCTYPE") || conteudo.trim().startsWith("<html") || conteudo.trim().startsWith("<!doctype");

  const previewContent = () => {
    let text = conteudo;
    for (const [key, val] of Object.entries(SAMPLE_DATA)) {
      text = text.split(key).join(val);
    }
    return text;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modelo ? "Editar Modelo" : "Novo Modelo de Contrato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Contrato PJ Desenvolvedor" required />
            </div>
            <div className="space-y-2">
              <Label>Cargo/Função Associado</Label>
              <Input value={cargoFuncao} onChange={(e) => setCargoFuncao(e.target.value)} placeholder="Ex: Desenvolvedor (ou 'default' para padrão)" required />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <Label>Modelo padrão (fallback)</Label>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" type="button" className="gap-1">
                <ChevronDown className="w-3 h-3" /> Placeholders disponíveis
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-md bg-muted/50 border">
                {PLACEHOLDERS.map((p) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs cursor-pointer" onClick={() => {
                      navigator.clipboard.writeText(p.key);
                    }}>{p.key}</Badge>
                    <span className="text-xs text-muted-foreground">{p.desc}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-2">
            <Label>Conteúdo do Contrato</Label>
            <Textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite o conteúdo do contrato usando os placeholders..."
              className="min-h-[300px] font-mono text-xs"
              required
            />
          </div>

          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-3 h-3" /> {showPreview ? "Ocultar Preview" : "Preview com dados de exemplo"}
          </Button>

          {showPreview && (
            isHtmlTemplate ? (
              <div className="border rounded-md bg-white overflow-hidden">
                <iframe
                  srcDoc={previewContent()}
                  className="w-full border-0"
                  style={{ height: "400px" }}
                  title="Preview do modelo"
                />
              </div>
            ) : (
              <div className="p-4 rounded-md bg-muted/30 border max-h-[300px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs font-mono">{previewContent()}</pre>
              </div>
            )
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{modelo ? "Salvar" : "Criar Modelo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
