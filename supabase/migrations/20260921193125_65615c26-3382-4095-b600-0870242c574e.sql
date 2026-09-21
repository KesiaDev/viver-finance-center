CREATE TABLE IF NOT EXISTS public.hotmart_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  event text,
  version text,
  occurred_at timestamptz,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS hotmart_webhook_events_event_id_key
  ON public.hotmart_webhook_events (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS hotmart_webhook_events_created_at_idx
  ON public.hotmart_webhook_events (created_at DESC);

GRANT SELECT ON public.hotmart_webhook_events TO authenticated;
GRANT ALL ON public.hotmart_webhook_events TO service_role;

ALTER TABLE public.hotmart_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotmart_webhook_events_select_finance"
  ON public.hotmart_webhook_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'admin_viewer'::app_role)
    OR public.has_role(auth.uid(), 'finance'::app_role)
    OR public.has_role(auth.uid(), 'finance_viewer'::app_role)
  );