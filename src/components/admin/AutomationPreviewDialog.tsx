import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ReportPreviewCard } from './ReportPreviewCard';
import type { AutomationConfig } from '@/hooks/useAutomations';

interface AutomationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: AutomationConfig;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer: { text: string };
  timestamp: string;
}

export const AutomationPreviewDialog = ({ 
  open, 
  onOpenChange, 
  automation 
}: AutomationPreviewDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [embed, setEmbed] = useState<DiscordEmbed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(automation.function_name, {
        body: { 
          type: 'current',
          preview: true,
          manual: true
        }
      });
      
      if (fnError) {
        throw fnError;
      }
      
      if (data?.embed) {
        setEmbed(data.embed);
      } else {
        throw new Error('Resposta inválida da função');
      }
    } catch (err) {
      console.error('Erro ao carregar preview:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar preview');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadPreview();
    } else {
      setEmbed(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview do Relatório</DialogTitle>
          <DialogDescription>
            Esta é uma pré-visualização de como o relatório será exibido no Discord. 
            Nenhuma mensagem foi enviada.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {embed && !isLoading && (
            <ReportPreviewCard embed={embed} />
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            onClick={loadPreview} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
