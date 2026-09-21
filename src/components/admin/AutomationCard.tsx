import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Settings, 
  Clock, 
  Calendar,
  Loader2,
  Send,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AutomationConfig } from '@/hooks/useAutomations';
import { AutomationConfigDialog } from './AutomationConfigDialog';
import { AutomationPreviewDialog } from './AutomationPreviewDialog';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationCardProps {
  automation: AutomationConfig;
  onToggle: (activate: boolean) => void;
  onExecute: () => void;
  onUpdateSchedule: (schedule: string) => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  isExecuting: boolean;
  isToggling: boolean;
}

// Parse cron expression to human readable format
const parseCronSchedule = (cron: string): string => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Simple parsing for common patterns
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Diariamente às ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }
  
  return `Cron: ${cron}`;
};

// Convert UTC time to BRT
const convertToBRT = (cron: string): string => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return '';
  
  const [minute, hour] = parts;
  const hourNum = parseInt(hour);
  const brtHour = (hourNum - 3 + 24) % 24; // UTC to BRT (UTC-3)
  
  return `${brtHour.toString().padStart(2, '0')}:${minute.padStart(2, '0')} BRT`;
};

export const AutomationCard = ({
  automation,
  onToggle,
  onExecute,
  onUpdateSchedule,
  onUpdateConfig,
  isExecuting,
  isToggling
}: AutomationCardProps) => {
  const { canEditAdmin } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const getIconForAutomation = (functionName: string) => {
    switch (functionName) {
      case 'discord-daily-report':
        return <Send className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const webhookConfig = automation.config as { webhooks?: string[] };
  const webhookCount = webhookConfig?.webhooks?.length || 0;

  return (
    <>
      <Card className={`transition-all ${automation.is_active ? 'border-primary/50' : 'border-muted opacity-75'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${automation.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {getIconForAutomation(automation.function_name)}
              </div>
              <div>
                <CardTitle className="text-lg">{automation.name}</CardTitle>
                <CardDescription className="mt-1">
                  {automation.description}
                </CardDescription>
              </div>
            </div>
            {canEditAdmin ? (
              <div className="flex items-center gap-2">
                <Switch
                  checked={automation.is_active}
                  onCheckedChange={onToggle}
                  disabled={isToggling}
                />
                <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                  {automation.is_active ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>
            ) : (
              <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                {automation.is_active ? 'Ativo' : 'Pausado'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Schedule Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{parseCronSchedule(automation.schedule)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">({convertToBRT(automation.schedule)})</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {webhookCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Send className="h-4 w-4" />
                <span>Discord ({webhookCount} {webhookCount === 1 ? 'canal' : 'canais'})</span>
              </div>
            )}
            {automation.last_run && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Última execução: {formatDistanceToNow(new Date(automation.last_run), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {canEditAdmin && (
            <div className="flex gap-2 pt-2 flex-wrap">
              {automation.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExecute}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Executar Agora
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Testar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AutomationConfigDialog
        automation={automation}
        open={showConfig}
        onOpenChange={setShowConfig}
        onUpdateSchedule={onUpdateSchedule}
        onUpdateConfig={onUpdateConfig}
      />

      <AutomationPreviewDialog
        automation={automation}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </>
  );
};
