import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutomationConfig {
  id: string;
  name: string;
  description: string | null;
  job_name: string;
  schedule: string;
  is_active: boolean;
  function_name: string;
  config: Record<string, unknown>;
  last_run: string | null;
  created_at: string;
  updated_at: string;
}

export const useAutomations = () => {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  const { data: automations, isLoading, error } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_config')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as AutomationConfig[];
    }
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ jobName, activate }: { jobName: string; activate: boolean }) => {
      const { data, error } = await supabase.functions.invoke('manage-automation', {
        body: { 
          action: activate ? 'activate' : 'pause',
          job_name: jobName 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success(variables.activate ? 'Automação ativada' : 'Automação pausada');
    },
    onError: (error) => {
      console.error('Error toggling automation:', error);
      toast.error('Erro ao alterar automação');
    }
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ jobName, schedule }: { jobName: string; schedule: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-automation', {
        body: { 
          action: 'update_schedule',
          job_name: jobName,
          schedule
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Horário atualizado');
    },
    onError: (error) => {
      console.error('Error updating schedule:', error);
      toast.error('Erro ao atualizar horário');
    }
  });

  const updateConfig = useMutation({
    mutationFn: async ({ jobName, config }: { jobName: string; config: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('manage-automation', {
        body: { 
          action: 'update_config',
          job_name: jobName,
          config
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Configuração atualizada');
    },
    onError: (error) => {
      console.error('Error updating config:', error);
      toast.error('Erro ao atualizar configuração');
    }
  });

  const executeNow = useMutation({
    mutationFn: async (jobName: string) => {
      setIsExecuting(jobName);
      const { data, error } = await supabase.functions.invoke('manage-automation', {
        body: { 
          action: 'execute_now',
          job_name: jobName 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success('Automação executada com sucesso');
      setIsExecuting(null);
    },
    onError: (error) => {
      console.error('Error executing automation:', error);
      toast.error('Erro ao executar automação');
      setIsExecuting(null);
    }
  });

  return {
    automations,
    isLoading,
    error,
    toggleAutomation,
    updateSchedule,
    updateConfig,
    executeNow,
    isExecuting
  };
};
