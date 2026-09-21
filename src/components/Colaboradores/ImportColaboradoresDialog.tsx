import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { ImportResult } from "@/hooks/useColaboradores";
import * as XLSX from "xlsx";

// Tipo para dados do colaborador da planilha
export interface ColaboradorImport {
  nome?: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  area?: string;
  funcao?: string;
  remuneracao?: number;
  data_inicio_contrato?: string;
  data_fim_contrato?: string;
  chave_pix_cnpj?: string;
  variavel?: string;
  regra_ote?: string;
  data_nascimento?: string;
  is_admin?: boolean;
  ativo?: boolean;
}

// Mapeamento de colunas da planilha para campos do sistema
const COLUMN_MAPPING: Record<string, keyof ColaboradorImport> = {
  // Nome
  "nome": "nome",
  "name": "nome",
  "colaborador": "nome",
  "colaboradores": "nome",
  "nome completo": "nome",
  "nome_completo": "nome",
  "full name": "nome",
  // Email
  "email": "email",
  "e-mail": "email",
  "email corporativo": "email",
  "email colaborador": "email",
  // CPF
  "cpf": "cpf",
  // CNPJ
  "cnpj": "cnpj",
  // Área
  "area": "area",
  "área": "area",
  // Função
  "funcao": "funcao",
  "função": "funcao",
  "cargo": "funcao",
  // Remuneração
  "remuneracao": "remuneracao",
  "remuneração": "remuneracao",
  "salario": "remuneracao",
  "salário": "remuneracao",
  "salario fixo": "remuneracao",
  "salário fixo": "remuneracao",
  "valor": "remuneracao",
  "valor fixo": "remuneracao",
  "remuneracao mensal": "remuneracao",
  // Data início contrato
  "data_inicio_contrato": "data_inicio_contrato",
  "data inicio": "data_inicio_contrato",
  "data início": "data_inicio_contrato",
  "início contrato": "data_inicio_contrato",
  "inicio contrato": "data_inicio_contrato",
  "inicio": "data_inicio_contrato",
  "início": "data_inicio_contrato",
  "data de início": "data_inicio_contrato",
  "data de inicio": "data_inicio_contrato",
  // Chave PIX
  "chave_pix_cnpj": "chave_pix_cnpj",
  "chave pix": "chave_pix_cnpj",
  "pix": "chave_pix_cnpj",
  "chave pix cnpj": "chave_pix_cnpj",
  // Variável
  "variavel": "variavel",
  "variável": "variavel",
  "comissao": "variavel",
  "comissão": "variavel",
  // Regra OTE
  "regra_ote": "regra_ote",
  "regra ote": "regra_ote",
  "ote": "regra_ote",
  // Data nascimento
  "data_nascimento": "data_nascimento",
  "data nascimento": "data_nascimento",
  "data de nascimento": "data_nascimento",
  "nascimento": "data_nascimento",
  // Admin
  "is_admin": "is_admin",
  "admin": "is_admin",
  "administrador": "is_admin",
  // Data fim contrato
  "data_fim_contrato": "data_fim_contrato",
  "data fim contrato": "data_fim_contrato",
  "data fim": "data_fim_contrato",
  "fim contrato": "data_fim_contrato",
  "data de fim": "data_fim_contrato",
  "fim": "data_fim_contrato",
  // Ativo
  "ativo": "ativo",
  "status": "ativo",
  "ativo?": "ativo",
};

interface ImportColaboradoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (colaboradores: ColaboradorImport[]) => Promise<{ results: ImportResult[]; sucessos: number; falhas: number }>;
  isImporting: boolean;
}

export const ImportColaboradoresDialog = ({ 
  open, 
  onOpenChange, 
  onImport, 
  isImporting 
}: ImportColaboradoresDialogProps) => {
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [colaboradores, setColaboradores] = useState<ColaboradorImport[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const parseExcelDate = (value: unknown): string => {
    if (!value) return "";
    
    // Se for número (data do Excel)
    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
    }
    
    // Se for string
    if (typeof value === "string") {
      // Tentar converter dd/mm/yyyy para yyyy-mm-dd
      const brDateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (brDateMatch) {
        return `${brDateMatch[3]}-${brDateMatch[2].padStart(2, "0")}-${brDateMatch[1].padStart(2, "0")}`;
      }
      // Se já estiver no formato yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
    }
    
    return String(value);
  };

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    setFileName(file.name);
    setParseErrors([]);
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { raw: false });
        
        console.log("Dados brutos da planilha:", jsonData);
        
        if (jsonData.length === 0) {
          setParseErrors(["Planilha vazia ou sem dados válidos"]);
          return;
        }

        // Log das colunas encontradas
        const firstRow = jsonData[0];
        const foundColumns = Object.keys(firstRow);
        console.log("Colunas encontradas:", foundColumns);
        
        const mappedColumns: string[] = [];
        const unmappedColumns: string[] = [];
        
        foundColumns.forEach(col => {
          const normalizedKey = col.toLowerCase().trim();
          if (COLUMN_MAPPING[normalizedKey]) {
            mappedColumns.push(`${col} → ${COLUMN_MAPPING[normalizedKey]}`);
          } else {
            unmappedColumns.push(col);
          }
        });
        
        console.log("Colunas mapeadas:", mappedColumns);
        console.log("Colunas NÃO mapeadas:", unmappedColumns);

        const errors: string[] = [];
        const parsed: ColaboradorImport[] = [];

        jsonData.forEach((row, index) => {
          const colaborador: Partial<ColaboradorImport> = {};
          
          // Mapear colunas
          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.toLowerCase().trim();
            const mappedField = COLUMN_MAPPING[normalizedKey];
            
            if (mappedField) {
              if (mappedField === "remuneracao") {
                // Converter para número - formato brasileiro: R$ 7.000,00
                let numValue = typeof value === "string" 
                  ? parseFloat(
                      value
                        .toString()
                        .replace(/[R$\s]/g, "")   // Remove R$, espaços
                        .replace(/\./g, "")       // Remove pontos de milhar
                        .replace(",", ".")        // Converte vírgula decimal para ponto
                    )
                  : Number(value);
                
                // Se o valor for muito pequeno (< 200), provavelmente está em milhares
                // Ex: 7.5 significa R$ 7.500,00, 20 significa R$ 20.000,00
                if (!isNaN(numValue) && numValue > 0 && numValue < 200) {
                  numValue = numValue * 1000;
                }
                
                colaborador[mappedField] = isNaN(numValue) ? 0 : numValue;
              } else if (mappedField === "is_admin" || mappedField === "ativo") {
                // Converter para boolean
                colaborador[mappedField] = value === true || value === "true" || value === "sim" || value === "1" || value === "Sim";
              } else if (mappedField === "data_inicio_contrato" || mappedField === "data_nascimento" || mappedField === "data_fim_contrato") {
                colaborador[mappedField] = parseExcelDate(value);
              } else {
                colaborador[mappedField] = String(value || "").trim();
              }
            }
          });

          // Verificar se a linha tem algum dado (ignorar linhas completamente vazias)
          const hasAnyData = Object.values(colaborador).some(v => v !== undefined && v !== "" && v !== 0);
          
          if (hasAnyData) {
            // Garantir valores padrão para campos não preenchidos
            // Se data_fim_contrato está preenchida, colaborador é inativo
            const dataFimPreenchida = colaborador.data_fim_contrato && colaborador.data_fim_contrato.trim() !== "";
            
            parsed.push({
              nome: colaborador.nome || "",
              email: colaborador.email || "",
              cpf: colaborador.cpf || "",
              cnpj: colaborador.cnpj,
              area: colaborador.area || "",
              funcao: colaborador.funcao || "",
              remuneracao: colaborador.remuneracao || 0,
              data_inicio_contrato: colaborador.data_inicio_contrato || "",
              data_fim_contrato: colaborador.data_fim_contrato,
              chave_pix_cnpj: colaborador.chave_pix_cnpj,
              variavel: colaborador.variavel,
              regra_ote: colaborador.regra_ote,
              data_nascimento: colaborador.data_nascimento,
              is_admin: colaborador.is_admin,
              ativo: dataFimPreenchida ? false : (colaborador.ativo ?? true),
            });
          }
        });

        console.log("Colaboradores parseados:", parsed);
        
        if (unmappedColumns.length > 0) {
          errors.push(`Colunas não reconhecidas: ${unmappedColumns.join(", ")}`);
        }

        setParseErrors(errors);
        setColaboradores(parsed);
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        setParseErrors(["Erro ao processar arquivo. Verifique se é um arquivo Excel ou CSV válido."]);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleImport = async () => {
    try {
      const response = await onImport(colaboradores);
      setResults(response.results);
      setShowResults(true);
    } catch (error) {
      console.error("Erro na importação:", error);
    }
  };

  const handleClose = () => {
    setResults(null);
    setShowResults(false);
    setColaboradores([]);
    setFileName("");
    setParseErrors([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {showResults ? "Resultado da Importação" : "Importar Colaboradores"}
          </DialogTitle>
          <DialogDescription>
            {showResults 
              ? "Confira o resultado da importação. Os colaboradores poderão criar sua senha ao acessar o sistema pela primeira vez."
              : colaboradores.length > 0 
                ? `${colaboradores.length} colaboradores prontos para importar`
                : "Selecione um arquivo Excel (.xlsx, .xls) ou CSV para importar"
            }
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-4">
            {colaboradores.length === 0 ? (
              // Upload area
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-muted">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos aceitos: .xlsx, .xls, .csv
                      </p>
                    </div>
                  </div>
                </label>

                {parseErrors.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg text-left">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Erros encontrados:</span>
                    </div>
                    <ul className="text-sm text-destructive space-y-1">
                      {parseErrors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {parseErrors.length > 5 && (
                        <li>... e mais {parseErrors.length - 5} erros</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-6 text-left text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Colunas aceitas (todas opcionais):</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span>• Nome</span>
                    <span>• Email</span>
                    <span>• CPF</span>
                    <span>• CNPJ</span>
                    <span>• Área</span>
                    <span>• Função</span>
                    <span>• Remuneração</span>
                    <span>• Data Início</span>
                    <span>• Data Fim Contrato</span>
                    <span>• Chave PIX</span>
                    <span>• Data Nascimento</span>
                    <span>• Variável</span>
                    <span>• Admin (sim/não)</span>
                  </div>
                </div>
              </div>
            ) : (
              // Preview data
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <span className="font-medium">{fileName}</span>
                    <Badge variant="secondary">{colaboradores.length} registros</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setColaboradores([]);
                      setFileName("");
                      setParseErrors([]);
                    }}
                  >
                    Trocar arquivo
                  </Button>
                </div>

                {parseErrors.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Avisos ({parseErrors.length} linhas com problemas foram ignoradas)</span>
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[350px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Remuneração</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaboradores.map((colab, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{colab.nome || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{colab.email || "-"}</TableCell>
                          <TableCell>{colab.area || "-"}</TableCell>
                          <TableCell>{colab.funcao || "-"}</TableCell>
                          <TableCell>{colab.remuneracao ? `R$ ${colab.remuneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</TableCell>
                          <TableCell>
                            {colab.ativo === false ? (
                              <Badge variant="secondary">Inativo</Badge>
                            ) : (
                              <Badge className="bg-green-500 text-white">Ativo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {colab.is_admin && <Badge className="bg-cyan text-cyan-foreground">Admin</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || colaboradores.length === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>Importar {colaboradores.length} Colaboradores</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Próximo passo:</strong> Os colaboradores devem acessar <code className="bg-muted px-1 rounded">/auth</code> e clicar em "Cadastre-se" usando o mesmo email importado. 
                O sistema vinculará automaticamente ao registro de colaborador.
              </p>
            </div>

            <ScrollArea className="h-[350px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results?.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {result.sucesso ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{result.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{result.email}</TableCell>
                      <TableCell>
                        {result.sucesso ? (
                          <span className="text-muted-foreground text-sm">Aguardando cadastro</span>
                        ) : (
                          <span className="text-destructive text-sm">{result.erro}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
