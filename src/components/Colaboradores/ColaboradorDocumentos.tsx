import { useState } from "react";
import { Upload, Download, Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useColaboradorDocumentos, ColaboradorDocumento } from "@/hooks/useColaboradorDocumentos";
import { DeleteConfirmDialog } from "@/components/Dashboard/DeleteConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS_DOCUMENTO = [
  "Contrato",
  "RG",
  "CPF",
  "CNH",
  "Comprovante de Residência",
  "Certidão",
  "Diploma",
  "Certificado",
  "Outro",
];

interface ColaboradorDocumentosProps {
  colaboradorId: string;
}

export const ColaboradorDocumentos = ({ colaboradorId }: ColaboradorDocumentosProps) => {
  const { documentos, isLoading, uploadDocumento, deleteDocumento, getDownloadUrl, isUploading, isDeleting } = 
    useColaboradorDocumentos(colaboradorId);
  
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [deletingDoc, setDeletingDoc] = useState<ColaboradorDocumento | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleUpload = () => {
    if (!file || !nome || !tipo) return;
    
    uploadDocumento({ file, nome, tipo }, {
      onSuccess: () => {
        setFile(null);
        setNome("");
        setTipo("");
      }
    });
  };

  const handleDownload = async (doc: ColaboradorDocumento) => {
    try {
      setDownloading(doc.id);
      const url = await getDownloadUrl(doc.arquivo_url);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = () => {
    if (deletingDoc) {
      deleteDocumento(deletingDoc);
      setDeletingDoc(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="p-4 rounded-lg border border-subtle bg-card-dark space-y-4">
        <h4 className="font-medium text-sm text-foreground">Adicionar Documento</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="doc-nome">Nome do Documento</Label>
            <Input
              id="doc-nome"
              placeholder="Ex: Contrato de Trabalho"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="doc-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="doc-file">Arquivo</Label>
            <Input
              id="doc-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || !nome || !tipo || isUploading}
          className="w-full md:w-auto"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Enviar Documento
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-foreground">
          Documentos ({documentos?.length || 0})
        </h4>
        
        {!documentos || documentos.length === 0 ? (
          <div className="text-center p-6 border border-subtle rounded-lg bg-card-dark">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum documento anexado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-subtle bg-card-dark hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{doc.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.tipo} • {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {doc.uploader_email && ` • por ${doc.uploader_email}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    title="Baixar"
                  >
                    {downloading === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingDoc(doc)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deletingDoc}
        onOpenChange={(open) => !open && setDeletingDoc(null)}
        onConfirm={handleDelete}
        title="Excluir Documento"
        description="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
      />
    </div>
  );
};
