import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

const FOLDER_ID = '1b9mLM42HeSzmN3Y1NQ28zqVnDYt26PFa';

export function useGoogleDriveImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const listFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-import', {
        body: { action: 'list', folderId: FOLDER_ID }
      });

      if (error) throw error;
      
      setFiles(data.files || []);
      return data.files || [];
    } catch (error: any) {
      console.error('Error listing files:', error);
      toast.error('Erro ao listar arquivos do Drive: ' + error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const importFile = async (file: DriveFile, colaboradorId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-import', {
        body: { 
          action: 'download', 
          folderId: FOLDER_ID,
          fileId: file.id,
          fileName: file.name,
          colaboradorId
        }
      });

      if (error) throw error;
      
      return { success: true, path: data.path, originalName: data.originalName };
    } catch (error: any) {
      console.error('Error importing file:', error);
      throw error;
    }
  };

  const importMultipleFiles = async (
    selectedFiles: DriveFile[], 
    colaboradorId?: string,
    onFileImported?: (file: DriveFile, result: { path: string; originalName: string }) => Promise<void>
  ) => {
    setImportProgress({ current: 0, total: selectedFiles.length });
    const results: { file: DriveFile; success: boolean; path?: string; error?: string }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        const result = await importFile(file, colaboradorId);
        results.push({ file, success: true, path: result.path });
        
        if (onFileImported) {
          await onFileImported(file, result);
        }
      } catch (error: any) {
        results.push({ file, success: false, error: error.message });
      }
      setImportProgress({ current: i + 1, total: selectedFiles.length });
    }

    setImportProgress(null);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) importado(s) com sucesso`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} arquivo(s) falharam na importação`);
    }

    return results;
  };

  return {
    isLoading,
    files,
    importProgress,
    listFiles,
    importFile,
    importMultipleFiles
  };
}
