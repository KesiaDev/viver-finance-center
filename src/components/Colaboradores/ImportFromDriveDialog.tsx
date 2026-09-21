import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useGoogleDriveImport, DriveFile } from '@/hooks/useGoogleDriveImport';
import { FileText, RefreshCw, Cloud, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ImportFromDriveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorId?: string;
  onImportComplete?: (results: { path: string; originalName: string }[]) => void;
}

export function ImportFromDriveDialog({ 
  open, 
  onOpenChange, 
  colaboradorId,
  onImportComplete 
}: ImportFromDriveDialogProps) {
  const { isLoading, files, importProgress, listFiles, importMultipleFiles } = useGoogleDriveImport();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      listFiles();
      setSelectedFiles(new Set());
    }
  }, [open]);

  const toggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const handleImport = async () => {
    const filesToImport = files.filter(f => selectedFiles.has(f.id));
    const importedResults: { path: string; originalName: string }[] = [];
    
    await importMultipleFiles(filesToImport, colaboradorId, async (_file, result) => {
      importedResults.push(result);
    });

    if (importedResults.length > 0 && onImportComplete) {
      onImportComplete(importedResults);
    }
    
    onOpenChange(false);
  };

  const formatFileSize = (size?: string) => {
    if (!size) return '';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Importar PDFs do Google Drive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} arquivo(s) encontrado(s)
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={listFiles}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {isLoading && files.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando arquivos...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum arquivo PDF encontrado na pasta.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox 
                  checked={selectedFiles.size === files.length && files.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  Selecionar todos ({selectedFiles.size} selecionado{selectedFiles.size !== 1 ? 's' : ''})
                </span>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => toggleFile(file.id)}
                    >
                      <Checkbox 
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleFile(file.id)}
                      />
                      <FileText className="h-8 w-8 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          {file.modifiedTime && (
                            <span>Modificado: {formatDate(file.modifiedTime)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {importProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando...</span>
                <span>{importProgress.current} de {importProgress.total}</span>
              </div>
              <Progress value={(importProgress.current / importProgress.total) * 100} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!importProgress}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={selectedFiles.size === 0 || !!importProgress}
          >
            <Download className="h-4 w-4 mr-2" />
            Importar {selectedFiles.size > 0 ? `(${selectedFiles.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
