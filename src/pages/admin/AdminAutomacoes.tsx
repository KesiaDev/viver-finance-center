import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { useAutomations } from '@/hooks/useAutomations';
import { AutomationCard } from '@/components/admin/AutomationCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminAutomacoes = () => {
  const { 
    automations, 
    isLoading, 
    error,
    toggleAutomation,
    updateSchedule,
    updateConfig,
    executeNow,
    isExecuting
  } = useAutomations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar automações: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Zap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Automações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as automações do sistema
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          As automações executam tarefas programadas automaticamente. Você pode pausar, configurar horários e executar manualmente quando necessário.
        </AlertDescription>
      </Alert>

      {/* Automations List */}
      <div className="grid gap-4">
        {automations?.map((automation) => (
          <AutomationCard
            key={automation.id}
            automation={automation}
            onToggle={(activate) => toggleAutomation.mutate({ jobName: automation.job_name, activate })}
            onExecute={() => executeNow.mutate(automation.job_name)}
            onUpdateSchedule={(schedule) => updateSchedule.mutate({ jobName: automation.job_name, schedule })}
            onUpdateConfig={(config) => updateConfig.mutate({ jobName: automation.job_name, config })}
            isExecuting={isExecuting === automation.job_name}
            isToggling={toggleAutomation.isPending}
          />
        ))}

        {(!automations || automations.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma automação configurada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAutomacoes;
