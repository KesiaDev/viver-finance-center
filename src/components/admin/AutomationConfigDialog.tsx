import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AutomationConfig } from '@/hooks/useAutomations';

interface AutomationConfigDialogProps {
  automation: AutomationConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSchedule: (schedule: string) => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
}

export const AutomationConfigDialog = ({
  automation,
  open,
  onOpenChange,
  onUpdateSchedule,
  onUpdateConfig
}: AutomationConfigDialogProps) => {
  const [brtHour, setBrtHour] = useState('12');
  const [minute, setMinute] = useState('30');
  const [webhooks, setWebhooks] = useState<string[]>([]);
  const [webhookLabels, setWebhookLabels] = useState<Record<string, string>>({
    primary: 'Canal Principal',
    secondary: 'Canal Secundário',
    tertiary: 'Canal Terciário',
  });

  useEffect(() => {
    // Parse current schedule (stored in UTC)
    const parts = automation.schedule.split(' ');
    if (parts.length === 5) {
      setMinute(parts[0]);
      // Convert UTC to BRT for display
      const utcHour = parseInt(parts[1]);
      const brt = (utcHour - 3 + 24) % 24;
      setBrtHour(brt.toString());
    }

    // Parse current config
    const config = automation.config as { webhooks?: string[]; webhookLabels?: Record<string, string> };
    setWebhooks(config?.webhooks || ['primary', 'secondary', 'tertiary']);
    setWebhookLabels(config?.webhookLabels || {
      primary: 'Canal Principal',
      secondary: 'Canal Secundário',
      tertiary: 'Canal Terciário',
    });
  }, [automation]);

  const handleSave = () => {
    // Convert BRT to UTC for cron expression
    const utcHour = (parseInt(brtHour) + 3) % 24;
    const newSchedule = `${minute} ${utcHour} * * *`;
    
    // Only update if changed
    if (newSchedule !== automation.schedule) {
      onUpdateSchedule(newSchedule);
    }

    // Build config - always update with webhooks and labels
    onUpdateConfig({ 
      ...automation.config, 
      webhooks,
      webhookLabels 
    });

    onOpenChange(false);
  };

  const toggleWebhook = (webhook: string) => {
    setWebhooks(prev => 
      prev.includes(webhook) 
        ? prev.filter(w => w !== webhook)
        : [...prev, webhook]
    );
  };

  // Calculate UTC for reference display
  const utcHour = (parseInt(brtHour) + 3) % 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar {automation.name}</DialogTitle>
          <DialogDescription>
            Ajuste o horário e destino da automação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Schedule Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Horário de Execução (Brasília)</Label>
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Label htmlFor="hour" className="text-xs text-muted-foreground">Hora</Label>
                <Input
                  id="hour"
                  type="number"
                  min="0"
                  max="23"
                  value={brtHour}
                  onChange={(e) => setBrtHour(e.target.value)}
                  className="w-20"
                />
              </div>
              <span className="mt-6 text-xl">:</span>
              <div className="space-y-1">
                <Label htmlFor="minute" className="text-xs text-muted-foreground">Minuto</Label>
                <Input
                  id="minute"
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Será executado às {utcHour.toString().padStart(2, '0')}:{minute.padStart(2, '0')} UTC
            </p>
          </div>

          <Separator />

          {/* Webhooks Section */}
          {automation.function_name === 'discord-daily-report' && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Canais de Destino</Label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="webhook-primary"
                      checked={webhooks.includes('primary')}
                      onCheckedChange={() => toggleWebhook('primary')}
                    />
                    <Input
                      value={webhookLabels.primary}
                      onChange={(e) => setWebhookLabels(prev => ({
                        ...prev,
                        primary: e.target.value
                      }))}
                      className="h-8 text-sm flex-1"
                      placeholder="Nome do canal"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">DISCORD_WEBHOOK_URL</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="webhook-secondary"
                      checked={webhooks.includes('secondary')}
                      onCheckedChange={() => toggleWebhook('secondary')}
                    />
                    <Input
                      value={webhookLabels.secondary}
                      onChange={(e) => setWebhookLabels(prev => ({
                        ...prev,
                        secondary: e.target.value
                      }))}
                      className="h-8 text-sm flex-1"
                      placeholder="Nome do canal"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">DISCORD_WEBHOOK_URL_2</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="webhook-tertiary"
                      checked={webhooks.includes('tertiary')}
                      onCheckedChange={() => toggleWebhook('tertiary')}
                    />
                    <Input
                      value={webhookLabels.tertiary}
                      onChange={(e) => setWebhookLabels(prev => ({
                        ...prev,
                        tertiary: e.target.value
                      }))}
                      className="h-8 text-sm flex-1"
                      placeholder="Nome do canal"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground ml-6">DISCORD_WEBHOOK_URL_3</span>
                </div>
              </div>
              {webhooks.length === 0 && (
                <p className="text-xs text-destructive">
                  Selecione pelo menos um canal de destino
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={webhooks.length === 0}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
