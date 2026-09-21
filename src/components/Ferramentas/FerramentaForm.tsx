import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ferramenta, FerramentaInput } from "@/hooks/useFerramentas";
import { useColaboradores } from "@/hooks/useColaboradores";
import { CentroCustoCombobox } from "./CentroCustoCombobox";

interface FerramentaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ferramenta: Ferramenta | null;
  onSubmit: (data: FerramentaInput & { id?: string }) => void;
  isLoading: boolean;
}

export const FerramentaForm = ({
  open,
  onOpenChange,
  ferramenta,
  onSubmit,
  isLoading,
}: FerramentaFormProps) => {
  const { colaboradores } = useColaboradores();
  const [showSenha, setShowSenha] = useState(false);

  const [form, setForm] = useState<FerramentaInput>({
    nome: "",
    link_acesso: "",
    usuario: "",
    senha: "",
    login_gmail: false,
    cartao_cadastrado: "",
    centro_custo: "",
    valor: null,
    tipo_pagamento: null,
    responsavel_id: null,
    data_inicio: "",
    data_cancelamento: "",
    ativo: true,
    observacoes: "",
  });

  useEffect(() => {
    if (ferramenta) {
      setForm({
        nome: ferramenta.nome,
        link_acesso: ferramenta.link_acesso || "",
        usuario: ferramenta.usuario || "",
        senha: ferramenta.senha || "",
        login_gmail: ferramenta.login_gmail ?? false,
        cartao_cadastrado: ferramenta.cartao_cadastrado || "",
        centro_custo: ferramenta.centro_custo || "",
        valor: ferramenta.valor ?? null,
        tipo_pagamento: ferramenta.tipo_pagamento ?? null,
        responsavel_id: ferramenta.responsavel_id,
        data_inicio: ferramenta.data_inicio || "",
        data_cancelamento: ferramenta.data_cancelamento || "",
        ativo: ferramenta.ativo,
        observacoes: ferramenta.observacoes || "",
      });
    } else {
      setForm({
        nome: "",
        link_acesso: "",
        usuario: "",
        senha: "",
        login_gmail: false,
        cartao_cadastrado: "",
        centro_custo: "",
        valor: null,
        tipo_pagamento: null,
        responsavel_id: null,
        data_inicio: "",
        data_cancelamento: "",
        ativo: true,
        observacoes: "",
      });
    }
    setShowSenha(false);
  }, [ferramenta, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: FerramentaInput & { id?: string } = {
      ...form,
      link_acesso: form.link_acesso || null,
      usuario: form.usuario || null,
      senha: form.senha || null,
      cartao_cadastrado: form.cartao_cadastrado || null,
      centro_custo: form.centro_custo || null,
      valor: form.valor ?? null,
      tipo_pagamento: form.tipo_pagamento || null,
      data_inicio: form.data_inicio || null,
      data_cancelamento: form.data_cancelamento || null,
      observacoes: form.observacoes || null,
    };
    if (ferramenta) payload.id = ferramenta.id;
    onSubmit(payload);
    onOpenChange(false);
  };

  const colaboradoresAtivos = colaboradores?.filter((c) => c.ativo) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ferramenta ? "Editar Ferramenta" : "Nova Ferramenta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_acesso">Link de Acesso</Label>
              <Input
                id="link_acesso"
                value={form.link_acesso || ""}
                onChange={(e) => setForm({ ...form, link_acesso: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                value={form.usuario || ""}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  value={form.senha || ""}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowSenha(!showSenha)}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="login_gmail"
                  checked={form.login_gmail}
                  onCheckedChange={(v) => setForm({ ...form, login_gmail: !!v })}
                />
                <Label htmlFor="login_gmail">Login com Gmail</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartao_cadastrado">Cartão Cadastrado</Label>
              <Input
                id="cartao_cadastrado"
                value={form.cartao_cadastrado || ""}
                onChange={(e) => setForm({ ...form, cartao_cadastrado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor ?? ""}
                onChange={(e) =>
                  setForm({ ...form, valor: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Pagamento</Label>
              <RadioGroup
                value={form.tipo_pagamento || ""}
                onValueChange={(v) => setForm({ ...form, tipo_pagamento: v })}
                className="flex gap-4 pt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="mensal" id="mensal" />
                  <Label htmlFor="mensal" className="font-normal">Mensal</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="anual" id="anual" />
                  <Label htmlFor="anual" className="font-normal">Anual</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Centro de Custo</Label>
              <CentroCustoCombobox
                value={form.centro_custo || ""}
                onChange={(v) => setForm({ ...form, centro_custo: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={form.responsavel_id || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, responsavel_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {colaboradoresAtivos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={form.data_inicio || ""}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_cancelamento">Data de Cancelamento</Label>
              <Input
                id="data_cancelamento"
                type="date"
                value={form.data_cancelamento || ""}
                onChange={(e) => setForm({ ...form, data_cancelamento: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label>Ativa</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes || ""}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !form.nome}>
              {isLoading ? "Salvando..." : ferramenta ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
