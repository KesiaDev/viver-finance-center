import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Anexo {
  id: string;
  descricao: string;
  descricaoCustom?: string;
  file: File | null;
}

interface AnexosManagerProps {
  anexos: Anexo[];
  onChange: (anexos: Anexo[]) => void;
  error?: string;
  descricaoOptions?: string[];
}

const OUTRO_VALUE = "__outro__";

export const AnexosManager = ({ anexos, onChange, error, descricaoOptions }: AnexosManagerProps) => {
  const addAnexo = () => {
    onChange([...anexos, { id: crypto.randomUUID(), descricao: '', file: null }]);
  };

  const removeAnexo = (index: number) => {
    if (anexos.length > 1) {
      const newAnexos = anexos.filter((_, i) => i !== index);
      onChange(newAnexos);
    }
  };

  const updateAnexo = (index: number, field: keyof Anexo, value: string | File | null) => {
    const newAnexos = anexos.map((anexo, i) => {
      if (i === index) {
        // Se mudou de "Outro" para outra opção, limpar descricaoCustom
        if (field === 'descricao' && typeof value === 'string' && value !== OUTRO_VALUE) {
          return { ...anexo, descricao: value, descricaoCustom: undefined };
        }
        if (field === 'descricaoCustom' && typeof value === 'string') {
          return { ...anexo, descricaoCustom: value };
        }
        if (field === 'descricao' && typeof value === 'string') {
          return { ...anexo, descricao: value };
        }
        if (field === 'file') {
          return { ...anexo, file: value as File | null };
        }
        return anexo;
      }
      return anexo;
    });
    onChange(newAnexos);
  };

  // Função para obter a descrição final do anexo
  const getDescricaoFinal = (anexo: Anexo): string => {
    if (anexo.descricao === OUTRO_VALUE) {
      return anexo.descricaoCustom?.trim() || '';
    }
    return anexo.descricao;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Anexos</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAnexo}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Anexo
        </Button>
      </div>

      <div className="space-y-4">
        {anexos.map((anexo, index) => (
          <div
            key={anexo.id}
            className="border border-subtle rounded-lg p-4 bg-card-dark/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Anexo {index + 1}
              </span>
              {anexos.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAnexo(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`descricao-${index}`} className="text-sm">
                Descrição do Anexo *
              </Label>
              {descricaoOptions ? (
                <div className="space-y-2">
                  <Select
                    value={anexo.descricao}
                    onValueChange={(value) => updateAnexo(index, 'descricao', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {descricaoOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                      <SelectItem value={OUTRO_VALUE}>Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {anexo.descricao === OUTRO_VALUE && (
                    <Input
                      placeholder="Digite a descrição personalizada..."
                      value={anexo.descricaoCustom || ''}
                      onChange={(e) => updateAnexo(index, 'descricaoCustom', e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <Input
                  id={`descricao-${index}`}
                  placeholder="Ex: Nota fiscal, Recibo de táxi, Comprovante de hotel..."
                  value={anexo.descricao}
                  onChange={(e) => updateAnexo(index, 'descricao', e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`file-${index}`} className="text-sm">
                Arquivo *
              </Label>
              <Input
                id={`file-${index}`}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => updateAnexo(index, 'file', e.target.files?.[0] || null)}
              />
              {anexo.file && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {anexo.file.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Cada anexo deve ter uma descrição única. Aceita imagens e PDFs.
      </p>
    </div>
  );
};

// Helper function to get final description (exported for use in forms)
export const getAnexoDescricaoFinal = (anexo: Anexo): string => {
  if (anexo.descricao === "__outro__") {
    return anexo.descricaoCustom?.trim() || '';
  }
  return anexo.descricao;
};
