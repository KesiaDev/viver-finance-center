import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Download, ExternalLink, FileText, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Anexo {
  id: string;
  descricao: string;
  arquivo_url: string;
}

interface AnexosPopoverProps {
  anexos: Anexo[];
  bucketName: string;
  legacyUrl?: string | null;
}

const extractStoragePath = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    const parts = pathname.split('/');
    const publicIndex = parts.indexOf('public');
    const objectIndex = parts.indexOf('object');
    
    if (publicIndex !== -1) {
      return parts.slice(publicIndex + 2).join('/');
    } else if (objectIndex !== -1) {
      return parts.slice(objectIndex + 2).join('/');
    }
    
    return parts.slice(-2).join('/');
  } catch (error) {
    console.error('Erro ao extrair path:', error);
    return url.split('/').slice(-2).join('/');
  }
};

export const AnexosPopover = ({ anexos, bucketName, legacyUrl }: AnexosPopoverProps) => {
  const [opening, setOpening] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleViewAttachment = async (url: string, id?: string) => {
    try {
      setOpening(id || 'legacy');
      const path = extractStoragePath(url);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, 3600);
      
      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Erro ao abrir anexo:', error);
      toast.error(`Erro ao abrir anexo. Tente usar o botão de download.`);
    } finally {
      setOpening(null);
    }
  };

  const handleDownload = async (url: string, descricao: string, id?: string) => {
    try {
      setDownloading(id || 'legacy');
      const path = extractStoragePath(url);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(path);
      
      if (error) throw error;
      
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = descricao || 'anexo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Download iniciado!');
    } catch (error: any) {
      console.error('Erro ao baixar anexo:', error);
      toast.error(`Erro ao baixar: ${error.message || 'Tente novamente'}`);
    } finally {
      setDownloading(null);
    }
  };

  const totalAnexos = anexos.length + (legacyUrl ? 1 : 0);

  if (totalAnexos === 0) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  if (totalAnexos === 1) {
    const url = anexos[0]?.arquivo_url || legacyUrl;
    const descricao = anexos[0]?.descricao || 'Comprovante';
    if (!url) return <span className="text-muted-foreground text-sm">-</span>;
    
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewAttachment(url, anexos[0]?.id)}
          className="hover:text-primary"
          disabled={opening !== null}
          title="Visualizar"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDownload(url, descricao, anexos[0]?.id)}
          className="hover:text-primary"
          disabled={downloading !== null}
          title="Download"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 hover:text-primary">
          <Paperclip className="w-4 h-4" />
          <span className="text-xs">{totalAnexos}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Anexos ({totalAnexos})
          </p>
          
          {legacyUrl && (
            <div className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-md">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1 text-sm">Comprovante original</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleViewAttachment(legacyUrl)}
                disabled={opening === 'legacy'}
                title="Visualizar"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDownload(legacyUrl, 'Comprovante original')}
                disabled={downloading === 'legacy'}
                title="Download"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {anexos.map((anexo) => (
            <div key={anexo.id} className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-md">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1 text-sm">{anexo.descricao}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleViewAttachment(anexo.arquivo_url, anexo.id)}
                disabled={opening === anexo.id}
                title="Visualizar"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDownload(anexo.arquivo_url, anexo.descricao, anexo.id)}
                disabled={downloading === anexo.id}
                title="Download"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
