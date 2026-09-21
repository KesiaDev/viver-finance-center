-- Snapshot completo do schema public (gerado automaticamente)
-- Objetivo: permitir recriar a base do zero a partir do repositorio.

-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'finance', 'finance_viewer', 'admin_viewer', 'approver_notas', 'approver_reembolsos', 'approver_devolucoes', 'approver_materiais');
CREATE TYPE public.goal_type AS ENUM ('sales_volume', 'sales_value', 'net_margin_percentage');
CREATE TYPE public.period_status AS ENUM ('open', 'closed');
CREATE TYPE public.tax_regime AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');
CREATE TYPE public.transaction_type AS ENUM ('revenue', 'expense', 'tax');

-- ===== TABELAS =====

CREATE TABLE IF NOT EXISTS public.automacoes_execucoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  regra_id uuid,
  status text DEFAULT 'ok'::text NOT NULL,
  itens_processados integer DEFAULT 0 NOT NULL,
  detalhes jsonb,
  erro text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.automacoes_regras (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL,
  empresa_id uuid,
  dias_antecedencia integer DEFAULT 3 NOT NULL,
  canal text DEFAULT 'whatsapp'::text NOT NULL,
  template text,
  hora_execucao text DEFAULT '09:00'::text NOT NULL,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.automation_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  job_name text NOT NULL,
  schedule text NOT NULL,
  is_active boolean DEFAULT false,
  function_name text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  last_run timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cash_flow_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  parent_code text,
  sort_order integer NOT NULL,
  is_calculated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_flow_data (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  month text NOT NULL,
  category_code text NOT NULL,
  realized_value numeric DEFAULT 0,
  projected_value numeric DEFAULT 0,
  notes text,
  synced_from text,
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_flow_data_detailed (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  month text NOT NULL,
  marvee_category_structure text NOT NULL,
  marvee_category_description text,
  realized_value numeric DEFAULT 0,
  projected_value numeric DEFAULT 0,
  source_type text NOT NULL,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_flow_expenses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  marvee_id integer NOT NULL,
  month text NOT NULL,
  category_structure text NOT NULL,
  category_description text,
  movement_value numeric DEFAULT 0 NOT NULL,
  expiration_date date,
  document_number text,
  installment integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_flow_revenues (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  marvee_id integer NOT NULL,
  month text NOT NULL,
  category_structure text NOT NULL,
  category_description text,
  movement_value numeric DEFAULT 0 NOT NULL,
  payment_date date,
  document_number text NOT NULL,
  installment integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.centros_custo (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid,
  nome text NOT NULL,
  codigo text,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.centros_custo_ferramentas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cliente_contratos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cliente_id uuid NOT NULL,
  empresa_id uuid,
  descricao text NOT NULL,
  valor numeric(14,2) DEFAULT 0 NOT NULL,
  periodicidade text DEFAULT 'mensal'::text NOT NULL,
  dia_vencimento integer,
  data_inicio date DEFAULT CURRENT_DATE NOT NULL,
  data_fim date,
  status text DEFAULT 'ativo'::text NOT NULL,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid,
  nome text NOT NULL,
  cpf_cnpj text,
  whatsapp text,
  email text,
  endereco text,
  cidade text,
  uf text,
  cep text,
  observacoes text,
  status text DEFAULT 'ativo'::text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cobranca_historico (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conta_receber_id uuid,
  cliente_id uuid,
  canal text DEFAULT 'whatsapp'::text NOT NULL,
  tipo text DEFAULT 'cobranca'::text NOT NULL,
  mensagem text,
  resultado text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.colaborador_documentos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  colaborador_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL,
  arquivo_url text NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colaborador_notas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  colaborador_id uuid NOT NULL,
  conteudo text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colaboradores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  nome text NOT NULL,
  cnpj text,
  cpf text NOT NULL,
  endereco text,
  chave_pix_cnpj text,
  email text NOT NULL,
  data_inicio_contrato date NOT NULL,
  data_fim_contrato date,
  area text NOT NULL,
  remuneracao numeric(10,2) NOT NULL,
  funcao text NOT NULL,
  is_admin boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  variavel text,
  regra_ote text,
  data_nascimento date,
  has_finance_access boolean DEFAULT false,
  has_finance_view_access boolean DEFAULT false,
  has_admin_view_access boolean DEFAULT false,
  can_approve_notas boolean DEFAULT false,
  can_approve_reembolsos boolean DEFAULT false,
  can_approve_devolucoes boolean DEFAULT false,
  can_approve_materiais boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid,
  fornecedor_id uuid,
  categoria_id uuid,
  veiculo_id uuid,
  lancamento_id uuid,
  descricao text NOT NULL,
  centro_custo text,
  valor numeric(14,2) NOT NULL,
  valor_pago numeric(14,2) DEFAULT 0 NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  forma_pagamento text,
  parcela integer DEFAULT 1 NOT NULL,
  total_parcelas integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'aberto'::text NOT NULL,
  origem text DEFAULT 'manual'::text NOT NULL,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  comprovante_url text
);

CREATE TABLE IF NOT EXISTS public.contas_receber (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cliente_id uuid NOT NULL,
  contrato_id uuid,
  empresa_id uuid,
  descricao text NOT NULL,
  valor numeric(14,2) NOT NULL,
  valor_pago numeric(14,2) DEFAULT 0 NOT NULL,
  data_vencimento date NOT NULL,
  parcela integer DEFAULT 1 NOT NULL,
  total_parcelas integer DEFAULT 1 NOT NULL,
  forma_pagamento text,
  status text DEFAULT 'aberto'::text NOT NULL,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contratos_itens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  contrato_id uuid NOT NULL,
  produto_id uuid,
  descricao text NOT NULL,
  quantidade numeric(14,2) DEFAULT 1 NOT NULL,
  valor_unitario numeric(14,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.despesa_categorias (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  centro_custo_sugerido text,
  palavras_chave text[],
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.devolucao_anexos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  devolucao_id uuid NOT NULL,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.devolucoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nome_cliente text NOT NULL,
  valor numeric(10,2) NOT NULL,
  motivo text NOT NULL,
  link_venda_hubla text NOT NULL,
  responsavel text NOT NULL,
  comprovante_original_url text,
  status text DEFAULT 'pendente'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tipo_chave_pix text DEFAULT 'CPF'::text NOT NULL,
  chave_pix text DEFAULT ''::text NOT NULL,
  data_prevista_pagamento date,
  status_comentario text
);

CREATE TABLE IF NOT EXISTS public.director_bonus_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  director_id text NOT NULL,
  year integer NOT NULL,
  quarterly_base numeric NOT NULL,
  annual_base numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drafts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empresa_usuarios (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid NOT NULL,
  user_id uuid NOT NULL,
  papel text DEFAULT 'leitura'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  slug text NOT NULL,
  cor text DEFAULT '#64748b'::text NOT NULL,
  ativo boolean DEFAULT true NOT NULL,
  ordem integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  cnpj text,
  razao_social text,
  endereco text,
  cidade text,
  uf text,
  cep text,
  telefone text,
  email text,
  responsavel_id uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.equipamento_fotos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  equipamento_id uuid NOT NULL,
  arquivo_url text NOT NULL,
  descricao text,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  uploaded_by uuid
);

CREATE TABLE IF NOT EXISTS public.equipamentos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  colaborador_id uuid,
  nome text NOT NULL,
  tipo text NOT NULL,
  marca text,
  modelo text,
  numero_serie text,
  patrimonio text,
  estado text DEFAULT 'bom'::text NOT NULL,
  data_aquisicao date,
  valor numeric,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferramentas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  link_acesso text,
  usuario text,
  senha text,
  cartao_cadastrado text,
  centro_custo text,
  responsavel_id uuid,
  data_inicio date,
  data_cancelamento date,
  ativo boolean DEFAULT true NOT NULL,
  observacoes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  login_gmail boolean DEFAULT false NOT NULL,
  valor numeric,
  tipo_pagamento text
);

CREATE TABLE IF NOT EXISTS public.financial_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  value numeric DEFAULT 0 NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.financial_periods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status period_status DEFAULT 'open'::period_status,
  initial_cash_balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  cpf_cnpj text,
  whatsapp text,
  email text,
  categoria text,
  observacoes text,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  period_id uuid NOT NULL,
  type goal_type NOT NULL,
  target_value numeric NOT NULL,
  achieved_value numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.historico_alteracoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tabela text NOT NULL,
  registro_id uuid,
  acao text NOT NULL,
  valor_anterior jsonb,
  valor_novo jsonb,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hubla_webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_type text NOT NULL,
  smart_installment_id text,
  subscription_id text,
  source_invoice_id text,
  seller_id text,
  payer_id text,
  payer_email text,
  payer_name text,
  payer_document text,
  payer_phone text,
  status text,
  amount_cents integer,
  installment integer,
  total_installments integer,
  payment_method text,
  product_id text,
  product_name text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lancamento_anexos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  lancamento_id uuid NOT NULL,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lancamentos_auditoria (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  lancamento_id uuid NOT NULL,
  empresa_id uuid,
  acao text NOT NULL,
  descricao text,
  valor_anterior jsonb,
  valor_novo jsonb,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lancamentos_empresa (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  categoria text,
  centro_custo text,
  fornecedor_cliente text,
  valor numeric(14,2) NOT NULL,
  data_competencia date NOT NULL,
  data_pagamento date,
  status text DEFAULT 'previsto'::text NOT NULL,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  recorrencia_id uuid,
  comprovante_url text
);

CREATE TABLE IF NOT EXISTS public.marvee_category_mapping (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  marvee_cost_center_id text,
  marvee_cost_center_name text,
  cash_flow_category_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  marvee_category_structure text,
  marvee_category_description text
);

CREATE TABLE IF NOT EXISTS public.marvee_extrato (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  guid text NOT NULL,
  source text NOT NULL,
  type_column text NOT NULL,
  type_sign integer NOT NULL,
  movement_date date NOT NULL,
  movement_value numeric NOT NULL,
  comments text,
  account_id integer,
  account_name text,
  account_bank_code text,
  installment_id integer,
  document_id integer,
  document_code text,
  document_description text,
  generation_date date,
  people_name text,
  category_structure text,
  category_description text,
  cost_center_name text,
  payment_method text,
  month text NOT NULL,
  raw_payload jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  consolidated boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marvee_extrato_consolidated_months (
  month text NOT NULL,
  consolidated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marvee_sync_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sync_type text NOT NULL,
  status text NOT NULL,
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  triggered_by text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marvee_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  marvee_id integer NOT NULL,
  source_type text NOT NULL,
  status text NOT NULL,
  movement_value numeric DEFAULT 0 NOT NULL,
  payment_date date,
  expiration_date date,
  document_number text,
  category_level_1_id integer,
  category_level_1_structure text,
  category_level_1_description text,
  category_level_2_id integer,
  category_level_2_structure text,
  category_level_2_description text,
  category_level_3_id integer,
  category_level_3_structure text,
  category_level_3_description text,
  raw_payload jsonb,
  synced_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  installment integer DEFAULT 1,
  original_value numeric,
  description text,
  people_name text,
  people_fantasy_name text,
  payment_method text,
  cost_center_name text,
  generation_date date
);

CREATE TABLE IF NOT EXISTS public.materiais (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nome_solicitante text NOT NULL,
  material text NOT NULL,
  centro_custo text NOT NULL,
  justificativa text NOT NULL,
  status text DEFAULT 'pendente'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  status_comentario text,
  valor_total numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.material_itens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  material_id uuid NOT NULL,
  descricao text NOT NULL,
  link text,
  valor numeric DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  quantidade integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.modelos_contrato (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  cargo_funcao text NOT NULL,
  conteudo text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.monthly_planning (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  month date NOT NULL,
  revenue numeric DEFAULT 0,
  other_revenue numeric DEFAULT 0,
  forecast_revenue numeric DEFAULT 0,
  expense numeric DEFAULT 0,
  other_expense numeric DEFAULT 0,
  forecast_expense numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  distribution numeric DEFAULT 0,
  initial_balance numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  revenue_new_sales numeric DEFAULT 0,
  revenue_recurring_previous numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  planned_revenue numeric,
  planned_expense numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.monthly_targets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  month date NOT NULL,
  revenue_target numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nota_fiscal_anexos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nota_fiscal_id uuid NOT NULL,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cnpj text NOT NULL,
  periodo_referencia text NOT NULL,
  valor numeric(10,2) NOT NULL,
  nota_url text NOT NULL,
  banco text,
  agencia text,
  conta text,
  tipo_conta text,
  chave_pix text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'pendente'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mes_pagamento text,
  descricao text,
  tipo_chave_pix text DEFAULT 'CNPJ'::text,
  status_comentario text
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  action text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parcelamento_dashboard_data (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  card_name text NOT NULL,
  card_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  synced_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.produtos_servicos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  tipo text DEFAULT 'servico'::text NOT NULL,
  valor_padrao numeric(14,2),
  descricao text,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text,
  nome_completo text,
  tipo_chave_pix text,
  chave_pix text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recebimentos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  conta_receber_id uuid NOT NULL,
  valor numeric(14,2) NOT NULL,
  data_pagamento date DEFAULT CURRENT_DATE NOT NULL,
  forma_pagamento text,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recorrencia_geracoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  recorrencia_id uuid NOT NULL,
  lancamento_id uuid,
  mes_referencia text NOT NULL,
  gerado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recorrencias_lancamento (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  categoria text,
  centro_custo text,
  fornecedor_cliente text,
  valor numeric NOT NULL,
  dia_vencimento integer NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  ativo boolean DEFAULT true NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reembolso_anexos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  reembolso_id uuid NOT NULL,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reembolsos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  data date NOT NULL,
  motivo text NOT NULL,
  valor numeric(10,2) NOT NULL,
  centro_custo text NOT NULL,
  chave_pix text NOT NULL,
  tipo_chave_pix text NOT NULL,
  comprovante_url text,
  status text DEFAULT 'pendente'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  data_prevista_pagamento date,
  status_comentario text
);

CREATE TABLE IF NOT EXISTS public.sales_target_monthly (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  sales_target_id uuid NOT NULL,
  month date NOT NULL,
  monthly_target numeric DEFAULT 0,
  achieved_value numeric DEFAULT 0,
  cash_achieved numeric DEFAULT 0,
  recurring_achieved numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_targets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  period_id uuid NOT NULL,
  monthly_target numeric DEFAULT 0,
  target_ml_percentage numeric DEFAULT 15,
  cash_sale_percentage numeric DEFAULT 30,
  recurring_sale_percentage numeric DEFAULT 70,
  recurring_installments integer DEFAULT 12,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  month_forecast numeric DEFAULT 0,
  annual_target numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.scenarios (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  period_id uuid NOT NULL,
  name text NOT NULL,
  revenue_change_percent numeric DEFAULT 0,
  expense_change_percent numeric DEFAULT 0,
  time_horizon_months integer DEFAULT 6,
  projected_revenue numeric,
  projected_expenses numeric,
  projected_taxes numeric,
  projected_net_margin numeric,
  projected_cash_balance numeric,
  ai_analysis text,
  ai_recommendations jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_scan_status (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  total_findings integer DEFAULT 0 NOT NULL,
  critical_count integer DEFAULT 0 NOT NULL,
  high_count integer DEFAULT 0 NOT NULL,
  warn_count integer DEFAULT 0 NOT NULL,
  info_count integer DEFAULT 0 NOT NULL,
  scan_timestamp timestamp with time zone NOT NULL,
  scanner_summary jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_baixa_cerbro (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nome_cliente text NOT NULL,
  cpf text,
  identificador text,
  motivo text NOT NULL,
  observacoes text,
  solicitante text,
  status text DEFAULT 'pendente'::text NOT NULL,
  status_comentario text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_contrato (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pendente'::text NOT NULL,
  status_comentario text,
  nome text NOT NULL,
  cpf text,
  cnpj text NOT NULL,
  email text NOT NULL,
  endereco text NOT NULL,
  area text NOT NULL,
  funcao text NOT NULL,
  remuneracao numeric NOT NULL,
  variavel text,
  data_inicio_contrato date NOT NULL,
  chave_pix text,
  tipo_chave_pix text,
  escopo_trabalho text NOT NULL,
  contrato_url text,
  autentique_doc_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  remuneracao_extenso text,
  cartao_cnpj_url text,
  documento_foto_url text,
  nome_completo text
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_mensagem (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  destinatario text NOT NULL,
  telefone text,
  mensagem text NOT NULL,
  data_envio_desejada date,
  observacoes text,
  solicitante text,
  status text DEFAULT 'pendente'::text NOT NULL,
  status_comentario text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tax_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  regime tax_regime NOT NULL,
  aliquot_percentage numeric NOT NULL,
  min_revenue numeric DEFAULT 0,
  max_revenue numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  type transaction_type NOT NULL,
  color text DEFAULT '#6366f1'::text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  period_id uuid NOT NULL,
  category_id uuid,
  type transaction_type NOT NULL,
  description text,
  amount numeric NOT NULL,
  date date NOT NULL,
  is_forecast boolean DEFAULT true,
  is_recurring boolean DEFAULT false,
  recurring_interval text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.veiculos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  empresa_id uuid,
  apelido text NOT NULL,
  modelo text,
  placa text,
  ano integer,
  responsavel_id uuid,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_contatos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  telefone text NOT NULL,
  nome text,
  cliente_id uuid,
  colaborador_id uuid,
  user_id uuid,
  push_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversa_estado (
  telefone text NOT NULL,
  pendencia jsonb,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  telefone text NOT NULL,
  contato_id uuid,
  instancia_id uuid,
  ultima_mensagem text,
  ultima_mensagem_at timestamp with time zone,
  nao_lidas integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_envios (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  telefone text NOT NULL,
  instancia_id uuid,
  tipo text DEFAULT 'texto'::text NOT NULL,
  mensagem text NOT NULL,
  origem text DEFAULT 'manual'::text NOT NULL,
  referencia_tipo text,
  referencia_id uuid,
  status text DEFAULT 'pendente'::text NOT NULL,
  erro text,
  enviado_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_instancias (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  nome text NOT NULL,
  base_url text NOT NULL,
  empresa_id uuid,
  status text DEFAULT 'desconhecido'::text NOT NULL,
  numero text,
  ativo boolean DEFAULT true NOT NULL,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  telefone text NOT NULL,
  direcao text DEFAULT 'inbound'::text NOT NULL,
  tipo_midia text DEFAULT 'texto'::text NOT NULL,
  texto text,
  transcricao text,
  interpretacao jsonb,
  resposta text,
  lancamento_id uuid,
  erro text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  instancia_id uuid,
  contato_id uuid,
  conversa_id uuid,
  message_id text,
  delivery_status text,
  intencao text,
  confianca numeric(5,2),
  anexo_url text
);

CREATE TABLE IF NOT EXISTS public.whatsapp_numeros_autorizados (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  telefone text NOT NULL,
  nome text NOT NULL,
  empresa_padrao_id uuid,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===== CONSTRAINTS =====
ALTER TABLE public.automacoes_execucoes ADD CONSTRAINT automacoes_execucoes_pkey PRIMARY KEY (id);
ALTER TABLE public.automacoes_execucoes ADD CONSTRAINT automacoes_execucoes_regra_id_fkey FOREIGN KEY (regra_id) REFERENCES automacoes_regras(id) ON DELETE CASCADE;
ALTER TABLE public.automacoes_regras ADD CONSTRAINT automacoes_regras_pkey PRIMARY KEY (id);
ALTER TABLE public.automacoes_regras ADD CONSTRAINT automacoes_regras_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE public.automation_config ADD CONSTRAINT automation_config_job_name_key UNIQUE (job_name);
ALTER TABLE public.automation_config ADD CONSTRAINT automation_config_pkey PRIMARY KEY (id);
ALTER TABLE public.cash_flow_categories ADD CONSTRAINT cash_flow_categories_code_key UNIQUE (code);
ALTER TABLE public.cash_flow_categories ADD CONSTRAINT cash_flow_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.cash_flow_categories ADD CONSTRAINT cash_flow_categories_type_check CHECK ((type = ANY (ARRAY['revenue'::text, 'expense'::text, 'distribution'::text, 'balance'::text])));
ALTER TABLE public.cash_flow_data ADD CONSTRAINT cash_flow_data_month_category_code_key UNIQUE (month, category_code);
ALTER TABLE public.cash_flow_data ADD CONSTRAINT cash_flow_data_pkey PRIMARY KEY (id);
ALTER TABLE public.cash_flow_data ADD CONSTRAINT cash_flow_data_category_code_fkey FOREIGN KEY (category_code) REFERENCES cash_flow_categories(code);
ALTER TABLE public.cash_flow_data_detailed ADD CONSTRAINT cash_flow_data_detailed_month_marvee_category_structure_sou_key UNIQUE (month, marvee_category_structure, source_type);
ALTER TABLE public.cash_flow_data_detailed ADD CONSTRAINT cash_flow_data_detailed_unique_key UNIQUE (month, marvee_category_structure, source_type);
ALTER TABLE public.cash_flow_data_detailed ADD CONSTRAINT cash_flow_data_detailed_pkey PRIMARY KEY (id);
ALTER TABLE public.cash_flow_expenses ADD CONSTRAINT cash_flow_expenses_marvee_id_installment_key UNIQUE (marvee_id, installment);
ALTER TABLE public.cash_flow_expenses ADD CONSTRAINT cash_flow_expenses_pkey PRIMARY KEY (id);
ALTER TABLE public.cash_flow_revenues ADD CONSTRAINT cash_flow_revenues_marvee_id_installment_key UNIQUE (marvee_id, installment);
ALTER TABLE public.cash_flow_revenues ADD CONSTRAINT cash_flow_revenues_pkey PRIMARY KEY (id);
ALTER TABLE public.centros_custo ADD CONSTRAINT centros_custo_pkey PRIMARY KEY (id);
ALTER TABLE public.centros_custo ADD CONSTRAINT centros_custo_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE public.centros_custo_ferramentas ADD CONSTRAINT centros_custo_ferramentas_nome_key UNIQUE (nome);
ALTER TABLE public.centros_custo_ferramentas ADD CONSTRAINT centros_custo_ferramentas_pkey PRIMARY KEY (id);
ALTER TABLE public.cliente_contratos ADD CONSTRAINT cliente_contratos_pkey PRIMARY KEY (id);
ALTER TABLE public.cliente_contratos ADD CONSTRAINT cliente_contratos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE public.cliente_contratos ADD CONSTRAINT cliente_contratos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);
ALTER TABLE public.clientes ADD CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE public.cobranca_historico ADD CONSTRAINT cobranca_historico_pkey PRIMARY KEY (id);
ALTER TABLE public.cobranca_historico ADD CONSTRAINT cobranca_historico_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE public.cobranca_historico ADD CONSTRAINT cobranca_historico_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id) ON DELETE CASCADE;
ALTER TABLE public.colaborador_documentos ADD CONSTRAINT colaborador_documentos_pkey PRIMARY KEY (id);
ALTER TABLE public.colaborador_documentos ADD CONSTRAINT colaborador_documentos_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;
ALTER TABLE public.colaborador_documentos ADD CONSTRAINT colaborador_documentos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
ALTER TABLE public.colaborador_notas ADD CONSTRAINT colaborador_notas_pkey PRIMARY KEY (id);
ALTER TABLE public.colaborador_notas ADD CONSTRAINT colaborador_notas_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;
ALTER TABLE public.colaborador_notas ADD CONSTRAINT colaborador_notas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.colaboradores ADD CONSTRAINT colaboradores_email_key UNIQUE (email);
ALTER TABLE public.colaboradores ADD CONSTRAINT colaboradores_pkey PRIMARY KEY (id);
ALTER TABLE public.colaboradores ADD CONSTRAINT colaboradores_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.colaboradores ADD CONSTRAINT colaboradores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_pkey PRIMARY KEY (id);
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES despesa_categorias(id) ON DELETE SET NULL;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES lancamentos_empresa(id) ON DELETE SET NULL;
ALTER TABLE public.contas_pagar ADD CONSTRAINT contas_pagar_veiculo_id_fkey FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL;
ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_pkey PRIMARY KEY (id);
ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;
ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES cliente_contratos(id) ON DELETE SET NULL;
ALTER TABLE public.contas_receber ADD CONSTRAINT contas_receber_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE public.contratos_itens ADD CONSTRAINT contratos_itens_pkey PRIMARY KEY (id);
ALTER TABLE public.contratos_itens ADD CONSTRAINT contratos_itens_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES cliente_contratos(id) ON DELETE CASCADE;
ALTER TABLE public.contratos_itens ADD CONSTRAINT contratos_itens_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES produtos_servicos(id) ON DELETE SET NULL;
ALTER TABLE public.despesa_categorias ADD CONSTRAINT despesa_categorias_nome_key UNIQUE (nome);
ALTER TABLE public.despesa_categorias ADD CONSTRAINT despesa_categorias_pkey PRIMARY KEY (id);
ALTER TABLE public.devolucao_anexos ADD CONSTRAINT devolucao_anexos_pkey PRIMARY KEY (id);
ALTER TABLE public.devolucao_anexos ADD CONSTRAINT devolucao_anexos_devolucao_id_fkey FOREIGN KEY (devolucao_id) REFERENCES devolucoes(id) ON DELETE CASCADE;
ALTER TABLE public.devolucoes ADD CONSTRAINT devolucoes_pkey PRIMARY KEY (id);
ALTER TABLE public.devolucoes ADD CONSTRAINT devolucoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.devolucoes ADD CONSTRAINT devolucoes_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'pago'::text])));
ALTER TABLE public.director_bonus_config ADD CONSTRAINT director_bonus_config_director_id_year_key UNIQUE (director_id, year);
ALTER TABLE public.director_bonus_config ADD CONSTRAINT director_bonus_config_pkey PRIMARY KEY (id);
ALTER TABLE public.drafts ADD CONSTRAINT drafts_pkey PRIMARY KEY (id);
ALTER TABLE public.empresa_usuarios ADD CONSTRAINT empresa_usuarios_empresa_id_user_id_key UNIQUE (empresa_id, user_id);
ALTER TABLE public.empresa_usuarios ADD CONSTRAINT empresa_usuarios_pkey PRIMARY KEY (id);
ALTER TABLE public.empresa_usuarios ADD CONSTRAINT empresa_usuarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE public.empresas ADD CONSTRAINT empresas_slug_key UNIQUE (slug);
ALTER TABLE public.empresas ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);
ALTER TABLE public.empresas ADD CONSTRAINT empresas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES colaboradores(id) ON DELETE SET NULL;
ALTER TABLE public.equipamento_fotos ADD CONSTRAINT equipamento_fotos_pkey PRIMARY KEY (id);
ALTER TABLE public.equipamento_fotos ADD CONSTRAINT equipamento_fotos_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE CASCADE;
ALTER TABLE public.equipamento_fotos ADD CONSTRAINT equipamento_fotos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
ALTER TABLE public.equipamentos ADD CONSTRAINT equipamentos_pkey PRIMARY KEY (id);
ALTER TABLE public.equipamentos ADD CONSTRAINT equipamentos_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE SET NULL;
ALTER TABLE public.ferramentas ADD CONSTRAINT ferramentas_pkey PRIMARY KEY (id);
ALTER TABLE public.ferramentas ADD CONSTRAINT ferramentas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES colaboradores(id) ON DELETE SET NULL;
ALTER TABLE public.financial_config ADD CONSTRAINT financial_config_key_key UNIQUE (key);
ALTER TABLE public.financial_config ADD CONSTRAINT financial_config_pkey PRIMARY KEY (id);
ALTER TABLE public.financial_periods ADD CONSTRAINT financial_periods_pkey PRIMARY KEY (id);
ALTER TABLE public.fornecedores ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (id);
ALTER TABLE public.goals ADD CONSTRAINT goals_pkey PRIMARY KEY (id);
ALTER TABLE public.goals ADD CONSTRAINT goals_period_id_fkey FOREIGN KEY (period_id) REFERENCES financial_periods(id) ON DELETE CASCADE;
ALTER TABLE public.historico_alteracoes ADD CONSTRAINT historico_alteracoes_pkey PRIMARY KEY (id);
ALTER TABLE public.hubla_webhook_events ADD CONSTRAINT unique_smart_installment_event UNIQUE (smart_installment_id, event_type, status);
ALTER TABLE public.hubla_webhook_events ADD CONSTRAINT hubla_webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.lancamento_anexos ADD CONSTRAINT lancamento_anexos_pkey PRIMARY KEY (id);
ALTER TABLE public.lancamento_anexos ADD CONSTRAINT lancamento_anexos_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES lancamentos_empresa(id) ON DELETE CASCADE;
ALTER TABLE public.lancamentos_auditoria ADD CONSTRAINT lancamentos_auditoria_pkey PRIMARY KEY (id);
ALTER TABLE public.lancamentos_empresa ADD CONSTRAINT lancamentos_empresa_pkey PRIMARY KEY (id);
ALTER TABLE public.lancamentos_empresa ADD CONSTRAINT lancamentos_empresa_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE public.lancamentos_empresa ADD CONSTRAINT lancamentos_empresa_recorrencia_id_fkey FOREIGN KEY (recorrencia_id) REFERENCES recorrencias_lancamento(id) ON DELETE SET NULL;
ALTER TABLE public.lancamentos_empresa ADD CONSTRAINT lancamentos_empresa_status_check CHECK ((status = ANY (ARRAY['previsto'::text, 'realizado'::text])));
ALTER TABLE public.lancamentos_empresa ADD CONSTRAINT lancamentos_empresa_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text])));
ALTER TABLE public.marvee_category_mapping ADD CONSTRAINT marvee_category_mapping_marvee_category_structure_key UNIQUE (marvee_category_structure);
ALTER TABLE public.marvee_category_mapping ADD CONSTRAINT marvee_category_mapping_marvee_cost_center_id_key UNIQUE (marvee_cost_center_id);
ALTER TABLE public.marvee_category_mapping ADD CONSTRAINT marvee_category_mapping_pkey PRIMARY KEY (id);
ALTER TABLE public.marvee_category_mapping ADD CONSTRAINT marvee_category_mapping_cash_flow_category_code_fkey FOREIGN KEY (cash_flow_category_code) REFERENCES cash_flow_categories(code);
ALTER TABLE public.marvee_extrato ADD CONSTRAINT marvee_extrato_guid_unique UNIQUE (guid);
ALTER TABLE public.marvee_extrato ADD CONSTRAINT marvee_extrato_pkey PRIMARY KEY (id);
ALTER TABLE public.marvee_extrato_consolidated_months ADD CONSTRAINT marvee_extrato_consolidated_months_pkey PRIMARY KEY (month);
ALTER TABLE public.marvee_sync_logs ADD CONSTRAINT marvee_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.marvee_transactions ADD CONSTRAINT marvee_transactions_unique_key UNIQUE (marvee_id, source_type, status, installment);
ALTER TABLE public.marvee_transactions ADD CONSTRAINT marvee_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.materiais ADD CONSTRAINT materiais_pkey PRIMARY KEY (id);
ALTER TABLE public.material_itens ADD CONSTRAINT material_itens_pkey PRIMARY KEY (id);
ALTER TABLE public.material_itens ADD CONSTRAINT material_itens_material_id_fkey FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE;
ALTER TABLE public.modelos_contrato ADD CONSTRAINT modelos_contrato_pkey PRIMARY KEY (id);
ALTER TABLE public.monthly_planning ADD CONSTRAINT monthly_planning_month_key UNIQUE (month);
ALTER TABLE public.monthly_planning ADD CONSTRAINT monthly_planning_pkey PRIMARY KEY (id);
ALTER TABLE public.monthly_targets ADD CONSTRAINT monthly_targets_month_key UNIQUE (month);
ALTER TABLE public.monthly_targets ADD CONSTRAINT monthly_targets_pkey PRIMARY KEY (id);
ALTER TABLE public.nota_fiscal_anexos ADD CONSTRAINT nota_fiscal_anexos_pkey PRIMARY KEY (id);
ALTER TABLE public.nota_fiscal_anexos ADD CONSTRAINT nota_fiscal_anexos_nota_fiscal_id_fkey FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE;
ALTER TABLE public.notas_fiscais ADD CONSTRAINT notas_fiscais_pkey PRIMARY KEY (id);
ALTER TABLE public.notas_fiscais ADD CONSTRAINT notas_fiscais_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notas_fiscais ADD CONSTRAINT notas_fiscais_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'pago'::text])));
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.parcelamento_dashboard_data ADD CONSTRAINT parcelamento_dashboard_data_card_name_key UNIQUE (card_name);
ALTER TABLE public.parcelamento_dashboard_data ADD CONSTRAINT parcelamento_dashboard_data_pkey PRIMARY KEY (id);
ALTER TABLE public.produtos_servicos ADD CONSTRAINT produtos_servicos_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_chave_pix_check CHECK ((tipo_chave_pix = ANY (ARRAY['CPF'::text, 'CNPJ'::text, 'Email'::text, 'Telefone'::text, 'Aleatória'::text])));
ALTER TABLE public.recebimentos ADD CONSTRAINT recebimentos_pkey PRIMARY KEY (id);
ALTER TABLE public.recebimentos ADD CONSTRAINT recebimentos_conta_receber_id_fkey FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id) ON DELETE CASCADE;
ALTER TABLE public.recorrencia_geracoes ADD CONSTRAINT recorrencia_geracoes_recorrencia_id_mes_referencia_key UNIQUE (recorrencia_id, mes_referencia);
ALTER TABLE public.recorrencia_geracoes ADD CONSTRAINT recorrencia_geracoes_pkey PRIMARY KEY (id);
ALTER TABLE public.recorrencia_geracoes ADD CONSTRAINT recorrencia_geracoes_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES lancamentos_empresa(id) ON DELETE SET NULL;
ALTER TABLE public.recorrencia_geracoes ADD CONSTRAINT recorrencia_geracoes_recorrencia_id_fkey FOREIGN KEY (recorrencia_id) REFERENCES recorrencias_lancamento(id) ON DELETE CASCADE;
ALTER TABLE public.recorrencias_lancamento ADD CONSTRAINT recorrencias_lancamento_pkey PRIMARY KEY (id);
ALTER TABLE public.recorrencias_lancamento ADD CONSTRAINT recorrencias_lancamento_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.recorrencias_lancamento ADD CONSTRAINT recorrencias_lancamento_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE public.recorrencias_lancamento ADD CONSTRAINT recorrencias_lancamento_dia_vencimento_check CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31)));
ALTER TABLE public.recorrencias_lancamento ADD CONSTRAINT recorrencias_lancamento_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text])));
ALTER TABLE public.reembolso_anexos ADD CONSTRAINT reembolso_anexos_pkey PRIMARY KEY (id);
ALTER TABLE public.reembolso_anexos ADD CONSTRAINT reembolso_anexos_reembolso_id_fkey FOREIGN KEY (reembolso_id) REFERENCES reembolsos(id) ON DELETE CASCADE;
ALTER TABLE public.reembolsos ADD CONSTRAINT reembolsos_pkey PRIMARY KEY (id);
ALTER TABLE public.reembolsos ADD CONSTRAINT reembolsos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reembolsos ADD CONSTRAINT reembolsos_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'pago'::text])));
ALTER TABLE public.sales_target_monthly ADD CONSTRAINT sales_target_monthly_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_target_monthly ADD CONSTRAINT sales_target_monthly_sales_target_id_fkey FOREIGN KEY (sales_target_id) REFERENCES sales_targets(id) ON DELETE CASCADE;
ALTER TABLE public.sales_targets ADD CONSTRAINT sales_targets_pkey PRIMARY KEY (id);
ALTER TABLE public.sales_targets ADD CONSTRAINT sales_targets_period_id_fkey FOREIGN KEY (period_id) REFERENCES financial_periods(id) ON DELETE CASCADE;
ALTER TABLE public.scenarios ADD CONSTRAINT scenarios_pkey PRIMARY KEY (id);
ALTER TABLE public.scenarios ADD CONSTRAINT scenarios_period_id_fkey FOREIGN KEY (period_id) REFERENCES financial_periods(id) ON DELETE CASCADE;
ALTER TABLE public.security_scan_status ADD CONSTRAINT security_scan_status_pkey PRIMARY KEY (id);
ALTER TABLE public.solicitacoes_baixa_cerbro ADD CONSTRAINT solicitacoes_baixa_cerbro_pkey PRIMARY KEY (id);
ALTER TABLE public.solicitacoes_contrato ADD CONSTRAINT solicitacoes_contrato_pkey PRIMARY KEY (id);
ALTER TABLE public.solicitacoes_mensagem ADD CONSTRAINT solicitacoes_mensagem_pkey PRIMARY KEY (id);
ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.transaction_categories ADD CONSTRAINT transaction_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES transaction_categories(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_period_id_fkey FOREIGN KEY (period_id) REFERENCES financial_periods(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_pkey PRIMARY KEY (id);
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES colaboradores(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_contatos ADD CONSTRAINT whatsapp_contatos_telefone_key UNIQUE (telefone);
ALTER TABLE public.whatsapp_contatos ADD CONSTRAINT whatsapp_contatos_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_contatos ADD CONSTRAINT whatsapp_contatos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_contatos ADD CONSTRAINT whatsapp_contatos_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_conversa_estado ADD CONSTRAINT whatsapp_conversa_estado_pkey PRIMARY KEY (telefone);
ALTER TABLE public.whatsapp_conversas ADD CONSTRAINT whatsapp_conversas_telefone_key UNIQUE (telefone);
ALTER TABLE public.whatsapp_conversas ADD CONSTRAINT whatsapp_conversas_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_conversas ADD CONSTRAINT whatsapp_conversas_contato_id_fkey FOREIGN KEY (contato_id) REFERENCES whatsapp_contatos(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_conversas ADD CONSTRAINT whatsapp_conversas_instancia_id_fkey FOREIGN KEY (instancia_id) REFERENCES whatsapp_instancias(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_envios ADD CONSTRAINT whatsapp_envios_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_envios ADD CONSTRAINT whatsapp_envios_instancia_id_fkey FOREIGN KEY (instancia_id) REFERENCES whatsapp_instancias(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_instancias ADD CONSTRAINT whatsapp_instancias_nome_key UNIQUE (nome);
ALTER TABLE public.whatsapp_instancias ADD CONSTRAINT whatsapp_instancias_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_instancias ADD CONSTRAINT whatsapp_instancias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_mensagens ADD CONSTRAINT whatsapp_mensagens_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_mensagens ADD CONSTRAINT whatsapp_mensagens_contato_id_fkey FOREIGN KEY (contato_id) REFERENCES whatsapp_contatos(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_mensagens ADD CONSTRAINT whatsapp_mensagens_conversa_id_fkey FOREIGN KEY (conversa_id) REFERENCES whatsapp_conversas(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_mensagens ADD CONSTRAINT whatsapp_mensagens_instancia_id_fkey FOREIGN KEY (instancia_id) REFERENCES whatsapp_instancias(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_mensagens ADD CONSTRAINT whatsapp_mensagens_lancamento_id_fkey FOREIGN KEY (lancamento_id) REFERENCES lancamentos_empresa(id) ON DELETE SET NULL;
ALTER TABLE public.whatsapp_numeros_autorizados ADD CONSTRAINT whatsapp_numeros_autorizados_telefone_key UNIQUE (telefone);
ALTER TABLE public.whatsapp_numeros_autorizados ADD CONSTRAINT whatsapp_numeros_autorizados_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_numeros_autorizados ADD CONSTRAINT whatsapp_numeros_autorizados_empresa_padrao_id_fkey FOREIGN KEY (empresa_padrao_id) REFERENCES empresas(id) ON DELETE SET NULL;

-- ===== INDICES =====
CREATE INDEX idx_cash_flow_categories_parent ON public.cash_flow_categories USING btree (parent_code);
CREATE INDEX idx_cash_flow_categories_sort ON public.cash_flow_categories USING btree (sort_order);
CREATE INDEX idx_cash_flow_data_category ON public.cash_flow_data USING btree (category_code);
CREATE INDEX idx_cash_flow_data_month ON public.cash_flow_data USING btree (month);
CREATE INDEX idx_detailed_category ON public.cash_flow_data_detailed USING btree (marvee_category_structure);
CREATE INDEX idx_detailed_month ON public.cash_flow_data_detailed USING btree (month);
CREATE INDEX idx_detailed_source_type ON public.cash_flow_data_detailed USING btree (source_type);
CREATE INDEX idx_cash_flow_expenses_category ON public.cash_flow_expenses USING btree (category_structure);
CREATE INDEX idx_cash_flow_expenses_month ON public.cash_flow_expenses USING btree (month);
CREATE INDEX idx_cash_flow_revenues_category ON public.cash_flow_revenues USING btree (category_structure);
CREATE INDEX idx_cash_flow_revenues_month ON public.cash_flow_revenues USING btree (month);
CREATE INDEX idx_colaboradores_ativo ON public.colaboradores USING btree (ativo);
CREATE INDEX idx_colaboradores_email ON public.colaboradores USING btree (email);
CREATE INDEX idx_colaboradores_user_id ON public.colaboradores USING btree (user_id);
CREATE INDEX idx_contas_pagar_venc ON public.contas_pagar USING btree (data_vencimento, status);
CREATE INDEX idx_contas_receber_venc ON public.contas_receber USING btree (data_vencimento, status);
CREATE INDEX idx_devolucao_anexos_devolucao_id ON public.devolucao_anexos USING btree (devolucao_id);
CREATE INDEX idx_drafts_type ON public.drafts USING btree (type);
CREATE INDEX idx_drafts_user_id ON public.drafts USING btree (user_id);
CREATE UNIQUE INDEX idx_drafts_user_type ON public.drafts USING btree (user_id, type);
CREATE INDEX idx_hubla_events_created ON public.hubla_webhook_events USING btree (created_at DESC);
CREATE INDEX idx_hubla_events_payer ON public.hubla_webhook_events USING btree (payer_email);
CREATE INDEX idx_hubla_events_processed ON public.hubla_webhook_events USING btree (processed) WHERE (processed = false);
CREATE INDEX idx_hubla_events_status ON public.hubla_webhook_events USING btree (status);
CREATE INDEX idx_hubla_events_type ON public.hubla_webhook_events USING btree (event_type);
CREATE INDEX idx_lancamento_anexos_lancamento ON public.lancamento_anexos USING btree (lancamento_id);
CREATE INDEX idx_lancamentos_auditoria_created_at ON public.lancamentos_auditoria USING btree (created_at DESC);
CREATE INDEX idx_lancamentos_auditoria_lancamento ON public.lancamentos_auditoria USING btree (lancamento_id);
CREATE INDEX idx_lancamentos_empresa_emp_data ON public.lancamentos_empresa USING btree (empresa_id, data_competencia);
CREATE INDEX idx_marvee_extrato_consolidated ON public.marvee_extrato USING btree (consolidated);
CREATE INDEX idx_marvee_extrato_month ON public.marvee_extrato USING btree (month);
CREATE INDEX idx_marvee_extrato_movement_date ON public.marvee_extrato USING btree (movement_date);
CREATE INDEX idx_marvee_extrato_source ON public.marvee_extrato USING btree (source);
CREATE INDEX idx_marvee_extrato_type_column ON public.marvee_extrato USING btree (type_column);
CREATE INDEX idx_marvee_transactions_generation_date ON public.marvee_transactions USING btree (generation_date);
CREATE INDEX idx_marvee_tx_cat3 ON public.marvee_transactions USING btree (category_level_3_structure);
CREATE INDEX idx_marvee_tx_doc ON public.marvee_transactions USING btree (document_number);
CREATE INDEX idx_marvee_tx_expiration ON public.marvee_transactions USING btree (expiration_date);
CREATE INDEX idx_marvee_tx_payment ON public.marvee_transactions USING btree (payment_date);
CREATE INDEX idx_marvee_tx_source ON public.marvee_transactions USING btree (source_type);
CREATE INDEX idx_marvee_tx_status ON public.marvee_transactions USING btree (status);
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_reembolso_anexos_reembolso_id ON public.reembolso_anexos USING btree (reembolso_id);
CREATE INDEX idx_baixa_cerbro_user ON public.solicitacoes_baixa_cerbro USING btree (user_id);
CREATE INDEX idx_solic_mensagem_user ON public.solicitacoes_mensagem USING btree (user_id);
CREATE INDEX idx_whatsapp_mensagens_created_at ON public.whatsapp_mensagens USING btree (created_at DESC);

-- ===== FUNCOES =====

CREATE OR REPLACE FUNCTION public.add_business_days(start_date date, days_to_add integer)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result_date DATE := start_date;
  days_added INTEGER := 0;
  day_of_week INTEGER;
BEGIN
  WHILE days_added < days_to_add LOOP
    result_date := result_date + INTERVAL '1 day';
    day_of_week := EXTRACT(DOW FROM result_date);
    
    -- Pula fins de semana (0 = domingo, 6 = sábado)
    IF day_of_week NOT IN (0, 6) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  
  RETURN result_date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.aggregate_raw_to_detailed(p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(processed bigint, created bigint, updated bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_processed BIGINT := 0;
BEGIN
  -- Upsert agregando dados raw para detailed
  -- IMPORTANTE: Exclui registros "pending" duplicados quando existe "paid" para o mesmo marvee_id
  WITH deduped_transactions AS (
    -- Selecionar transações, excluindo "pending" quando existe "paid" para o mesmo lançamento
    SELECT mt.*
    FROM marvee_transactions mt
    WHERE NOT EXISTS (
      -- Excluir registro "pending" se existir "paid" para o mesmo marvee_id/source_type/installment
      SELECT 1 
      FROM marvee_transactions mt2
      WHERE mt2.marvee_id = mt.marvee_id
        AND mt2.source_type = mt.source_type
        AND mt2.installment = mt.installment
        AND mt2.status = 'paid'
        AND mt.status = 'pending'
    )
  ),
  aggregated AS (
    SELECT 
      TO_CHAR(COALESCE(mt.payment_date, mt.expiration_date)::DATE, 'YYYY-MM') as agg_month,
      mt.category_level_3_structure as marvee_cat_structure,
      MAX(mt.category_level_3_description) as marvee_cat_description,
      mt.source_type as src_type,
      -- REALIZADO: 
      -- 1) tem payment_date e data <= hoje, OU
      -- 2) payment_date é NULL mas expiration_date <= hoje (já venceu = considerado pago)
      SUM(CASE 
        WHEN mt.payment_date IS NOT NULL AND mt.payment_date::DATE <= CURRENT_DATE 
          THEN mt.movement_value 
        WHEN mt.payment_date IS NULL AND mt.expiration_date IS NOT NULL 
          AND mt.expiration_date::DATE <= CURRENT_DATE 
          THEN mt.movement_value 
        ELSE 0 
      END) as real_value,
      -- PROJETADO:
      -- 1) payment_date > hoje, OU
      -- 2) payment_date NULL e expiration_date > hoje ou NULL
      SUM(CASE 
        WHEN mt.payment_date IS NOT NULL AND mt.payment_date::DATE > CURRENT_DATE 
          THEN mt.movement_value 
        WHEN mt.payment_date IS NULL AND (mt.expiration_date IS NULL 
          OR mt.expiration_date::DATE > CURRENT_DATE) 
          THEN mt.movement_value 
        ELSE 0 
      END) as proj_value
    FROM deduped_transactions mt
    WHERE mt.category_level_3_structure IS NOT NULL
      AND COALESCE(mt.payment_date, mt.expiration_date) IS NOT NULL
      AND (p_year IS NULL OR EXTRACT(YEAR FROM COALESCE(mt.payment_date, mt.expiration_date)::DATE) = p_year)
    GROUP BY 
      TO_CHAR(COALESCE(mt.payment_date, mt.expiration_date)::DATE, 'YYYY-MM'),
      mt.category_level_3_structure,
      mt.source_type
  ),
  upserted AS (
    INSERT INTO cash_flow_data_detailed (
      month, marvee_category_structure, marvee_category_description,
      source_type, realized_value, projected_value, synced_at
    )
    SELECT 
      agg_month, marvee_cat_structure, marvee_cat_description,
      src_type, real_value, proj_value, NOW()
    FROM aggregated
    ON CONFLICT (month, marvee_category_structure, source_type)
    DO UPDATE SET
      marvee_category_description = EXCLUDED.marvee_category_description,
      realized_value = EXCLUDED.realized_value,
      projected_value = EXCLUDED.projected_value,
      synced_at = NOW(),
      updated_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_processed FROM upserted;
  
  RETURN QUERY SELECT v_processed, v_processed, 0::BIGINT;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calcular_data_prevista_devolucao(data_solicitacao timestamp with time zone)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Converte para timezone de Brasília antes de extrair a data
  -- Depois adiciona 5 dias úteis (excluindo finais de semana)
  RETURN add_business_days(
    (data_solicitacao AT TIME ZONE 'America/Sao_Paulo')::date, 
    5
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calcular_data_prevista_reembolso(data_solicitacao timestamp with time zone)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Pega o primeiro dia do mês seguinte e adiciona 9 dias para chegar ao dia 10
  RETURN (DATE_TRUNC('month', data_solicitacao) + INTERVAL '1 month' + INTERVAL '9 days')::date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_manage_finance(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'finance'::app_role)
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_finance(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'finance'::app_role)
      OR public.has_role(_user_id, 'finance_viewer'::app_role)
      OR public.has_role(_user_id, 'admin_viewer'::app_role)
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_action text, p_title text, p_message text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO notifications (user_id, type, action, title, message, reference_id)
  VALUES (p_user_id, p_type, p_action, p_title, p_message, p_reference_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_budget_vs_actual(p_start_date date, p_end_date date)
 RETURNS TABLE(month text, receita_prevista numeric, receita_realizada numeric, receita_meta numeric, despesa_prevista numeric, despesa_realizada numeric, despesa_meta numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH previsto AS (
    SELECT
      TO_CHAR(me.movement_date, 'YYYY-MM') as mes,
      SUM(CASE WHEN me.type_sign = 1 THEN me.movement_value ELSE 0 END) as rec_prev,
      SUM(CASE WHEN me.type_sign = -1 THEN me.movement_value ELSE 0 END) as desp_prev
    FROM marvee_extrato me
    WHERE me.movement_date >= p_start_date
      AND me.movement_date <= p_end_date
      AND me.type_column = 'previsto'
      AND me.source IN ('bills_to_receive', 'bills_to_pay')
    GROUP BY TO_CHAR(me.movement_date, 'YYYY-MM')
  ),
  realizado AS (
    SELECT
      TO_CHAR(me.movement_date, 'YYYY-MM') as mes,
      SUM(CASE WHEN me.type_sign = 1 THEN me.movement_value ELSE 0 END) as rec_real,
      SUM(CASE WHEN me.type_sign = -1 THEN me.movement_value ELSE 0 END) as desp_real
    FROM marvee_extrato me
    WHERE me.movement_date >= p_start_date
      AND me.movement_date <= p_end_date
      AND me.type_column = 'realizado'
      AND me.source IN ('bills_to_receive', 'bills_to_pay')
    GROUP BY TO_CHAR(me.movement_date, 'YYYY-MM')
  ),
  meta AS (
    SELECT
      TO_CHAR(mp.month, 'YYYY-MM') as mes,
      COALESCE(mp.revenue, 0) as rec_meta,
      COALESCE(mp.expense, 0) as desp_meta
    FROM monthly_planning mp
    WHERE mp.month >= p_start_date
      AND mp.month <= p_end_date
  ),
  all_months AS (
    SELECT DISTINCT mes FROM (
      SELECT mes FROM previsto
      UNION
      SELECT mes FROM realizado
      UNION
      SELECT mes FROM meta
    ) sub
  )
  SELECT
    am.mes as month,
    COALESCE(p.rec_prev, 0) as receita_prevista,
    COALESCE(r.rec_real, 0) as receita_realizada,
    COALESCE(m.rec_meta, 0) as receita_meta,
    COALESCE(p.desp_prev, 0) as despesa_prevista,
    COALESCE(r.desp_real, 0) as despesa_realizada,
    COALESCE(m.desp_meta, 0) as despesa_meta
  FROM all_months am
  LEFT JOIN previsto p ON p.mes = am.mes
  LEFT JOIN realizado r ON r.mes = am.mes
  LEFT JOIN meta m ON m.mes = am.mes
  ORDER BY am.mes;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_initial_balance_from_extrato(p_cutoff_date date)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_saldo numeric;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type_sign = 1 THEN movement_value ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN type_sign = -1 THEN movement_value ELSE 0 END), 0)
  INTO v_saldo
  FROM marvee_extrato
  WHERE movement_date < p_cutoff_date
    AND source IN ('bills_to_receive', 'bills_to_pay')
    AND type_column = 'realizado';

  RETURN COALESCE(v_saldo, 0);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lancamentos_vencidos()
 RETURNS TABLE(id uuid, empresa_id uuid, empresa_nome text, descricao text, valor numeric, data_competencia date, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT l.id, l.empresa_id, e.nome as empresa_nome, l.descricao, l.valor, l.data_competencia, l.status
  FROM public.lancamentos_empresa l
  JOIN public.empresas e ON e.id = l.empresa_id
  WHERE l.tipo = 'despesa'
    AND l.status != 'realizado'
    AND l.data_competencia < CURRENT_DATE;
$function$
;

CREATE OR REPLACE FUNCTION public.get_monthly_cash_flow(p_start_date date, p_end_date date)
 RETURNS TABLE(month text, total_receitas numeric, total_despesas numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.month,
    SUM(CASE WHEN e.type_sign = 1 THEN e.movement_value ELSE 0 END) as total_receitas,
    SUM(CASE WHEN e.type_sign = -1 THEN e.movement_value ELSE 0 END) as total_despesas
  FROM marvee_extrato e
  WHERE e.movement_date >= p_start_date
    AND e.movement_date <= p_end_date
    AND e.type_column = 'realizado'
    AND e.source IN ('bills_to_receive', 'bills_to_pay')
  GROUP BY e.month
  ORDER BY e.month;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_notas_fiscais_mes()
 RETURNS TABLE(id uuid, user_id uuid, nome text, email text, valor numeric, created_at timestamp with time zone, periodo_referencia text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    nf.id,
    nf.user_id,
    nf.nome,
    au.email::text,
    nf.valor,
    nf.created_at,
    nf.periodo_referencia
  FROM public.notas_fiscais nf
  LEFT JOIN auth.users au ON nf.user_id = au.id
  WHERE nf.created_at >= date_trunc('month', CURRENT_DATE)
    AND nf.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  ORDER BY nf.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_admin_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Adiciona role de admin para ambos emails da Camila
  IF NEW.email IN ('camila.adegas@viverdeia.ai', 'camila.adegas@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_first_access()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*) = 0 FROM colaboradores;
$function$
;

CREATE OR REPLACE FUNCTION public.log_historico_alteracoes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico_alteracoes (tabela, registro_id, acao, valor_novo, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'created', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.historico_alteracoes (tabela, registro_id, acao, valor_anterior, valor_novo, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.historico_alteracoes (tabela, registro_id, acao, valor_anterior, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_lancamento_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lancamentos_auditoria (lancamento_id, empresa_id, acao, descricao, valor_novo, changed_by)
    VALUES (NEW.id, NEW.empresa_id, 'created', NEW.descricao, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.lancamentos_auditoria (lancamento_id, empresa_id, acao, descricao, valor_anterior, valor_novo, changed_by)
    VALUES (NEW.id, NEW.empresa_id, 'updated', NEW.descricao, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.lancamentos_auditoria (lancamento_id, empresa_id, acao, descricao, valor_anterior, changed_by)
    VALUES (OLD.id, OLD.empresa_id, 'deleted', OLD.descricao, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_contrato_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action, reference_id)
  SELECT c.user_id, 'Nova Solicitação de Contrato',
    'Uma nova solicitação de contrato para ' || NEW.nome || ' foi criada.',
    'contrato', 'created', NEW.id
  FROM public.colaboradores c
  WHERE c.is_admin = true AND c.user_id IS NOT NULL AND c.ativo = true;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_contrato_status_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('aprovado', 'rejeitado') THEN
    INSERT INTO public.notifications (user_id, title, message, type, action, reference_id)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'aprovado' THEN 'Contrato Aprovado' ELSE 'Contrato Rejeitado' END,
      CASE WHEN NEW.status = 'aprovado'
        THEN 'Sua solicitação de contrato para ' || NEW.nome || ' foi aprovada.'
        ELSE 'Sua solicitação de contrato para ' || NEW.nome || ' foi rejeitada.' || COALESCE(' Motivo: ' || NEW.status_comentario, '')
      END,
      'contrato',
      NEW.status,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_devolucao_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'devolucao',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Devolução Aprovada'
        WHEN NEW.status = 'rejeitado' THEN 'Devolução Rejeitada'
        WHEN NEW.status = 'pago' THEN 'Devolução Paga'
        ELSE 'Devolução Atualizada'
      END,
      CASE 
        WHEN NEW.status = 'rejeitado' AND NEW.status_comentario IS NOT NULL 
          THEN 'Sua devolução de R$ ' || NEW.valor || ' foi rejeitada: ' || NEW.status_comentario
        ELSE 'Sua devolução de R$ ' || NEW.valor || ' foi ' || NEW.status
      END,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'devolucao', 'created', 'Nova Devolução', 
           'Nova solicitação de devolução de ' || NEW.nome_cliente || ' - R$ ' || NEW.valor,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_material_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Notificar solicitante quando status mudar
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'material',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Material Aprovado'
        WHEN NEW.status = 'rejeitado' THEN 'Material Rejeitado'
        WHEN NEW.status = 'pago' THEN 'Material Pago'
        ELSE 'Material Atualizado'
      END,
      CASE 
        WHEN NEW.status = 'rejeitado' AND NEW.status_comentario IS NOT NULL 
          THEN 'Sua solicitação "' || NEW.material || '" foi rejeitada: ' || NEW.status_comentario
        ELSE 'Sua solicitação "' || NEW.material || '" foi ' || NEW.status
      END,
      NEW.id
    );
    
    -- Quando aprovado, notificar admins (Camila) para processar a compra
    IF NEW.status = 'aprovado' THEN
      INSERT INTO notifications (user_id, type, action, title, message, reference_id)
      SELECT c.user_id, 'material', 'approved', 'Material Pronto para Compra', 
             'Material aprovado: "' || NEW.material || '" de ' || NEW.nome_solicitante || ' - R$ ' || COALESCE(NEW.valor_total, 0),
             NEW.id
      FROM colaboradores c 
      WHERE c.is_admin = true 
        AND c.user_id IS NOT NULL
        AND c.user_id != NEW.user_id;
    END IF;
  END IF;
  
  -- Quando nova solicitação, notificar aprovadores de materiais (Sabrina)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'material', 'created', 'Nova Solicitação de Material', 
           'Nova solicitação de ' || NEW.nome_solicitante || ' - ' || NEW.material,
           NEW.id
    FROM colaboradores c 
    WHERE c.can_approve_materiais = true 
      AND c.user_id IS NOT NULL
      AND c.user_id != NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_nota_fiscal_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'nota_fiscal',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Nota Fiscal Aprovada'
        WHEN NEW.status = 'rejeitado' THEN 'Nota Fiscal Rejeitada'
        WHEN NEW.status = 'pago' THEN 'Nota Fiscal Paga'
        ELSE 'Nota Fiscal Atualizada'
      END,
      CASE 
        WHEN NEW.status = 'rejeitado' AND NEW.status_comentario IS NOT NULL 
          THEN 'Sua nota fiscal de R$ ' || NEW.valor || ' foi rejeitada: ' || NEW.status_comentario
        ELSE 'Sua nota fiscal de R$ ' || NEW.valor || ' foi ' || NEW.status
      END,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'nota_fiscal', 'created', 'Nova Nota Fiscal', 
           'Nova nota fiscal de ' || NEW.nome || ' - R$ ' || NEW.valor,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_reembolso_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'reembolso',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Reembolso Aprovado'
        WHEN NEW.status = 'rejeitado' THEN 'Reembolso Rejeitado'
        WHEN NEW.status = 'pago' THEN 'Reembolso Pago'
        ELSE 'Reembolso Atualizado'
      END,
      CASE 
        WHEN NEW.status = 'rejeitado' AND NEW.status_comentario IS NOT NULL 
          THEN 'Seu reembolso de R$ ' || NEW.valor || ' foi rejeitado: ' || NEW.status_comentario
        ELSE 'Seu reembolso de R$ ' || NEW.valor || ' foi ' || NEW.status
      END,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'reembolso', 'created', 'Novo Reembolso', 
           'Nova solicitação de reembolso de ' || NEW.nome || ' - R$ ' || NEW.valor,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.populate_cash_flow_tables(p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(expenses_count bigint, revenues_count bigint, expenses_deleted bigint, revenues_deleted bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expenses_deleted BIGINT;
  v_revenues_deleted BIGINT;
  v_expenses_count BIGINT;
  v_revenues_count BIGINT;
BEGIN
  -- Limpar tabelas (do ano específico ou todas)
  IF p_year IS NOT NULL THEN
    DELETE FROM cash_flow_expenses WHERE month LIKE p_year::TEXT || '-%';
    GET DIAGNOSTICS v_expenses_deleted = ROW_COUNT;
    
    DELETE FROM cash_flow_revenues WHERE month LIKE p_year::TEXT || '-%';
    GET DIAGNOSTICS v_revenues_deleted = ROW_COUNT;
  ELSE
    TRUNCATE cash_flow_expenses, cash_flow_revenues;
    v_expenses_deleted := 0;
    v_revenues_deleted := 0;
  END IF;

  -- Inserir DESPESAS: source_type = 'despesa' AND status = 'pending'
  INSERT INTO cash_flow_expenses (marvee_id, month, category_structure, category_description, movement_value, expiration_date, document_number, installment)
  SELECT 
    marvee_id,
    TO_CHAR(expiration_date, 'YYYY-MM'),
    category_level_3_structure,
    category_level_3_description,
    movement_value,
    expiration_date,
    document_number,
    COALESCE(installment, 1)
  FROM marvee_transactions
  WHERE source_type = 'despesa'
    AND status = 'pending'
    AND category_level_3_structure IS NOT NULL
    AND expiration_date IS NOT NULL
    AND (p_year IS NULL OR EXTRACT(YEAR FROM expiration_date) = p_year)
  ON CONFLICT (marvee_id, installment) DO UPDATE SET
    month = EXCLUDED.month,
    category_structure = EXCLUDED.category_structure,
    category_description = EXCLUDED.category_description,
    movement_value = EXCLUDED.movement_value,
    expiration_date = EXCLUDED.expiration_date,
    document_number = EXCLUDED.document_number;

  GET DIAGNOSTICS v_expenses_count = ROW_COUNT;

  -- Inserir RECEITAS: source_type = 'receita' AND status = 'paid' AND document_number NOT NULL/EMPTY
  INSERT INTO cash_flow_revenues (marvee_id, month, category_structure, category_description, movement_value, payment_date, document_number, installment)
  SELECT 
    marvee_id,
    TO_CHAR(payment_date, 'YYYY-MM'),
    category_level_3_structure,
    category_level_3_description,
    movement_value,
    payment_date,
    document_number,
    COALESCE(installment, 1)
  FROM marvee_transactions
  WHERE source_type = 'receita'
    AND status = 'paid'
    AND document_number IS NOT NULL
    AND document_number != ''
    AND category_level_3_structure IS NOT NULL
    AND payment_date IS NOT NULL
    AND (p_year IS NULL OR EXTRACT(YEAR FROM payment_date) = p_year)
  ON CONFLICT (marvee_id, installment) DO UPDATE SET
    month = EXCLUDED.month,
    category_structure = EXCLUDED.category_structure,
    category_description = EXCLUDED.category_description,
    movement_value = EXCLUDED.movement_value,
    payment_date = EXCLUDED.payment_date,
    document_number = EXCLUDED.document_number;

  GET DIAGNOSTICS v_revenues_count = ROW_COUNT;

  RETURN QUERY SELECT v_expenses_count, v_revenues_count, v_expenses_deleted, v_revenues_deleted;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.run_security_selfcheck()
 RETURNS TABLE(total_findings integer, critical_count integer, high_count integer, warn_count integer, info_count integer, scan_timestamp timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_no_rls integer;
  v_no_policy integer;
  v_public_buckets integer;
  v_critical integer;
  v_high integer;
  v_warn integer;
  v_total integer;
  v_now timestamptz := now();
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT count(*) INTO v_no_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false;

  SELECT count(*) INTO v_no_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
    AND NOT EXISTS (
      SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
    );

  SELECT count(*) INTO v_public_buckets
  FROM storage.buckets b
  WHERE b.public = true;

  v_critical := v_no_rls;
  v_high := v_no_policy;
  v_warn := v_public_buckets;
  v_total := v_critical + v_high + v_warn;

  INSERT INTO public.security_scan_status (
    total_findings, critical_count, high_count, warn_count, info_count,
    scan_timestamp, scanner_summary
  ) VALUES (
    v_total, v_critical, v_high, v_warn, 0, v_now,
    jsonb_build_object(
      'tables_without_rls', v_no_rls,
      'tables_without_policies', v_no_policy,
      'public_storage_buckets', v_public_buckets,
      'source', 'run_security_selfcheck'
    )
  );

  RETURN QUERY SELECT v_total, v_critical, v_high, v_warn, 0, v_now;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_data_prevista_devolucao()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.data_prevista_pagamento := calcular_data_prevista_devolucao(NEW.created_at);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_data_prevista_reembolso()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.data_prevista_pagamento := calcular_data_prevista_reembolso(NEW.created_at);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.setup_primeiro_admin(p_email text, p_user_id uuid, p_nome text DEFAULT 'Administrador'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_colaborador_count integer;
  v_colaborador_id uuid;
BEGIN
  -- Verificar se já existe algum colaborador
  SELECT COUNT(*) INTO v_colaborador_count FROM colaboradores;
  
  -- Se já existe colaborador, não permitir
  IF v_colaborador_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Criar primeiro colaborador como admin
  INSERT INTO colaboradores (
    nome, email, cpf, area, funcao,
    data_inicio_contrato, remuneracao,
    is_admin, ativo, has_finance_access, user_id
  ) VALUES (
    p_nome,
    p_email,
    '00000000000',
    'Administração',
    'Administrador',
    CURRENT_DATE,
    0,
    true,
    true,
    true,
    p_user_id
  )
  RETURNING id INTO v_colaborador_id;
  
  -- Criar role admin
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Criar role finance
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'finance')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_admin_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Só sincroniza se o colaborador tem user_id vinculado
  IF NEW.user_id IS NOT NULL THEN
    -- Se is_admin mudou de false para true, adicionar role
    IF NEW.is_admin = true AND (OLD.is_admin = false OR OLD.is_admin IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    -- Se is_admin mudou de true para false, remover role
    ELSIF (NEW.is_admin = false OR NEW.is_admin IS NULL) AND OLD.is_admin = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_admin_role_on_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Quando user_id é vinculado e colaborador é admin, adicionar role
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.is_admin = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_admin_viewer_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    IF NEW.has_admin_view_access = true AND 
       (OLD.has_admin_view_access = false OR OLD.has_admin_view_access IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.has_admin_view_access = false OR NEW.has_admin_view_access IS NULL) 
          AND OLD.has_admin_view_access = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'admin_viewer';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_admin_viewer_role_on_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.has_admin_view_access = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_approver_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Só sincroniza se o colaborador tem user_id vinculado
  IF NEW.user_id IS NOT NULL THEN
    -- Notas Fiscais
    IF NEW.can_approve_notas = true AND (OLD.can_approve_notas = false OR OLD.can_approve_notas IS NULL) THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_notas') ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.can_approve_notas = false OR NEW.can_approve_notas IS NULL) AND OLD.can_approve_notas = true THEN
      DELETE FROM user_roles WHERE user_id = NEW.user_id AND role = 'approver_notas';
    END IF;
    
    -- Reembolsos
    IF NEW.can_approve_reembolsos = true AND (OLD.can_approve_reembolsos = false OR OLD.can_approve_reembolsos IS NULL) THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_reembolsos') ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.can_approve_reembolsos = false OR NEW.can_approve_reembolsos IS NULL) AND OLD.can_approve_reembolsos = true THEN
      DELETE FROM user_roles WHERE user_id = NEW.user_id AND role = 'approver_reembolsos';
    END IF;
    
    -- Devoluções
    IF NEW.can_approve_devolucoes = true AND (OLD.can_approve_devolucoes = false OR OLD.can_approve_devolucoes IS NULL) THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_devolucoes') ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.can_approve_devolucoes = false OR NEW.can_approve_devolucoes IS NULL) AND OLD.can_approve_devolucoes = true THEN
      DELETE FROM user_roles WHERE user_id = NEW.user_id AND role = 'approver_devolucoes';
    END IF;
    
    -- Materiais
    IF NEW.can_approve_materiais = true AND (OLD.can_approve_materiais = false OR OLD.can_approve_materiais IS NULL) THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_materiais') ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.can_approve_materiais = false OR NEW.can_approve_materiais IS NULL) AND OLD.can_approve_materiais = true THEN
      DELETE FROM user_roles WHERE user_id = NEW.user_id AND role = 'approver_materiais';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_approver_roles_on_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.can_approve_notas = true THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_notas') ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    IF NEW.can_approve_reembolsos = true THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_reembolsos') ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    IF NEW.can_approve_devolucoes = true THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_devolucoes') ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    IF NEW.can_approve_materiais = true THEN
      INSERT INTO user_roles (user_id, role) VALUES (NEW.user_id, 'approver_materiais') ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_finance_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Só sincroniza se o colaborador tem user_id vinculado
  IF NEW.user_id IS NOT NULL THEN
    -- Se has_finance_access mudou de false para true, adicionar role
    IF NEW.has_finance_access = true AND (OLD.has_finance_access = false OR OLD.has_finance_access IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance')
      ON CONFLICT (user_id, role) DO NOTHING;
    -- Se has_finance_access mudou de true para false, remover role
    ELSIF (NEW.has_finance_access = false OR NEW.has_finance_access IS NULL) AND OLD.has_finance_access = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'finance';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_finance_role_on_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Quando user_id é vinculado e colaborador tem acesso finance, adicionar role
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.has_finance_access = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_finance_viewer_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    IF NEW.has_finance_view_access = true AND 
       (OLD.has_finance_view_access = false OR OLD.has_finance_view_access IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.has_finance_view_access = false OR NEW.has_finance_view_access IS NULL) 
          AND OLD.has_finance_view_access = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'finance_viewer';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_finance_viewer_role_on_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.has_finance_view_access = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_cron_schedule(p_job_name text, p_schedule text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron'
AS $function$
DECLARE
  v_jobid BIGINT;
BEGIN
  -- Find the job id
  SELECT jobid INTO v_jobid 
  FROM cron.job 
  WHERE jobname = p_job_name;
  
  IF v_jobid IS NULL THEN
    RAISE NOTICE 'Job % not found', p_job_name;
    RETURN FALSE;
  END IF;
  
  -- Update the schedule
  PERFORM cron.alter_job(v_jobid, schedule := p_schedule);
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validar_colaborador_signup(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_colaborador RECORD;
BEGIN
  -- Buscar colaborador pelo email
  SELECT id, ativo, user_id INTO v_colaborador
  FROM colaboradores
  WHERE lower(email) = lower(p_email);
  
  -- Colaborador não encontrado
  IF v_colaborador IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  -- Colaborador já tem conta vinculada
  IF v_colaborador.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_registered');
  END IF;
  
  -- Colaborador está inativo
  IF NOT COALESCE(v_colaborador.ativo, false) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'inactive');
  END IF;
  
  -- Tudo ok, pode se cadastrar
  RETURN jsonb_build_object('valid', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.vincular_user_colaborador(p_colaborador_email text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_colaborador_id uuid;
  v_user_email text;
  v_is_admin boolean;
BEGIN
  -- Buscar email do usuário autenticado
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Verificar se os emails correspondem (segurança!)
  IF lower(p_colaborador_email) != lower(v_user_email) THEN
    RAISE EXCEPTION 'Email não corresponde';
  END IF;
  
  -- Buscar colaborador com esse email que ainda não tem user_id
  SELECT id, is_admin INTO v_colaborador_id, v_is_admin
  FROM colaboradores
  WHERE lower(email) = lower(p_colaborador_email) 
    AND user_id IS NULL;
  
  IF v_colaborador_id IS NULL THEN
    RETURN false; -- Colaborador não encontrado ou já vinculado
  END IF;
  
  -- Vincular user_id ao colaborador
  UPDATE colaboradores
  SET user_id = p_user_id
  WHERE id = v_colaborador_id;
  
  -- Se colaborador é admin, criar role em user_roles
  IF v_is_admin = true THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN true;
END;
$function$
;

-- ===== VIEWS =====

CREATE OR REPLACE VIEW public.cash_flow_detailed_view AS
 SELECT cash_flow_expenses.month,
    cash_flow_expenses.category_structure,
    max(cash_flow_expenses.category_description) AS category_description,
    'despesa'::text AS source_type,
    sum(cash_flow_expenses.movement_value) AS total_value,
    count(*) AS transaction_count
   FROM cash_flow_expenses
  GROUP BY cash_flow_expenses.month, cash_flow_expenses.category_structure
UNION ALL
 SELECT cash_flow_revenues.month,
    cash_flow_revenues.category_structure,
    max(cash_flow_revenues.category_description) AS category_description,
    'receita'::text AS source_type,
    sum(cash_flow_revenues.movement_value) AS total_value,
    count(*) AS transaction_count
   FROM cash_flow_revenues
  GROUP BY cash_flow_revenues.month, cash_flow_revenues.category_structure;

-- ===== TRIGGERS =====
CREATE TRIGGER trg_upd_automacoes BEFORE UPDATE ON public.automacoes_regras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_config_updated_at BEFORE UPDATE ON public.automation_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_flow_data_updated_at BEFORE UPDATE ON public.cash_flow_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_flow_data_detailed_updated_at BEFORE UPDATE ON public.cash_flow_data_detailed FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_centros_custo BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_cliente_contratos BEFORE UPDATE ON public.cliente_contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_hist_clientes AFTER INSERT OR DELETE OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION log_historico_alteracoes();
CREATE TRIGGER trg_upd_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_colaborador_notas_updated_at BEFORE UPDATE ON public.colaborador_notas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER handle_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER on_colaborador_admin_viewer_change AFTER UPDATE OF has_admin_view_access ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_admin_viewer_role();
CREATE TRIGGER on_colaborador_finance_viewer_change AFTER UPDATE OF has_finance_view_access ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_finance_viewer_role();
CREATE TRIGGER on_colaborador_link_admin_viewer AFTER UPDATE OF user_id ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_admin_viewer_role_on_link();
CREATE TRIGGER on_colaborador_link_finance_viewer AFTER UPDATE OF user_id ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_finance_viewer_role_on_link();
CREATE TRIGGER sync_approver_roles_on_link_trigger AFTER UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_approver_roles_on_link();
CREATE TRIGGER sync_approver_roles_trigger AFTER UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_approver_roles();
CREATE TRIGGER trigger_sync_admin_role AFTER UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_admin_role();
CREATE TRIGGER trigger_sync_admin_role_on_link AFTER UPDATE ON public.colaboradores FOR EACH ROW WHEN ((old.user_id IS DISTINCT FROM new.user_id)) EXECUTE FUNCTION sync_admin_role_on_link();
CREATE TRIGGER trigger_sync_finance_role AFTER UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION sync_finance_role();
CREATE TRIGGER trigger_sync_finance_role_on_link AFTER UPDATE ON public.colaboradores FOR EACH ROW WHEN ((old.user_id IS DISTINCT FROM new.user_id)) EXECUTE FUNCTION sync_finance_role_on_link();
CREATE TRIGGER trg_hist_contas_pagar AFTER INSERT OR DELETE OR UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION log_historico_alteracoes();
CREATE TRIGGER trg_upd_contas_pagar BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_hist_contas_receber AFTER INSERT OR DELETE OR UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION log_historico_alteracoes();
CREATE TRIGGER trg_upd_contas_receber BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER devolucao_notification_trigger AFTER INSERT OR UPDATE ON public.devolucoes FOR EACH ROW EXECUTE FUNCTION notify_devolucao_change();
CREATE TRIGGER trigger_set_data_prevista_devolucao BEFORE INSERT ON public.devolucoes FOR EACH ROW EXECUTE FUNCTION set_data_prevista_devolucao();
CREATE TRIGGER update_devolucoes_updated_at BEFORE UPDATE ON public.devolucoes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_director_bonus_config_updated_at BEFORE UPDATE ON public.director_bonus_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON public.drafts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_upd_empresa_usuarios BEFORE UPDATE ON public.empresa_usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_empresas BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_ferramentas_updated_at BEFORE UPDATE ON public.ferramentas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_config_updated_at BEFORE UPDATE ON public.financial_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_periods_updated_at BEFORE UPDATE ON public.financial_periods FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_upd_fornecedores BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_lancamento_audit AFTER INSERT OR DELETE OR UPDATE ON public.lancamentos_empresa FOR EACH ROW EXECUTE FUNCTION log_lancamento_audit();
CREATE TRIGGER trg_lancamentos_empresa_updated_at BEFORE UPDATE ON public.lancamentos_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marvee_category_mapping_updated_at BEFORE UPDATE ON public.marvee_category_mapping FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER material_notification_trigger AFTER INSERT OR UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION notify_material_change();
CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_modelos_contrato_updated_at BEFORE UPDATE ON public.modelos_contrato FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_planning_updated_at BEFORE UPDATE ON public.monthly_planning FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_monthly_targets_updated_at BEFORE UPDATE ON public.monthly_targets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER nota_fiscal_notification_trigger AFTER INSERT OR UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION notify_nota_fiscal_change();
CREATE TRIGGER update_notas_fiscais_updated_at BEFORE UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_upd_produtos BEFORE UPDATE ON public.produtos_servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_recorrencias_lancamento_updated_at BEFORE UPDATE ON public.recorrencias_lancamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER reembolso_notification_trigger AFTER INSERT OR UPDATE ON public.reembolsos FOR EACH ROW EXECUTE FUNCTION notify_reembolso_change();
CREATE TRIGGER trigger_set_data_prevista_reembolso BEFORE INSERT ON public.reembolsos FOR EACH ROW EXECUTE FUNCTION set_data_prevista_reembolso();
CREATE TRIGGER update_reembolsos_updated_at BEFORE UPDATE ON public.reembolsos FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_sales_target_monthly_updated_at BEFORE UPDATE ON public.sales_target_monthly FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON public.sales_targets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_baixa_cerbro BEFORE UPDATE ON public.solicitacoes_baixa_cerbro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_contrato_created AFTER INSERT ON public.solicitacoes_contrato FOR EACH ROW EXECUTE FUNCTION notify_contrato_created();
CREATE TRIGGER on_contrato_status_changed AFTER UPDATE ON public.solicitacoes_contrato FOR EACH ROW EXECUTE FUNCTION notify_contrato_status_changed();
CREATE TRIGGER update_solicitacoes_contrato_updated_at BEFORE UPDATE ON public.solicitacoes_contrato FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_solic_mensagem BEFORE UPDATE ON public.solicitacoes_mensagem FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_rules_updated_at BEFORE UPDATE ON public.tax_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_upd_veiculos BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_wa_contatos BEFORE UPDATE ON public.whatsapp_contatos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_wa_conversas BEFORE UPDATE ON public.whatsapp_conversas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_upd_wa_instancias BEFORE UPDATE ON public.whatsapp_instancias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_whatsapp_numeros_updated_at BEFORE UPDATE ON public.whatsapp_numeros_autorizados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== GRANTS =====
GRANT DELETE ON public.automacoes_execucoes TO anon;
GRANT INSERT ON public.automacoes_execucoes TO anon;
GRANT REFERENCES ON public.automacoes_execucoes TO anon;
GRANT SELECT ON public.automacoes_execucoes TO anon;
GRANT TRIGGER ON public.automacoes_execucoes TO anon;
GRANT TRUNCATE ON public.automacoes_execucoes TO anon;
GRANT UPDATE ON public.automacoes_execucoes TO anon;
GRANT DELETE ON public.automacoes_execucoes TO authenticated;
GRANT INSERT ON public.automacoes_execucoes TO authenticated;
GRANT REFERENCES ON public.automacoes_execucoes TO authenticated;
GRANT SELECT ON public.automacoes_execucoes TO authenticated;
GRANT TRIGGER ON public.automacoes_execucoes TO authenticated;
GRANT TRUNCATE ON public.automacoes_execucoes TO authenticated;
GRANT UPDATE ON public.automacoes_execucoes TO authenticated;
GRANT DELETE ON public.automacoes_execucoes TO service_role;
GRANT INSERT ON public.automacoes_execucoes TO service_role;
GRANT REFERENCES ON public.automacoes_execucoes TO service_role;
GRANT SELECT ON public.automacoes_execucoes TO service_role;
GRANT TRIGGER ON public.automacoes_execucoes TO service_role;
GRANT TRUNCATE ON public.automacoes_execucoes TO service_role;
GRANT UPDATE ON public.automacoes_execucoes TO service_role;
GRANT DELETE ON public.automacoes_regras TO anon;
GRANT INSERT ON public.automacoes_regras TO anon;
GRANT REFERENCES ON public.automacoes_regras TO anon;
GRANT SELECT ON public.automacoes_regras TO anon;
GRANT TRIGGER ON public.automacoes_regras TO anon;
GRANT TRUNCATE ON public.automacoes_regras TO anon;
GRANT UPDATE ON public.automacoes_regras TO anon;
GRANT DELETE ON public.automacoes_regras TO authenticated;
GRANT INSERT ON public.automacoes_regras TO authenticated;
GRANT REFERENCES ON public.automacoes_regras TO authenticated;
GRANT SELECT ON public.automacoes_regras TO authenticated;
GRANT TRIGGER ON public.automacoes_regras TO authenticated;
GRANT TRUNCATE ON public.automacoes_regras TO authenticated;
GRANT UPDATE ON public.automacoes_regras TO authenticated;
GRANT DELETE ON public.automacoes_regras TO service_role;
GRANT INSERT ON public.automacoes_regras TO service_role;
GRANT REFERENCES ON public.automacoes_regras TO service_role;
GRANT SELECT ON public.automacoes_regras TO service_role;
GRANT TRIGGER ON public.automacoes_regras TO service_role;
GRANT TRUNCATE ON public.automacoes_regras TO service_role;
GRANT UPDATE ON public.automacoes_regras TO service_role;
GRANT DELETE ON public.automation_config TO anon;
GRANT INSERT ON public.automation_config TO anon;
GRANT REFERENCES ON public.automation_config TO anon;
GRANT SELECT ON public.automation_config TO anon;
GRANT TRIGGER ON public.automation_config TO anon;
GRANT TRUNCATE ON public.automation_config TO anon;
GRANT UPDATE ON public.automation_config TO anon;
GRANT DELETE ON public.automation_config TO authenticated;
GRANT INSERT ON public.automation_config TO authenticated;
GRANT REFERENCES ON public.automation_config TO authenticated;
GRANT SELECT ON public.automation_config TO authenticated;
GRANT TRIGGER ON public.automation_config TO authenticated;
GRANT TRUNCATE ON public.automation_config TO authenticated;
GRANT UPDATE ON public.automation_config TO authenticated;
GRANT DELETE ON public.automation_config TO service_role;
GRANT INSERT ON public.automation_config TO service_role;
GRANT REFERENCES ON public.automation_config TO service_role;
GRANT SELECT ON public.automation_config TO service_role;
GRANT TRIGGER ON public.automation_config TO service_role;
GRANT TRUNCATE ON public.automation_config TO service_role;
GRANT UPDATE ON public.automation_config TO service_role;
GRANT DELETE ON public.cash_flow_categories TO anon;
GRANT INSERT ON public.cash_flow_categories TO anon;
GRANT REFERENCES ON public.cash_flow_categories TO anon;
GRANT SELECT ON public.cash_flow_categories TO anon;
GRANT TRIGGER ON public.cash_flow_categories TO anon;
GRANT TRUNCATE ON public.cash_flow_categories TO anon;
GRANT UPDATE ON public.cash_flow_categories TO anon;
GRANT DELETE ON public.cash_flow_categories TO authenticated;
GRANT INSERT ON public.cash_flow_categories TO authenticated;
GRANT REFERENCES ON public.cash_flow_categories TO authenticated;
GRANT SELECT ON public.cash_flow_categories TO authenticated;
GRANT TRIGGER ON public.cash_flow_categories TO authenticated;
GRANT TRUNCATE ON public.cash_flow_categories TO authenticated;
GRANT UPDATE ON public.cash_flow_categories TO authenticated;
GRANT DELETE ON public.cash_flow_categories TO service_role;
GRANT INSERT ON public.cash_flow_categories TO service_role;
GRANT REFERENCES ON public.cash_flow_categories TO service_role;
GRANT SELECT ON public.cash_flow_categories TO service_role;
GRANT TRIGGER ON public.cash_flow_categories TO service_role;
GRANT TRUNCATE ON public.cash_flow_categories TO service_role;
GRANT UPDATE ON public.cash_flow_categories TO service_role;
GRANT DELETE ON public.cash_flow_data TO anon;
GRANT INSERT ON public.cash_flow_data TO anon;
GRANT REFERENCES ON public.cash_flow_data TO anon;
GRANT SELECT ON public.cash_flow_data TO anon;
GRANT TRIGGER ON public.cash_flow_data TO anon;
GRANT TRUNCATE ON public.cash_flow_data TO anon;
GRANT UPDATE ON public.cash_flow_data TO anon;
GRANT DELETE ON public.cash_flow_data TO authenticated;
GRANT INSERT ON public.cash_flow_data TO authenticated;
GRANT REFERENCES ON public.cash_flow_data TO authenticated;
GRANT SELECT ON public.cash_flow_data TO authenticated;
GRANT TRIGGER ON public.cash_flow_data TO authenticated;
GRANT TRUNCATE ON public.cash_flow_data TO authenticated;
GRANT UPDATE ON public.cash_flow_data TO authenticated;
GRANT DELETE ON public.cash_flow_data TO service_role;
GRANT INSERT ON public.cash_flow_data TO service_role;
GRANT REFERENCES ON public.cash_flow_data TO service_role;
GRANT SELECT ON public.cash_flow_data TO service_role;
GRANT TRIGGER ON public.cash_flow_data TO service_role;
GRANT TRUNCATE ON public.cash_flow_data TO service_role;
GRANT UPDATE ON public.cash_flow_data TO service_role;
GRANT DELETE ON public.cash_flow_data_detailed TO anon;
GRANT INSERT ON public.cash_flow_data_detailed TO anon;
GRANT REFERENCES ON public.cash_flow_data_detailed TO anon;
GRANT SELECT ON public.cash_flow_data_detailed TO anon;
GRANT TRIGGER ON public.cash_flow_data_detailed TO anon;
GRANT TRUNCATE ON public.cash_flow_data_detailed TO anon;
GRANT UPDATE ON public.cash_flow_data_detailed TO anon;
GRANT DELETE ON public.cash_flow_data_detailed TO authenticated;
GRANT INSERT ON public.cash_flow_data_detailed TO authenticated;
GRANT REFERENCES ON public.cash_flow_data_detailed TO authenticated;
GRANT SELECT ON public.cash_flow_data_detailed TO authenticated;
GRANT TRIGGER ON public.cash_flow_data_detailed TO authenticated;
GRANT TRUNCATE ON public.cash_flow_data_detailed TO authenticated;
GRANT UPDATE ON public.cash_flow_data_detailed TO authenticated;
GRANT DELETE ON public.cash_flow_data_detailed TO service_role;
GRANT INSERT ON public.cash_flow_data_detailed TO service_role;
GRANT REFERENCES ON public.cash_flow_data_detailed TO service_role;
GRANT SELECT ON public.cash_flow_data_detailed TO service_role;
GRANT TRIGGER ON public.cash_flow_data_detailed TO service_role;
GRANT TRUNCATE ON public.cash_flow_data_detailed TO service_role;
GRANT UPDATE ON public.cash_flow_data_detailed TO service_role;
GRANT DELETE ON public.cash_flow_detailed_view TO anon;
GRANT INSERT ON public.cash_flow_detailed_view TO anon;
GRANT REFERENCES ON public.cash_flow_detailed_view TO anon;
GRANT SELECT ON public.cash_flow_detailed_view TO anon;
GRANT TRIGGER ON public.cash_flow_detailed_view TO anon;
GRANT TRUNCATE ON public.cash_flow_detailed_view TO anon;
GRANT UPDATE ON public.cash_flow_detailed_view TO anon;
GRANT DELETE ON public.cash_flow_detailed_view TO authenticated;
GRANT INSERT ON public.cash_flow_detailed_view TO authenticated;
GRANT REFERENCES ON public.cash_flow_detailed_view TO authenticated;
GRANT SELECT ON public.cash_flow_detailed_view TO authenticated;
GRANT TRIGGER ON public.cash_flow_detailed_view TO authenticated;
GRANT TRUNCATE ON public.cash_flow_detailed_view TO authenticated;
GRANT UPDATE ON public.cash_flow_detailed_view TO authenticated;
GRANT DELETE ON public.cash_flow_detailed_view TO service_role;
GRANT INSERT ON public.cash_flow_detailed_view TO service_role;
GRANT REFERENCES ON public.cash_flow_detailed_view TO service_role;
GRANT SELECT ON public.cash_flow_detailed_view TO service_role;
GRANT TRIGGER ON public.cash_flow_detailed_view TO service_role;
GRANT TRUNCATE ON public.cash_flow_detailed_view TO service_role;
GRANT UPDATE ON public.cash_flow_detailed_view TO service_role;
GRANT DELETE ON public.cash_flow_expenses TO anon;
GRANT INSERT ON public.cash_flow_expenses TO anon;
GRANT REFERENCES ON public.cash_flow_expenses TO anon;
GRANT SELECT ON public.cash_flow_expenses TO anon;
GRANT TRIGGER ON public.cash_flow_expenses TO anon;
GRANT TRUNCATE ON public.cash_flow_expenses TO anon;
GRANT UPDATE ON public.cash_flow_expenses TO anon;
GRANT DELETE ON public.cash_flow_expenses TO authenticated;
GRANT INSERT ON public.cash_flow_expenses TO authenticated;
GRANT REFERENCES ON public.cash_flow_expenses TO authenticated;
GRANT SELECT ON public.cash_flow_expenses TO authenticated;
GRANT TRIGGER ON public.cash_flow_expenses TO authenticated;
GRANT TRUNCATE ON public.cash_flow_expenses TO authenticated;
GRANT UPDATE ON public.cash_flow_expenses TO authenticated;
GRANT DELETE ON public.cash_flow_expenses TO service_role;
GRANT INSERT ON public.cash_flow_expenses TO service_role;
GRANT REFERENCES ON public.cash_flow_expenses TO service_role;
GRANT SELECT ON public.cash_flow_expenses TO service_role;
GRANT TRIGGER ON public.cash_flow_expenses TO service_role;
GRANT TRUNCATE ON public.cash_flow_expenses TO service_role;
GRANT UPDATE ON public.cash_flow_expenses TO service_role;
GRANT DELETE ON public.cash_flow_revenues TO anon;
GRANT INSERT ON public.cash_flow_revenues TO anon;
GRANT REFERENCES ON public.cash_flow_revenues TO anon;
GRANT SELECT ON public.cash_flow_revenues TO anon;
GRANT TRIGGER ON public.cash_flow_revenues TO anon;
GRANT TRUNCATE ON public.cash_flow_revenues TO anon;
GRANT UPDATE ON public.cash_flow_revenues TO anon;
GRANT DELETE ON public.cash_flow_revenues TO authenticated;
GRANT INSERT ON public.cash_flow_revenues TO authenticated;
GRANT REFERENCES ON public.cash_flow_revenues TO authenticated;
GRANT SELECT ON public.cash_flow_revenues TO authenticated;
GRANT TRIGGER ON public.cash_flow_revenues TO authenticated;
GRANT TRUNCATE ON public.cash_flow_revenues TO authenticated;
GRANT UPDATE ON public.cash_flow_revenues TO authenticated;
GRANT DELETE ON public.cash_flow_revenues TO service_role;
GRANT INSERT ON public.cash_flow_revenues TO service_role;
GRANT REFERENCES ON public.cash_flow_revenues TO service_role;
GRANT SELECT ON public.cash_flow_revenues TO service_role;
GRANT TRIGGER ON public.cash_flow_revenues TO service_role;
GRANT TRUNCATE ON public.cash_flow_revenues TO service_role;
GRANT UPDATE ON public.cash_flow_revenues TO service_role;
GRANT DELETE ON public.centros_custo TO anon;
GRANT INSERT ON public.centros_custo TO anon;
GRANT REFERENCES ON public.centros_custo TO anon;
GRANT SELECT ON public.centros_custo TO anon;
GRANT TRIGGER ON public.centros_custo TO anon;
GRANT TRUNCATE ON public.centros_custo TO anon;
GRANT UPDATE ON public.centros_custo TO anon;
GRANT DELETE ON public.centros_custo TO authenticated;
GRANT INSERT ON public.centros_custo TO authenticated;
GRANT REFERENCES ON public.centros_custo TO authenticated;
GRANT SELECT ON public.centros_custo TO authenticated;
GRANT TRIGGER ON public.centros_custo TO authenticated;
GRANT TRUNCATE ON public.centros_custo TO authenticated;
GRANT UPDATE ON public.centros_custo TO authenticated;
GRANT DELETE ON public.centros_custo TO service_role;
GRANT INSERT ON public.centros_custo TO service_role;
GRANT REFERENCES ON public.centros_custo TO service_role;
GRANT SELECT ON public.centros_custo TO service_role;
GRANT TRIGGER ON public.centros_custo TO service_role;
GRANT TRUNCATE ON public.centros_custo TO service_role;
GRANT UPDATE ON public.centros_custo TO service_role;
GRANT DELETE ON public.centros_custo_ferramentas TO anon;
GRANT INSERT ON public.centros_custo_ferramentas TO anon;
GRANT REFERENCES ON public.centros_custo_ferramentas TO anon;
GRANT SELECT ON public.centros_custo_ferramentas TO anon;
GRANT TRIGGER ON public.centros_custo_ferramentas TO anon;
GRANT TRUNCATE ON public.centros_custo_ferramentas TO anon;
GRANT UPDATE ON public.centros_custo_ferramentas TO anon;
GRANT DELETE ON public.centros_custo_ferramentas TO authenticated;
GRANT INSERT ON public.centros_custo_ferramentas TO authenticated;
GRANT REFERENCES ON public.centros_custo_ferramentas TO authenticated;
GRANT SELECT ON public.centros_custo_ferramentas TO authenticated;
GRANT TRIGGER ON public.centros_custo_ferramentas TO authenticated;
GRANT TRUNCATE ON public.centros_custo_ferramentas TO authenticated;
GRANT UPDATE ON public.centros_custo_ferramentas TO authenticated;
GRANT DELETE ON public.centros_custo_ferramentas TO service_role;
GRANT INSERT ON public.centros_custo_ferramentas TO service_role;
GRANT REFERENCES ON public.centros_custo_ferramentas TO service_role;
GRANT SELECT ON public.centros_custo_ferramentas TO service_role;
GRANT TRIGGER ON public.centros_custo_ferramentas TO service_role;
GRANT TRUNCATE ON public.centros_custo_ferramentas TO service_role;
GRANT UPDATE ON public.centros_custo_ferramentas TO service_role;
GRANT DELETE ON public.cliente_contratos TO anon;
GRANT INSERT ON public.cliente_contratos TO anon;
GRANT REFERENCES ON public.cliente_contratos TO anon;
GRANT SELECT ON public.cliente_contratos TO anon;
GRANT TRIGGER ON public.cliente_contratos TO anon;
GRANT TRUNCATE ON public.cliente_contratos TO anon;
GRANT UPDATE ON public.cliente_contratos TO anon;
GRANT DELETE ON public.cliente_contratos TO authenticated;
GRANT INSERT ON public.cliente_contratos TO authenticated;
GRANT REFERENCES ON public.cliente_contratos TO authenticated;
GRANT SELECT ON public.cliente_contratos TO authenticated;
GRANT TRIGGER ON public.cliente_contratos TO authenticated;
GRANT TRUNCATE ON public.cliente_contratos TO authenticated;
GRANT UPDATE ON public.cliente_contratos TO authenticated;
GRANT DELETE ON public.cliente_contratos TO service_role;
GRANT INSERT ON public.cliente_contratos TO service_role;
GRANT REFERENCES ON public.cliente_contratos TO service_role;
GRANT SELECT ON public.cliente_contratos TO service_role;
GRANT TRIGGER ON public.cliente_contratos TO service_role;
GRANT TRUNCATE ON public.cliente_contratos TO service_role;
GRANT UPDATE ON public.cliente_contratos TO service_role;
GRANT DELETE ON public.clientes TO anon;
GRANT INSERT ON public.clientes TO anon;
GRANT REFERENCES ON public.clientes TO anon;
GRANT SELECT ON public.clientes TO anon;
GRANT TRIGGER ON public.clientes TO anon;
GRANT TRUNCATE ON public.clientes TO anon;
GRANT UPDATE ON public.clientes TO anon;
GRANT DELETE ON public.clientes TO authenticated;
GRANT INSERT ON public.clientes TO authenticated;
GRANT REFERENCES ON public.clientes TO authenticated;
GRANT SELECT ON public.clientes TO authenticated;
GRANT TRIGGER ON public.clientes TO authenticated;
GRANT TRUNCATE ON public.clientes TO authenticated;
GRANT UPDATE ON public.clientes TO authenticated;
GRANT DELETE ON public.clientes TO service_role;
GRANT INSERT ON public.clientes TO service_role;
GRANT REFERENCES ON public.clientes TO service_role;
GRANT SELECT ON public.clientes TO service_role;
GRANT TRIGGER ON public.clientes TO service_role;
GRANT TRUNCATE ON public.clientes TO service_role;
GRANT UPDATE ON public.clientes TO service_role;
GRANT DELETE ON public.cobranca_historico TO anon;
GRANT INSERT ON public.cobranca_historico TO anon;
GRANT REFERENCES ON public.cobranca_historico TO anon;
GRANT SELECT ON public.cobranca_historico TO anon;
GRANT TRIGGER ON public.cobranca_historico TO anon;
GRANT TRUNCATE ON public.cobranca_historico TO anon;
GRANT UPDATE ON public.cobranca_historico TO anon;
GRANT DELETE ON public.cobranca_historico TO authenticated;
GRANT INSERT ON public.cobranca_historico TO authenticated;
GRANT REFERENCES ON public.cobranca_historico TO authenticated;
GRANT SELECT ON public.cobranca_historico TO authenticated;
GRANT TRIGGER ON public.cobranca_historico TO authenticated;
GRANT TRUNCATE ON public.cobranca_historico TO authenticated;
GRANT UPDATE ON public.cobranca_historico TO authenticated;
GRANT DELETE ON public.cobranca_historico TO service_role;
GRANT INSERT ON public.cobranca_historico TO service_role;
GRANT REFERENCES ON public.cobranca_historico TO service_role;
GRANT SELECT ON public.cobranca_historico TO service_role;
GRANT TRIGGER ON public.cobranca_historico TO service_role;
GRANT TRUNCATE ON public.cobranca_historico TO service_role;
GRANT UPDATE ON public.cobranca_historico TO service_role;
GRANT DELETE ON public.colaborador_documentos TO anon;
GRANT INSERT ON public.colaborador_documentos TO anon;
GRANT REFERENCES ON public.colaborador_documentos TO anon;
GRANT SELECT ON public.colaborador_documentos TO anon;
GRANT TRIGGER ON public.colaborador_documentos TO anon;
GRANT TRUNCATE ON public.colaborador_documentos TO anon;
GRANT UPDATE ON public.colaborador_documentos TO anon;
GRANT DELETE ON public.colaborador_documentos TO authenticated;
GRANT INSERT ON public.colaborador_documentos TO authenticated;
GRANT REFERENCES ON public.colaborador_documentos TO authenticated;
GRANT SELECT ON public.colaborador_documentos TO authenticated;
GRANT TRIGGER ON public.colaborador_documentos TO authenticated;
GRANT TRUNCATE ON public.colaborador_documentos TO authenticated;
GRANT UPDATE ON public.colaborador_documentos TO authenticated;
GRANT DELETE ON public.colaborador_documentos TO service_role;
GRANT INSERT ON public.colaborador_documentos TO service_role;
GRANT REFERENCES ON public.colaborador_documentos TO service_role;
GRANT SELECT ON public.colaborador_documentos TO service_role;
GRANT TRIGGER ON public.colaborador_documentos TO service_role;
GRANT TRUNCATE ON public.colaborador_documentos TO service_role;
GRANT UPDATE ON public.colaborador_documentos TO service_role;
GRANT DELETE ON public.colaborador_notas TO anon;
GRANT INSERT ON public.colaborador_notas TO anon;
GRANT REFERENCES ON public.colaborador_notas TO anon;
GRANT SELECT ON public.colaborador_notas TO anon;
GRANT TRIGGER ON public.colaborador_notas TO anon;
GRANT TRUNCATE ON public.colaborador_notas TO anon;
GRANT UPDATE ON public.colaborador_notas TO anon;
GRANT DELETE ON public.colaborador_notas TO authenticated;
GRANT INSERT ON public.colaborador_notas TO authenticated;
GRANT REFERENCES ON public.colaborador_notas TO authenticated;
GRANT SELECT ON public.colaborador_notas TO authenticated;
GRANT TRIGGER ON public.colaborador_notas TO authenticated;
GRANT TRUNCATE ON public.colaborador_notas TO authenticated;
GRANT UPDATE ON public.colaborador_notas TO authenticated;
GRANT DELETE ON public.colaborador_notas TO service_role;
GRANT INSERT ON public.colaborador_notas TO service_role;
GRANT REFERENCES ON public.colaborador_notas TO service_role;
GRANT SELECT ON public.colaborador_notas TO service_role;
GRANT TRIGGER ON public.colaborador_notas TO service_role;
GRANT TRUNCATE ON public.colaborador_notas TO service_role;
GRANT UPDATE ON public.colaborador_notas TO service_role;
GRANT DELETE ON public.colaboradores TO anon;
GRANT INSERT ON public.colaboradores TO anon;
GRANT REFERENCES ON public.colaboradores TO anon;
GRANT SELECT ON public.colaboradores TO anon;
GRANT TRIGGER ON public.colaboradores TO anon;
GRANT TRUNCATE ON public.colaboradores TO anon;
GRANT UPDATE ON public.colaboradores TO anon;
GRANT DELETE ON public.colaboradores TO authenticated;
GRANT INSERT ON public.colaboradores TO authenticated;
GRANT REFERENCES ON public.colaboradores TO authenticated;
GRANT SELECT ON public.colaboradores TO authenticated;
GRANT TRIGGER ON public.colaboradores TO authenticated;
GRANT TRUNCATE ON public.colaboradores TO authenticated;
GRANT UPDATE ON public.colaboradores TO authenticated;
GRANT DELETE ON public.colaboradores TO service_role;
GRANT INSERT ON public.colaboradores TO service_role;
GRANT REFERENCES ON public.colaboradores TO service_role;
GRANT SELECT ON public.colaboradores TO service_role;
GRANT TRIGGER ON public.colaboradores TO service_role;
GRANT TRUNCATE ON public.colaboradores TO service_role;
GRANT UPDATE ON public.colaboradores TO service_role;
GRANT DELETE ON public.contas_pagar TO anon;
GRANT INSERT ON public.contas_pagar TO anon;
GRANT REFERENCES ON public.contas_pagar TO anon;
GRANT SELECT ON public.contas_pagar TO anon;
GRANT TRIGGER ON public.contas_pagar TO anon;
GRANT TRUNCATE ON public.contas_pagar TO anon;
GRANT UPDATE ON public.contas_pagar TO anon;
GRANT DELETE ON public.contas_pagar TO authenticated;
GRANT INSERT ON public.contas_pagar TO authenticated;
GRANT REFERENCES ON public.contas_pagar TO authenticated;
GRANT SELECT ON public.contas_pagar TO authenticated;
GRANT TRIGGER ON public.contas_pagar TO authenticated;
GRANT TRUNCATE ON public.contas_pagar TO authenticated;
GRANT UPDATE ON public.contas_pagar TO authenticated;
GRANT DELETE ON public.contas_pagar TO service_role;
GRANT INSERT ON public.contas_pagar TO service_role;
GRANT REFERENCES ON public.contas_pagar TO service_role;
GRANT SELECT ON public.contas_pagar TO service_role;
GRANT TRIGGER ON public.contas_pagar TO service_role;
GRANT TRUNCATE ON public.contas_pagar TO service_role;
GRANT UPDATE ON public.contas_pagar TO service_role;
GRANT DELETE ON public.contas_receber TO anon;
GRANT INSERT ON public.contas_receber TO anon;
GRANT REFERENCES ON public.contas_receber TO anon;
GRANT SELECT ON public.contas_receber TO anon;
GRANT TRIGGER ON public.contas_receber TO anon;
GRANT TRUNCATE ON public.contas_receber TO anon;
GRANT UPDATE ON public.contas_receber TO anon;
GRANT DELETE ON public.contas_receber TO authenticated;
GRANT INSERT ON public.contas_receber TO authenticated;
GRANT REFERENCES ON public.contas_receber TO authenticated;
GRANT SELECT ON public.contas_receber TO authenticated;
GRANT TRIGGER ON public.contas_receber TO authenticated;
GRANT TRUNCATE ON public.contas_receber TO authenticated;
GRANT UPDATE ON public.contas_receber TO authenticated;
GRANT DELETE ON public.contas_receber TO service_role;
GRANT INSERT ON public.contas_receber TO service_role;
GRANT REFERENCES ON public.contas_receber TO service_role;
GRANT SELECT ON public.contas_receber TO service_role;
GRANT TRIGGER ON public.contas_receber TO service_role;
GRANT TRUNCATE ON public.contas_receber TO service_role;
GRANT UPDATE ON public.contas_receber TO service_role;
GRANT DELETE ON public.contratos_itens TO anon;
GRANT INSERT ON public.contratos_itens TO anon;
GRANT REFERENCES ON public.contratos_itens TO anon;
GRANT SELECT ON public.contratos_itens TO anon;
GRANT TRIGGER ON public.contratos_itens TO anon;
GRANT TRUNCATE ON public.contratos_itens TO anon;
GRANT UPDATE ON public.contratos_itens TO anon;
GRANT DELETE ON public.contratos_itens TO authenticated;
GRANT INSERT ON public.contratos_itens TO authenticated;
GRANT REFERENCES ON public.contratos_itens TO authenticated;
GRANT SELECT ON public.contratos_itens TO authenticated;
GRANT TRIGGER ON public.contratos_itens TO authenticated;
GRANT TRUNCATE ON public.contratos_itens TO authenticated;
GRANT UPDATE ON public.contratos_itens TO authenticated;
GRANT DELETE ON public.contratos_itens TO service_role;
GRANT INSERT ON public.contratos_itens TO service_role;
GRANT REFERENCES ON public.contratos_itens TO service_role;
GRANT SELECT ON public.contratos_itens TO service_role;
GRANT TRIGGER ON public.contratos_itens TO service_role;
GRANT TRUNCATE ON public.contratos_itens TO service_role;
GRANT UPDATE ON public.contratos_itens TO service_role;
GRANT DELETE ON public.despesa_categorias TO anon;
GRANT INSERT ON public.despesa_categorias TO anon;
GRANT REFERENCES ON public.despesa_categorias TO anon;
GRANT SELECT ON public.despesa_categorias TO anon;
GRANT TRIGGER ON public.despesa_categorias TO anon;
GRANT TRUNCATE ON public.despesa_categorias TO anon;
GRANT UPDATE ON public.despesa_categorias TO anon;
GRANT DELETE ON public.despesa_categorias TO authenticated;
GRANT INSERT ON public.despesa_categorias TO authenticated;
GRANT REFERENCES ON public.despesa_categorias TO authenticated;
GRANT SELECT ON public.despesa_categorias TO authenticated;
GRANT TRIGGER ON public.despesa_categorias TO authenticated;
GRANT TRUNCATE ON public.despesa_categorias TO authenticated;
GRANT UPDATE ON public.despesa_categorias TO authenticated;
GRANT DELETE ON public.despesa_categorias TO service_role;
GRANT INSERT ON public.despesa_categorias TO service_role;
GRANT REFERENCES ON public.despesa_categorias TO service_role;
GRANT SELECT ON public.despesa_categorias TO service_role;
GRANT TRIGGER ON public.despesa_categorias TO service_role;
GRANT TRUNCATE ON public.despesa_categorias TO service_role;
GRANT UPDATE ON public.despesa_categorias TO service_role;
GRANT DELETE ON public.devolucao_anexos TO anon;
GRANT INSERT ON public.devolucao_anexos TO anon;
GRANT REFERENCES ON public.devolucao_anexos TO anon;
GRANT SELECT ON public.devolucao_anexos TO anon;
GRANT TRIGGER ON public.devolucao_anexos TO anon;
GRANT TRUNCATE ON public.devolucao_anexos TO anon;
GRANT UPDATE ON public.devolucao_anexos TO anon;
GRANT DELETE ON public.devolucao_anexos TO authenticated;
GRANT INSERT ON public.devolucao_anexos TO authenticated;
GRANT REFERENCES ON public.devolucao_anexos TO authenticated;
GRANT SELECT ON public.devolucao_anexos TO authenticated;
GRANT TRIGGER ON public.devolucao_anexos TO authenticated;
GRANT TRUNCATE ON public.devolucao_anexos TO authenticated;
GRANT UPDATE ON public.devolucao_anexos TO authenticated;
GRANT DELETE ON public.devolucao_anexos TO service_role;
GRANT INSERT ON public.devolucao_anexos TO service_role;
GRANT REFERENCES ON public.devolucao_anexos TO service_role;
GRANT SELECT ON public.devolucao_anexos TO service_role;
GRANT TRIGGER ON public.devolucao_anexos TO service_role;
GRANT TRUNCATE ON public.devolucao_anexos TO service_role;
GRANT UPDATE ON public.devolucao_anexos TO service_role;
GRANT DELETE ON public.devolucoes TO anon;
GRANT INSERT ON public.devolucoes TO anon;
GRANT REFERENCES ON public.devolucoes TO anon;
GRANT SELECT ON public.devolucoes TO anon;
GRANT TRIGGER ON public.devolucoes TO anon;
GRANT TRUNCATE ON public.devolucoes TO anon;
GRANT UPDATE ON public.devolucoes TO anon;
GRANT DELETE ON public.devolucoes TO authenticated;
GRANT INSERT ON public.devolucoes TO authenticated;
GRANT REFERENCES ON public.devolucoes TO authenticated;
GRANT SELECT ON public.devolucoes TO authenticated;
GRANT TRIGGER ON public.devolucoes TO authenticated;
GRANT TRUNCATE ON public.devolucoes TO authenticated;
GRANT UPDATE ON public.devolucoes TO authenticated;
GRANT DELETE ON public.devolucoes TO service_role;
GRANT INSERT ON public.devolucoes TO service_role;
GRANT REFERENCES ON public.devolucoes TO service_role;
GRANT SELECT ON public.devolucoes TO service_role;
GRANT TRIGGER ON public.devolucoes TO service_role;
GRANT TRUNCATE ON public.devolucoes TO service_role;
GRANT UPDATE ON public.devolucoes TO service_role;
GRANT DELETE ON public.director_bonus_config TO anon;
GRANT INSERT ON public.director_bonus_config TO anon;
GRANT REFERENCES ON public.director_bonus_config TO anon;
GRANT SELECT ON public.director_bonus_config TO anon;
GRANT TRIGGER ON public.director_bonus_config TO anon;
GRANT TRUNCATE ON public.director_bonus_config TO anon;
GRANT UPDATE ON public.director_bonus_config TO anon;
GRANT DELETE ON public.director_bonus_config TO authenticated;
GRANT INSERT ON public.director_bonus_config TO authenticated;
GRANT REFERENCES ON public.director_bonus_config TO authenticated;
GRANT SELECT ON public.director_bonus_config TO authenticated;
GRANT TRIGGER ON public.director_bonus_config TO authenticated;
GRANT TRUNCATE ON public.director_bonus_config TO authenticated;
GRANT UPDATE ON public.director_bonus_config TO authenticated;
GRANT DELETE ON public.director_bonus_config TO service_role;
GRANT INSERT ON public.director_bonus_config TO service_role;
GRANT REFERENCES ON public.director_bonus_config TO service_role;
GRANT SELECT ON public.director_bonus_config TO service_role;
GRANT TRIGGER ON public.director_bonus_config TO service_role;
GRANT TRUNCATE ON public.director_bonus_config TO service_role;
GRANT UPDATE ON public.director_bonus_config TO service_role;
GRANT DELETE ON public.drafts TO anon;
GRANT INSERT ON public.drafts TO anon;
GRANT REFERENCES ON public.drafts TO anon;
GRANT SELECT ON public.drafts TO anon;
GRANT TRIGGER ON public.drafts TO anon;
GRANT TRUNCATE ON public.drafts TO anon;
GRANT UPDATE ON public.drafts TO anon;
GRANT DELETE ON public.drafts TO authenticated;
GRANT INSERT ON public.drafts TO authenticated;
GRANT REFERENCES ON public.drafts TO authenticated;
GRANT SELECT ON public.drafts TO authenticated;
GRANT TRIGGER ON public.drafts TO authenticated;
GRANT TRUNCATE ON public.drafts TO authenticated;
GRANT UPDATE ON public.drafts TO authenticated;
GRANT DELETE ON public.drafts TO service_role;
GRANT INSERT ON public.drafts TO service_role;
GRANT REFERENCES ON public.drafts TO service_role;
GRANT SELECT ON public.drafts TO service_role;
GRANT TRIGGER ON public.drafts TO service_role;
GRANT TRUNCATE ON public.drafts TO service_role;
GRANT UPDATE ON public.drafts TO service_role;
GRANT DELETE ON public.empresa_usuarios TO anon;
GRANT INSERT ON public.empresa_usuarios TO anon;
GRANT REFERENCES ON public.empresa_usuarios TO anon;
GRANT SELECT ON public.empresa_usuarios TO anon;
GRANT TRIGGER ON public.empresa_usuarios TO anon;
GRANT TRUNCATE ON public.empresa_usuarios TO anon;
GRANT UPDATE ON public.empresa_usuarios TO anon;
GRANT DELETE ON public.empresa_usuarios TO authenticated;
GRANT INSERT ON public.empresa_usuarios TO authenticated;
GRANT REFERENCES ON public.empresa_usuarios TO authenticated;
GRANT SELECT ON public.empresa_usuarios TO authenticated;
GRANT TRIGGER ON public.empresa_usuarios TO authenticated;
GRANT TRUNCATE ON public.empresa_usuarios TO authenticated;
GRANT UPDATE ON public.empresa_usuarios TO authenticated;
GRANT DELETE ON public.empresa_usuarios TO service_role;
GRANT INSERT ON public.empresa_usuarios TO service_role;
GRANT REFERENCES ON public.empresa_usuarios TO service_role;
GRANT SELECT ON public.empresa_usuarios TO service_role;
GRANT TRIGGER ON public.empresa_usuarios TO service_role;
GRANT TRUNCATE ON public.empresa_usuarios TO service_role;
GRANT UPDATE ON public.empresa_usuarios TO service_role;
GRANT DELETE ON public.empresas TO anon;
GRANT INSERT ON public.empresas TO anon;
GRANT REFERENCES ON public.empresas TO anon;
GRANT SELECT ON public.empresas TO anon;
GRANT TRIGGER ON public.empresas TO anon;
GRANT TRUNCATE ON public.empresas TO anon;
GRANT UPDATE ON public.empresas TO anon;
GRANT DELETE ON public.empresas TO authenticated;
GRANT INSERT ON public.empresas TO authenticated;
GRANT REFERENCES ON public.empresas TO authenticated;
GRANT SELECT ON public.empresas TO authenticated;
GRANT TRIGGER ON public.empresas TO authenticated;
GRANT TRUNCATE ON public.empresas TO authenticated;
GRANT UPDATE ON public.empresas TO authenticated;
GRANT DELETE ON public.empresas TO service_role;
GRANT INSERT ON public.empresas TO service_role;
GRANT REFERENCES ON public.empresas TO service_role;
GRANT SELECT ON public.empresas TO service_role;
GRANT TRIGGER ON public.empresas TO service_role;
GRANT TRUNCATE ON public.empresas TO service_role;
GRANT UPDATE ON public.empresas TO service_role;
GRANT DELETE ON public.equipamento_fotos TO anon;
GRANT INSERT ON public.equipamento_fotos TO anon;
GRANT REFERENCES ON public.equipamento_fotos TO anon;
GRANT SELECT ON public.equipamento_fotos TO anon;
GRANT TRIGGER ON public.equipamento_fotos TO anon;
GRANT TRUNCATE ON public.equipamento_fotos TO anon;
GRANT UPDATE ON public.equipamento_fotos TO anon;
GRANT DELETE ON public.equipamento_fotos TO authenticated;
GRANT INSERT ON public.equipamento_fotos TO authenticated;
GRANT REFERENCES ON public.equipamento_fotos TO authenticated;
GRANT SELECT ON public.equipamento_fotos TO authenticated;
GRANT TRIGGER ON public.equipamento_fotos TO authenticated;
GRANT TRUNCATE ON public.equipamento_fotos TO authenticated;
GRANT UPDATE ON public.equipamento_fotos TO authenticated;
GRANT DELETE ON public.equipamento_fotos TO service_role;
GRANT INSERT ON public.equipamento_fotos TO service_role;
GRANT REFERENCES ON public.equipamento_fotos TO service_role;
GRANT SELECT ON public.equipamento_fotos TO service_role;
GRANT TRIGGER ON public.equipamento_fotos TO service_role;
GRANT TRUNCATE ON public.equipamento_fotos TO service_role;
GRANT UPDATE ON public.equipamento_fotos TO service_role;
GRANT DELETE ON public.equipamentos TO anon;
GRANT INSERT ON public.equipamentos TO anon;
GRANT REFERENCES ON public.equipamentos TO anon;
GRANT SELECT ON public.equipamentos TO anon;
GRANT TRIGGER ON public.equipamentos TO anon;
GRANT TRUNCATE ON public.equipamentos TO anon;
GRANT UPDATE ON public.equipamentos TO anon;
GRANT DELETE ON public.equipamentos TO authenticated;
GRANT INSERT ON public.equipamentos TO authenticated;
GRANT REFERENCES ON public.equipamentos TO authenticated;
GRANT SELECT ON public.equipamentos TO authenticated;
GRANT TRIGGER ON public.equipamentos TO authenticated;
GRANT TRUNCATE ON public.equipamentos TO authenticated;
GRANT UPDATE ON public.equipamentos TO authenticated;
GRANT DELETE ON public.equipamentos TO service_role;
GRANT INSERT ON public.equipamentos TO service_role;
GRANT REFERENCES ON public.equipamentos TO service_role;
GRANT SELECT ON public.equipamentos TO service_role;
GRANT TRIGGER ON public.equipamentos TO service_role;
GRANT TRUNCATE ON public.equipamentos TO service_role;
GRANT UPDATE ON public.equipamentos TO service_role;
GRANT DELETE ON public.ferramentas TO anon;
GRANT INSERT ON public.ferramentas TO anon;
GRANT REFERENCES ON public.ferramentas TO anon;
GRANT SELECT ON public.ferramentas TO anon;
GRANT TRIGGER ON public.ferramentas TO anon;
GRANT TRUNCATE ON public.ferramentas TO anon;
GRANT UPDATE ON public.ferramentas TO anon;
GRANT DELETE ON public.ferramentas TO authenticated;
GRANT INSERT ON public.ferramentas TO authenticated;
GRANT REFERENCES ON public.ferramentas TO authenticated;
GRANT SELECT ON public.ferramentas TO authenticated;
GRANT TRIGGER ON public.ferramentas TO authenticated;
GRANT TRUNCATE ON public.ferramentas TO authenticated;
GRANT UPDATE ON public.ferramentas TO authenticated;
GRANT DELETE ON public.ferramentas TO service_role;
GRANT INSERT ON public.ferramentas TO service_role;
GRANT REFERENCES ON public.ferramentas TO service_role;
GRANT SELECT ON public.ferramentas TO service_role;
GRANT TRIGGER ON public.ferramentas TO service_role;
GRANT TRUNCATE ON public.ferramentas TO service_role;
GRANT UPDATE ON public.ferramentas TO service_role;
GRANT DELETE ON public.financial_config TO anon;
GRANT INSERT ON public.financial_config TO anon;
GRANT REFERENCES ON public.financial_config TO anon;
GRANT SELECT ON public.financial_config TO anon;
GRANT TRIGGER ON public.financial_config TO anon;
GRANT TRUNCATE ON public.financial_config TO anon;
GRANT UPDATE ON public.financial_config TO anon;
GRANT DELETE ON public.financial_config TO authenticated;
GRANT INSERT ON public.financial_config TO authenticated;
GRANT REFERENCES ON public.financial_config TO authenticated;
GRANT SELECT ON public.financial_config TO authenticated;
GRANT TRIGGER ON public.financial_config TO authenticated;
GRANT TRUNCATE ON public.financial_config TO authenticated;
GRANT UPDATE ON public.financial_config TO authenticated;
GRANT DELETE ON public.financial_config TO service_role;
GRANT INSERT ON public.financial_config TO service_role;
GRANT REFERENCES ON public.financial_config TO service_role;
GRANT SELECT ON public.financial_config TO service_role;
GRANT TRIGGER ON public.financial_config TO service_role;
GRANT TRUNCATE ON public.financial_config TO service_role;
GRANT UPDATE ON public.financial_config TO service_role;
GRANT DELETE ON public.financial_periods TO anon;
GRANT INSERT ON public.financial_periods TO anon;
GRANT REFERENCES ON public.financial_periods TO anon;
GRANT SELECT ON public.financial_periods TO anon;
GRANT TRIGGER ON public.financial_periods TO anon;
GRANT TRUNCATE ON public.financial_periods TO anon;
GRANT UPDATE ON public.financial_periods TO anon;
GRANT DELETE ON public.financial_periods TO authenticated;
GRANT INSERT ON public.financial_periods TO authenticated;
GRANT REFERENCES ON public.financial_periods TO authenticated;
GRANT SELECT ON public.financial_periods TO authenticated;
GRANT TRIGGER ON public.financial_periods TO authenticated;
GRANT TRUNCATE ON public.financial_periods TO authenticated;
GRANT UPDATE ON public.financial_periods TO authenticated;
GRANT DELETE ON public.financial_periods TO service_role;
GRANT INSERT ON public.financial_periods TO service_role;
GRANT REFERENCES ON public.financial_periods TO service_role;
GRANT SELECT ON public.financial_periods TO service_role;
GRANT TRIGGER ON public.financial_periods TO service_role;
GRANT TRUNCATE ON public.financial_periods TO service_role;
GRANT UPDATE ON public.financial_periods TO service_role;
GRANT DELETE ON public.fornecedores TO anon;
GRANT INSERT ON public.fornecedores TO anon;
GRANT REFERENCES ON public.fornecedores TO anon;
GRANT SELECT ON public.fornecedores TO anon;
GRANT TRIGGER ON public.fornecedores TO anon;
GRANT TRUNCATE ON public.fornecedores TO anon;
GRANT UPDATE ON public.fornecedores TO anon;
GRANT DELETE ON public.fornecedores TO authenticated;
GRANT INSERT ON public.fornecedores TO authenticated;
GRANT REFERENCES ON public.fornecedores TO authenticated;
GRANT SELECT ON public.fornecedores TO authenticated;
GRANT TRIGGER ON public.fornecedores TO authenticated;
GRANT TRUNCATE ON public.fornecedores TO authenticated;
GRANT UPDATE ON public.fornecedores TO authenticated;
GRANT DELETE ON public.fornecedores TO service_role;
GRANT INSERT ON public.fornecedores TO service_role;
GRANT REFERENCES ON public.fornecedores TO service_role;
GRANT SELECT ON public.fornecedores TO service_role;
GRANT TRIGGER ON public.fornecedores TO service_role;
GRANT TRUNCATE ON public.fornecedores TO service_role;
GRANT UPDATE ON public.fornecedores TO service_role;
GRANT DELETE ON public.goals TO anon;
GRANT INSERT ON public.goals TO anon;
GRANT REFERENCES ON public.goals TO anon;
GRANT SELECT ON public.goals TO anon;
GRANT TRIGGER ON public.goals TO anon;
GRANT TRUNCATE ON public.goals TO anon;
GRANT UPDATE ON public.goals TO anon;
GRANT DELETE ON public.goals TO authenticated;
GRANT INSERT ON public.goals TO authenticated;
GRANT REFERENCES ON public.goals TO authenticated;
GRANT SELECT ON public.goals TO authenticated;
GRANT TRIGGER ON public.goals TO authenticated;
GRANT TRUNCATE ON public.goals TO authenticated;
GRANT UPDATE ON public.goals TO authenticated;
GRANT DELETE ON public.goals TO service_role;
GRANT INSERT ON public.goals TO service_role;
GRANT REFERENCES ON public.goals TO service_role;
GRANT SELECT ON public.goals TO service_role;
GRANT TRIGGER ON public.goals TO service_role;
GRANT TRUNCATE ON public.goals TO service_role;
GRANT UPDATE ON public.goals TO service_role;
GRANT DELETE ON public.historico_alteracoes TO anon;
GRANT INSERT ON public.historico_alteracoes TO anon;
GRANT REFERENCES ON public.historico_alteracoes TO anon;
GRANT SELECT ON public.historico_alteracoes TO anon;
GRANT TRIGGER ON public.historico_alteracoes TO anon;
GRANT TRUNCATE ON public.historico_alteracoes TO anon;
GRANT UPDATE ON public.historico_alteracoes TO anon;
GRANT DELETE ON public.historico_alteracoes TO authenticated;
GRANT INSERT ON public.historico_alteracoes TO authenticated;
GRANT REFERENCES ON public.historico_alteracoes TO authenticated;
GRANT SELECT ON public.historico_alteracoes TO authenticated;
GRANT TRIGGER ON public.historico_alteracoes TO authenticated;
GRANT TRUNCATE ON public.historico_alteracoes TO authenticated;
GRANT UPDATE ON public.historico_alteracoes TO authenticated;
GRANT DELETE ON public.historico_alteracoes TO service_role;
GRANT INSERT ON public.historico_alteracoes TO service_role;
GRANT REFERENCES ON public.historico_alteracoes TO service_role;
GRANT SELECT ON public.historico_alteracoes TO service_role;
GRANT TRIGGER ON public.historico_alteracoes TO service_role;
GRANT TRUNCATE ON public.historico_alteracoes TO service_role;
GRANT UPDATE ON public.historico_alteracoes TO service_role;
GRANT DELETE ON public.hubla_webhook_events TO anon;
GRANT INSERT ON public.hubla_webhook_events TO anon;
GRANT REFERENCES ON public.hubla_webhook_events TO anon;
GRANT SELECT ON public.hubla_webhook_events TO anon;
GRANT TRIGGER ON public.hubla_webhook_events TO anon;
GRANT TRUNCATE ON public.hubla_webhook_events TO anon;
GRANT UPDATE ON public.hubla_webhook_events TO anon;
GRANT DELETE ON public.hubla_webhook_events TO authenticated;
GRANT INSERT ON public.hubla_webhook_events TO authenticated;
GRANT REFERENCES ON public.hubla_webhook_events TO authenticated;
GRANT SELECT ON public.hubla_webhook_events TO authenticated;
GRANT TRIGGER ON public.hubla_webhook_events TO authenticated;
GRANT TRUNCATE ON public.hubla_webhook_events TO authenticated;
GRANT UPDATE ON public.hubla_webhook_events TO authenticated;
GRANT DELETE ON public.hubla_webhook_events TO service_role;
GRANT INSERT ON public.hubla_webhook_events TO service_role;
GRANT REFERENCES ON public.hubla_webhook_events TO service_role;
GRANT SELECT ON public.hubla_webhook_events TO service_role;
GRANT TRIGGER ON public.hubla_webhook_events TO service_role;
GRANT TRUNCATE ON public.hubla_webhook_events TO service_role;
GRANT UPDATE ON public.hubla_webhook_events TO service_role;
GRANT DELETE ON public.lancamento_anexos TO anon;
GRANT INSERT ON public.lancamento_anexos TO anon;
GRANT REFERENCES ON public.lancamento_anexos TO anon;
GRANT SELECT ON public.lancamento_anexos TO anon;
GRANT TRIGGER ON public.lancamento_anexos TO anon;
GRANT TRUNCATE ON public.lancamento_anexos TO anon;
GRANT UPDATE ON public.lancamento_anexos TO anon;
GRANT DELETE ON public.lancamento_anexos TO authenticated;
GRANT INSERT ON public.lancamento_anexos TO authenticated;
GRANT REFERENCES ON public.lancamento_anexos TO authenticated;
GRANT SELECT ON public.lancamento_anexos TO authenticated;
GRANT TRIGGER ON public.lancamento_anexos TO authenticated;
GRANT TRUNCATE ON public.lancamento_anexos TO authenticated;
GRANT UPDATE ON public.lancamento_anexos TO authenticated;
GRANT DELETE ON public.lancamento_anexos TO service_role;
GRANT INSERT ON public.lancamento_anexos TO service_role;
GRANT REFERENCES ON public.lancamento_anexos TO service_role;
GRANT SELECT ON public.lancamento_anexos TO service_role;
GRANT TRIGGER ON public.lancamento_anexos TO service_role;
GRANT TRUNCATE ON public.lancamento_anexos TO service_role;
GRANT UPDATE ON public.lancamento_anexos TO service_role;
GRANT DELETE ON public.lancamentos_auditoria TO anon;
GRANT INSERT ON public.lancamentos_auditoria TO anon;
GRANT REFERENCES ON public.lancamentos_auditoria TO anon;
GRANT SELECT ON public.lancamentos_auditoria TO anon;
GRANT TRIGGER ON public.lancamentos_auditoria TO anon;
GRANT TRUNCATE ON public.lancamentos_auditoria TO anon;
GRANT UPDATE ON public.lancamentos_auditoria TO anon;
GRANT DELETE ON public.lancamentos_auditoria TO authenticated;
GRANT INSERT ON public.lancamentos_auditoria TO authenticated;
GRANT REFERENCES ON public.lancamentos_auditoria TO authenticated;
GRANT SELECT ON public.lancamentos_auditoria TO authenticated;
GRANT TRIGGER ON public.lancamentos_auditoria TO authenticated;
GRANT TRUNCATE ON public.lancamentos_auditoria TO authenticated;
GRANT UPDATE ON public.lancamentos_auditoria TO authenticated;
GRANT DELETE ON public.lancamentos_auditoria TO service_role;
GRANT INSERT ON public.lancamentos_auditoria TO service_role;
GRANT REFERENCES ON public.lancamentos_auditoria TO service_role;
GRANT SELECT ON public.lancamentos_auditoria TO service_role;
GRANT TRIGGER ON public.lancamentos_auditoria TO service_role;
GRANT TRUNCATE ON public.lancamentos_auditoria TO service_role;
GRANT UPDATE ON public.lancamentos_auditoria TO service_role;
GRANT DELETE ON public.lancamentos_empresa TO anon;
GRANT INSERT ON public.lancamentos_empresa TO anon;
GRANT REFERENCES ON public.lancamentos_empresa TO anon;
GRANT SELECT ON public.lancamentos_empresa TO anon;
GRANT TRIGGER ON public.lancamentos_empresa TO anon;
GRANT TRUNCATE ON public.lancamentos_empresa TO anon;
GRANT UPDATE ON public.lancamentos_empresa TO anon;
GRANT DELETE ON public.lancamentos_empresa TO authenticated;
GRANT INSERT ON public.lancamentos_empresa TO authenticated;
GRANT REFERENCES ON public.lancamentos_empresa TO authenticated;
GRANT SELECT ON public.lancamentos_empresa TO authenticated;
GRANT TRIGGER ON public.lancamentos_empresa TO authenticated;
GRANT TRUNCATE ON public.lancamentos_empresa TO authenticated;
GRANT UPDATE ON public.lancamentos_empresa TO authenticated;
GRANT DELETE ON public.lancamentos_empresa TO service_role;
GRANT INSERT ON public.lancamentos_empresa TO service_role;
GRANT REFERENCES ON public.lancamentos_empresa TO service_role;
GRANT SELECT ON public.lancamentos_empresa TO service_role;
GRANT TRIGGER ON public.lancamentos_empresa TO service_role;
GRANT TRUNCATE ON public.lancamentos_empresa TO service_role;
GRANT UPDATE ON public.lancamentos_empresa TO service_role;
GRANT DELETE ON public.marvee_category_mapping TO anon;
GRANT INSERT ON public.marvee_category_mapping TO anon;
GRANT REFERENCES ON public.marvee_category_mapping TO anon;
GRANT SELECT ON public.marvee_category_mapping TO anon;
GRANT TRIGGER ON public.marvee_category_mapping TO anon;
GRANT TRUNCATE ON public.marvee_category_mapping TO anon;
GRANT UPDATE ON public.marvee_category_mapping TO anon;
GRANT DELETE ON public.marvee_category_mapping TO authenticated;
GRANT INSERT ON public.marvee_category_mapping TO authenticated;
GRANT REFERENCES ON public.marvee_category_mapping TO authenticated;
GRANT SELECT ON public.marvee_category_mapping TO authenticated;
GRANT TRIGGER ON public.marvee_category_mapping TO authenticated;
GRANT TRUNCATE ON public.marvee_category_mapping TO authenticated;
GRANT UPDATE ON public.marvee_category_mapping TO authenticated;
GRANT DELETE ON public.marvee_category_mapping TO service_role;
GRANT INSERT ON public.marvee_category_mapping TO service_role;
GRANT REFERENCES ON public.marvee_category_mapping TO service_role;
GRANT SELECT ON public.marvee_category_mapping TO service_role;
GRANT TRIGGER ON public.marvee_category_mapping TO service_role;
GRANT TRUNCATE ON public.marvee_category_mapping TO service_role;
GRANT UPDATE ON public.marvee_category_mapping TO service_role;
GRANT DELETE ON public.marvee_extrato TO anon;
GRANT INSERT ON public.marvee_extrato TO anon;
GRANT REFERENCES ON public.marvee_extrato TO anon;
GRANT SELECT ON public.marvee_extrato TO anon;
GRANT TRIGGER ON public.marvee_extrato TO anon;
GRANT TRUNCATE ON public.marvee_extrato TO anon;
GRANT UPDATE ON public.marvee_extrato TO anon;
GRANT DELETE ON public.marvee_extrato TO authenticated;
GRANT INSERT ON public.marvee_extrato TO authenticated;
GRANT REFERENCES ON public.marvee_extrato TO authenticated;
GRANT SELECT ON public.marvee_extrato TO authenticated;
GRANT TRIGGER ON public.marvee_extrato TO authenticated;
GRANT TRUNCATE ON public.marvee_extrato TO authenticated;
GRANT UPDATE ON public.marvee_extrato TO authenticated;
GRANT DELETE ON public.marvee_extrato TO service_role;
GRANT INSERT ON public.marvee_extrato TO service_role;
GRANT REFERENCES ON public.marvee_extrato TO service_role;
GRANT SELECT ON public.marvee_extrato TO service_role;
GRANT TRIGGER ON public.marvee_extrato TO service_role;
GRANT TRUNCATE ON public.marvee_extrato TO service_role;
GRANT UPDATE ON public.marvee_extrato TO service_role;
GRANT DELETE ON public.marvee_extrato_consolidated_months TO anon;
GRANT INSERT ON public.marvee_extrato_consolidated_months TO anon;
GRANT REFERENCES ON public.marvee_extrato_consolidated_months TO anon;
GRANT SELECT ON public.marvee_extrato_consolidated_months TO anon;
GRANT TRIGGER ON public.marvee_extrato_consolidated_months TO anon;
GRANT TRUNCATE ON public.marvee_extrato_consolidated_months TO anon;
GRANT UPDATE ON public.marvee_extrato_consolidated_months TO anon;
GRANT DELETE ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT INSERT ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT REFERENCES ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT SELECT ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT TRIGGER ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT TRUNCATE ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT UPDATE ON public.marvee_extrato_consolidated_months TO authenticated;
GRANT DELETE ON public.marvee_extrato_consolidated_months TO service_role;
GRANT INSERT ON public.marvee_extrato_consolidated_months TO service_role;
GRANT REFERENCES ON public.marvee_extrato_consolidated_months TO service_role;
GRANT SELECT ON public.marvee_extrato_consolidated_months TO service_role;
GRANT TRIGGER ON public.marvee_extrato_consolidated_months TO service_role;
GRANT TRUNCATE ON public.marvee_extrato_consolidated_months TO service_role;
GRANT UPDATE ON public.marvee_extrato_consolidated_months TO service_role;
GRANT DELETE ON public.marvee_sync_logs TO anon;
GRANT INSERT ON public.marvee_sync_logs TO anon;
GRANT REFERENCES ON public.marvee_sync_logs TO anon;
GRANT SELECT ON public.marvee_sync_logs TO anon;
GRANT TRIGGER ON public.marvee_sync_logs TO anon;
GRANT TRUNCATE ON public.marvee_sync_logs TO anon;
GRANT UPDATE ON public.marvee_sync_logs TO anon;
GRANT DELETE ON public.marvee_sync_logs TO authenticated;
GRANT INSERT ON public.marvee_sync_logs TO authenticated;
GRANT REFERENCES ON public.marvee_sync_logs TO authenticated;
GRANT SELECT ON public.marvee_sync_logs TO authenticated;
GRANT TRIGGER ON public.marvee_sync_logs TO authenticated;
GRANT TRUNCATE ON public.marvee_sync_logs TO authenticated;
GRANT UPDATE ON public.marvee_sync_logs TO authenticated;
GRANT DELETE ON public.marvee_sync_logs TO service_role;
GRANT INSERT ON public.marvee_sync_logs TO service_role;
GRANT REFERENCES ON public.marvee_sync_logs TO service_role;
GRANT SELECT ON public.marvee_sync_logs TO service_role;
GRANT TRIGGER ON public.marvee_sync_logs TO service_role;
GRANT TRUNCATE ON public.marvee_sync_logs TO service_role;
GRANT UPDATE ON public.marvee_sync_logs TO service_role;
GRANT DELETE ON public.marvee_transactions TO anon;
GRANT INSERT ON public.marvee_transactions TO anon;
GRANT REFERENCES ON public.marvee_transactions TO anon;
GRANT SELECT ON public.marvee_transactions TO anon;
GRANT TRIGGER ON public.marvee_transactions TO anon;
GRANT TRUNCATE ON public.marvee_transactions TO anon;
GRANT UPDATE ON public.marvee_transactions TO anon;
GRANT DELETE ON public.marvee_transactions TO authenticated;
GRANT INSERT ON public.marvee_transactions TO authenticated;
GRANT REFERENCES ON public.marvee_transactions TO authenticated;
GRANT SELECT ON public.marvee_transactions TO authenticated;
GRANT TRIGGER ON public.marvee_transactions TO authenticated;
GRANT TRUNCATE ON public.marvee_transactions TO authenticated;
GRANT UPDATE ON public.marvee_transactions TO authenticated;
GRANT DELETE ON public.marvee_transactions TO service_role;
GRANT INSERT ON public.marvee_transactions TO service_role;
GRANT REFERENCES ON public.marvee_transactions TO service_role;
GRANT SELECT ON public.marvee_transactions TO service_role;
GRANT TRIGGER ON public.marvee_transactions TO service_role;
GRANT TRUNCATE ON public.marvee_transactions TO service_role;
GRANT UPDATE ON public.marvee_transactions TO service_role;
GRANT DELETE ON public.materiais TO anon;
GRANT INSERT ON public.materiais TO anon;
GRANT REFERENCES ON public.materiais TO anon;
GRANT SELECT ON public.materiais TO anon;
GRANT TRIGGER ON public.materiais TO anon;
GRANT TRUNCATE ON public.materiais TO anon;
GRANT UPDATE ON public.materiais TO anon;
GRANT DELETE ON public.materiais TO authenticated;
GRANT INSERT ON public.materiais TO authenticated;
GRANT REFERENCES ON public.materiais TO authenticated;
GRANT SELECT ON public.materiais TO authenticated;
GRANT TRIGGER ON public.materiais TO authenticated;
GRANT TRUNCATE ON public.materiais TO authenticated;
GRANT UPDATE ON public.materiais TO authenticated;
GRANT DELETE ON public.materiais TO service_role;
GRANT INSERT ON public.materiais TO service_role;
GRANT REFERENCES ON public.materiais TO service_role;
GRANT SELECT ON public.materiais TO service_role;
GRANT TRIGGER ON public.materiais TO service_role;
GRANT TRUNCATE ON public.materiais TO service_role;
GRANT UPDATE ON public.materiais TO service_role;
GRANT DELETE ON public.material_itens TO anon;
GRANT INSERT ON public.material_itens TO anon;
GRANT REFERENCES ON public.material_itens TO anon;
GRANT SELECT ON public.material_itens TO anon;
GRANT TRIGGER ON public.material_itens TO anon;
GRANT TRUNCATE ON public.material_itens TO anon;
GRANT UPDATE ON public.material_itens TO anon;
GRANT DELETE ON public.material_itens TO authenticated;
GRANT INSERT ON public.material_itens TO authenticated;
GRANT REFERENCES ON public.material_itens TO authenticated;
GRANT SELECT ON public.material_itens TO authenticated;
GRANT TRIGGER ON public.material_itens TO authenticated;
GRANT TRUNCATE ON public.material_itens TO authenticated;
GRANT UPDATE ON public.material_itens TO authenticated;
GRANT DELETE ON public.material_itens TO service_role;
GRANT INSERT ON public.material_itens TO service_role;
GRANT REFERENCES ON public.material_itens TO service_role;
GRANT SELECT ON public.material_itens TO service_role;
GRANT TRIGGER ON public.material_itens TO service_role;
GRANT TRUNCATE ON public.material_itens TO service_role;
GRANT UPDATE ON public.material_itens TO service_role;
GRANT DELETE ON public.modelos_contrato TO anon;
GRANT INSERT ON public.modelos_contrato TO anon;
GRANT REFERENCES ON public.modelos_contrato TO anon;
GRANT SELECT ON public.modelos_contrato TO anon;
GRANT TRIGGER ON public.modelos_contrato TO anon;
GRANT TRUNCATE ON public.modelos_contrato TO anon;
GRANT UPDATE ON public.modelos_contrato TO anon;
GRANT DELETE ON public.modelos_contrato TO authenticated;
GRANT INSERT ON public.modelos_contrato TO authenticated;
GRANT REFERENCES ON public.modelos_contrato TO authenticated;
GRANT SELECT ON public.modelos_contrato TO authenticated;
GRANT TRIGGER ON public.modelos_contrato TO authenticated;
GRANT TRUNCATE ON public.modelos_contrato TO authenticated;
GRANT UPDATE ON public.modelos_contrato TO authenticated;
GRANT DELETE ON public.modelos_contrato TO service_role;
GRANT INSERT ON public.modelos_contrato TO service_role;
GRANT REFERENCES ON public.modelos_contrato TO service_role;
GRANT SELECT ON public.modelos_contrato TO service_role;
GRANT TRIGGER ON public.modelos_contrato TO service_role;
GRANT TRUNCATE ON public.modelos_contrato TO service_role;
GRANT UPDATE ON public.modelos_contrato TO service_role;
GRANT DELETE ON public.monthly_planning TO anon;
GRANT INSERT ON public.monthly_planning TO anon;
GRANT REFERENCES ON public.monthly_planning TO anon;
GRANT SELECT ON public.monthly_planning TO anon;
GRANT TRIGGER ON public.monthly_planning TO anon;
GRANT TRUNCATE ON public.monthly_planning TO anon;
GRANT UPDATE ON public.monthly_planning TO anon;
GRANT DELETE ON public.monthly_planning TO authenticated;
GRANT INSERT ON public.monthly_planning TO authenticated;
GRANT REFERENCES ON public.monthly_planning TO authenticated;
GRANT SELECT ON public.monthly_planning TO authenticated;
GRANT TRIGGER ON public.monthly_planning TO authenticated;
GRANT TRUNCATE ON public.monthly_planning TO authenticated;
GRANT UPDATE ON public.monthly_planning TO authenticated;
GRANT DELETE ON public.monthly_planning TO service_role;
GRANT INSERT ON public.monthly_planning TO service_role;
GRANT REFERENCES ON public.monthly_planning TO service_role;
GRANT SELECT ON public.monthly_planning TO service_role;
GRANT TRIGGER ON public.monthly_planning TO service_role;
GRANT TRUNCATE ON public.monthly_planning TO service_role;
GRANT UPDATE ON public.monthly_planning TO service_role;
GRANT DELETE ON public.monthly_targets TO anon;
GRANT INSERT ON public.monthly_targets TO anon;
GRANT REFERENCES ON public.monthly_targets TO anon;
GRANT SELECT ON public.monthly_targets TO anon;
GRANT TRIGGER ON public.monthly_targets TO anon;
GRANT TRUNCATE ON public.monthly_targets TO anon;
GRANT UPDATE ON public.monthly_targets TO anon;
GRANT DELETE ON public.monthly_targets TO authenticated;
GRANT INSERT ON public.monthly_targets TO authenticated;
GRANT REFERENCES ON public.monthly_targets TO authenticated;
GRANT SELECT ON public.monthly_targets TO authenticated;
GRANT TRIGGER ON public.monthly_targets TO authenticated;
GRANT TRUNCATE ON public.monthly_targets TO authenticated;
GRANT UPDATE ON public.monthly_targets TO authenticated;
GRANT DELETE ON public.monthly_targets TO service_role;
GRANT INSERT ON public.monthly_targets TO service_role;
GRANT REFERENCES ON public.monthly_targets TO service_role;
GRANT SELECT ON public.monthly_targets TO service_role;
GRANT TRIGGER ON public.monthly_targets TO service_role;
GRANT TRUNCATE ON public.monthly_targets TO service_role;
GRANT UPDATE ON public.monthly_targets TO service_role;
GRANT DELETE ON public.nota_fiscal_anexos TO anon;
GRANT INSERT ON public.nota_fiscal_anexos TO anon;
GRANT REFERENCES ON public.nota_fiscal_anexos TO anon;
GRANT SELECT ON public.nota_fiscal_anexos TO anon;
GRANT TRIGGER ON public.nota_fiscal_anexos TO anon;
GRANT TRUNCATE ON public.nota_fiscal_anexos TO anon;
GRANT UPDATE ON public.nota_fiscal_anexos TO anon;
GRANT DELETE ON public.nota_fiscal_anexos TO authenticated;
GRANT INSERT ON public.nota_fiscal_anexos TO authenticated;
GRANT REFERENCES ON public.nota_fiscal_anexos TO authenticated;
GRANT SELECT ON public.nota_fiscal_anexos TO authenticated;
GRANT TRIGGER ON public.nota_fiscal_anexos TO authenticated;
GRANT TRUNCATE ON public.nota_fiscal_anexos TO authenticated;
GRANT UPDATE ON public.nota_fiscal_anexos TO authenticated;
GRANT DELETE ON public.nota_fiscal_anexos TO service_role;
GRANT INSERT ON public.nota_fiscal_anexos TO service_role;
GRANT REFERENCES ON public.nota_fiscal_anexos TO service_role;
GRANT SELECT ON public.nota_fiscal_anexos TO service_role;
GRANT TRIGGER ON public.nota_fiscal_anexos TO service_role;
GRANT TRUNCATE ON public.nota_fiscal_anexos TO service_role;
GRANT UPDATE ON public.nota_fiscal_anexos TO service_role;
GRANT DELETE ON public.notas_fiscais TO anon;
GRANT INSERT ON public.notas_fiscais TO anon;
GRANT REFERENCES ON public.notas_fiscais TO anon;
GRANT SELECT ON public.notas_fiscais TO anon;
GRANT TRIGGER ON public.notas_fiscais TO anon;
GRANT TRUNCATE ON public.notas_fiscais TO anon;
GRANT UPDATE ON public.notas_fiscais TO anon;
GRANT DELETE ON public.notas_fiscais TO authenticated;
GRANT INSERT ON public.notas_fiscais TO authenticated;
GRANT REFERENCES ON public.notas_fiscais TO authenticated;
GRANT SELECT ON public.notas_fiscais TO authenticated;
GRANT TRIGGER ON public.notas_fiscais TO authenticated;
GRANT TRUNCATE ON public.notas_fiscais TO authenticated;
GRANT UPDATE ON public.notas_fiscais TO authenticated;
GRANT DELETE ON public.notas_fiscais TO service_role;
GRANT INSERT ON public.notas_fiscais TO service_role;
GRANT REFERENCES ON public.notas_fiscais TO service_role;
GRANT SELECT ON public.notas_fiscais TO service_role;
GRANT TRIGGER ON public.notas_fiscais TO service_role;
GRANT TRUNCATE ON public.notas_fiscais TO service_role;
GRANT UPDATE ON public.notas_fiscais TO service_role;
GRANT DELETE ON public.notifications TO anon;
GRANT INSERT ON public.notifications TO anon;
GRANT REFERENCES ON public.notifications TO anon;
GRANT SELECT ON public.notifications TO anon;
GRANT TRIGGER ON public.notifications TO anon;
GRANT TRUNCATE ON public.notifications TO anon;
GRANT UPDATE ON public.notifications TO anon;
GRANT DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT REFERENCES ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT TRIGGER ON public.notifications TO authenticated;
GRANT TRUNCATE ON public.notifications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT DELETE ON public.notifications TO service_role;
GRANT INSERT ON public.notifications TO service_role;
GRANT REFERENCES ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO service_role;
GRANT TRIGGER ON public.notifications TO service_role;
GRANT TRUNCATE ON public.notifications TO service_role;
GRANT UPDATE ON public.notifications TO service_role;
GRANT DELETE ON public.parcelamento_dashboard_data TO anon;
GRANT INSERT ON public.parcelamento_dashboard_data TO anon;
GRANT REFERENCES ON public.parcelamento_dashboard_data TO anon;
GRANT SELECT ON public.parcelamento_dashboard_data TO anon;
GRANT TRIGGER ON public.parcelamento_dashboard_data TO anon;
GRANT TRUNCATE ON public.parcelamento_dashboard_data TO anon;
GRANT UPDATE ON public.parcelamento_dashboard_data TO anon;
GRANT DELETE ON public.parcelamento_dashboard_data TO authenticated;
GRANT INSERT ON public.parcelamento_dashboard_data TO authenticated;
GRANT REFERENCES ON public.parcelamento_dashboard_data TO authenticated;
GRANT SELECT ON public.parcelamento_dashboard_data TO authenticated;
GRANT TRIGGER ON public.parcelamento_dashboard_data TO authenticated;
GRANT TRUNCATE ON public.parcelamento_dashboard_data TO authenticated;
GRANT UPDATE ON public.parcelamento_dashboard_data TO authenticated;
GRANT DELETE ON public.parcelamento_dashboard_data TO service_role;
GRANT INSERT ON public.parcelamento_dashboard_data TO service_role;
GRANT REFERENCES ON public.parcelamento_dashboard_data TO service_role;
GRANT SELECT ON public.parcelamento_dashboard_data TO service_role;
GRANT TRIGGER ON public.parcelamento_dashboard_data TO service_role;
GRANT TRUNCATE ON public.parcelamento_dashboard_data TO service_role;
GRANT UPDATE ON public.parcelamento_dashboard_data TO service_role;
GRANT DELETE ON public.produtos_servicos TO anon;
GRANT INSERT ON public.produtos_servicos TO anon;
GRANT REFERENCES ON public.produtos_servicos TO anon;
GRANT SELECT ON public.produtos_servicos TO anon;
GRANT TRIGGER ON public.produtos_servicos TO anon;
GRANT TRUNCATE ON public.produtos_servicos TO anon;
GRANT UPDATE ON public.produtos_servicos TO anon;
GRANT DELETE ON public.produtos_servicos TO authenticated;
GRANT INSERT ON public.produtos_servicos TO authenticated;
GRANT REFERENCES ON public.produtos_servicos TO authenticated;
GRANT SELECT ON public.produtos_servicos TO authenticated;
GRANT TRIGGER ON public.produtos_servicos TO authenticated;
GRANT TRUNCATE ON public.produtos_servicos TO authenticated;
GRANT UPDATE ON public.produtos_servicos TO authenticated;
GRANT DELETE ON public.produtos_servicos TO service_role;
GRANT INSERT ON public.produtos_servicos TO service_role;
GRANT REFERENCES ON public.produtos_servicos TO service_role;
GRANT SELECT ON public.produtos_servicos TO service_role;
GRANT TRIGGER ON public.produtos_servicos TO service_role;
GRANT TRUNCATE ON public.produtos_servicos TO service_role;
GRANT UPDATE ON public.produtos_servicos TO service_role;
GRANT DELETE ON public.profiles TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT REFERENCES ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT TRIGGER ON public.profiles TO anon;
GRANT TRUNCATE ON public.profiles TO anon;
GRANT UPDATE ON public.profiles TO anon;
GRANT DELETE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT REFERENCES ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT TRIGGER ON public.profiles TO authenticated;
GRANT TRUNCATE ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.profiles TO service_role;
GRANT INSERT ON public.profiles TO service_role;
GRANT REFERENCES ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO service_role;
GRANT TRIGGER ON public.profiles TO service_role;
GRANT TRUNCATE ON public.profiles TO service_role;
GRANT UPDATE ON public.profiles TO service_role;
GRANT DELETE ON public.recebimentos TO anon;
GRANT INSERT ON public.recebimentos TO anon;
GRANT REFERENCES ON public.recebimentos TO anon;
GRANT SELECT ON public.recebimentos TO anon;
GRANT TRIGGER ON public.recebimentos TO anon;
GRANT TRUNCATE ON public.recebimentos TO anon;
GRANT UPDATE ON public.recebimentos TO anon;
GRANT DELETE ON public.recebimentos TO authenticated;
GRANT INSERT ON public.recebimentos TO authenticated;
GRANT REFERENCES ON public.recebimentos TO authenticated;
GRANT SELECT ON public.recebimentos TO authenticated;
GRANT TRIGGER ON public.recebimentos TO authenticated;
GRANT TRUNCATE ON public.recebimentos TO authenticated;
GRANT UPDATE ON public.recebimentos TO authenticated;
GRANT DELETE ON public.recebimentos TO service_role;
GRANT INSERT ON public.recebimentos TO service_role;
GRANT REFERENCES ON public.recebimentos TO service_role;
GRANT SELECT ON public.recebimentos TO service_role;
GRANT TRIGGER ON public.recebimentos TO service_role;
GRANT TRUNCATE ON public.recebimentos TO service_role;
GRANT UPDATE ON public.recebimentos TO service_role;
GRANT DELETE ON public.recorrencia_geracoes TO anon;
GRANT INSERT ON public.recorrencia_geracoes TO anon;
GRANT REFERENCES ON public.recorrencia_geracoes TO anon;
GRANT SELECT ON public.recorrencia_geracoes TO anon;
GRANT TRIGGER ON public.recorrencia_geracoes TO anon;
GRANT TRUNCATE ON public.recorrencia_geracoes TO anon;
GRANT UPDATE ON public.recorrencia_geracoes TO anon;
GRANT DELETE ON public.recorrencia_geracoes TO authenticated;
GRANT INSERT ON public.recorrencia_geracoes TO authenticated;
GRANT REFERENCES ON public.recorrencia_geracoes TO authenticated;
GRANT SELECT ON public.recorrencia_geracoes TO authenticated;
GRANT TRIGGER ON public.recorrencia_geracoes TO authenticated;
GRANT TRUNCATE ON public.recorrencia_geracoes TO authenticated;
GRANT UPDATE ON public.recorrencia_geracoes TO authenticated;
GRANT DELETE ON public.recorrencia_geracoes TO service_role;
GRANT INSERT ON public.recorrencia_geracoes TO service_role;
GRANT REFERENCES ON public.recorrencia_geracoes TO service_role;
GRANT SELECT ON public.recorrencia_geracoes TO service_role;
GRANT TRIGGER ON public.recorrencia_geracoes TO service_role;
GRANT TRUNCATE ON public.recorrencia_geracoes TO service_role;
GRANT UPDATE ON public.recorrencia_geracoes TO service_role;
GRANT DELETE ON public.recorrencias_lancamento TO anon;
GRANT INSERT ON public.recorrencias_lancamento TO anon;
GRANT REFERENCES ON public.recorrencias_lancamento TO anon;
GRANT SELECT ON public.recorrencias_lancamento TO anon;
GRANT TRIGGER ON public.recorrencias_lancamento TO anon;
GRANT TRUNCATE ON public.recorrencias_lancamento TO anon;
GRANT UPDATE ON public.recorrencias_lancamento TO anon;
GRANT DELETE ON public.recorrencias_lancamento TO authenticated;
GRANT INSERT ON public.recorrencias_lancamento TO authenticated;
GRANT REFERENCES ON public.recorrencias_lancamento TO authenticated;
GRANT SELECT ON public.recorrencias_lancamento TO authenticated;
GRANT TRIGGER ON public.recorrencias_lancamento TO authenticated;
GRANT TRUNCATE ON public.recorrencias_lancamento TO authenticated;
GRANT UPDATE ON public.recorrencias_lancamento TO authenticated;
GRANT DELETE ON public.recorrencias_lancamento TO service_role;
GRANT INSERT ON public.recorrencias_lancamento TO service_role;
GRANT REFERENCES ON public.recorrencias_lancamento TO service_role;
GRANT SELECT ON public.recorrencias_lancamento TO service_role;
GRANT TRIGGER ON public.recorrencias_lancamento TO service_role;
GRANT TRUNCATE ON public.recorrencias_lancamento TO service_role;
GRANT UPDATE ON public.recorrencias_lancamento TO service_role;
GRANT DELETE ON public.reembolso_anexos TO anon;
GRANT INSERT ON public.reembolso_anexos TO anon;
GRANT REFERENCES ON public.reembolso_anexos TO anon;
GRANT SELECT ON public.reembolso_anexos TO anon;
GRANT TRIGGER ON public.reembolso_anexos TO anon;
GRANT TRUNCATE ON public.reembolso_anexos TO anon;
GRANT UPDATE ON public.reembolso_anexos TO anon;
GRANT DELETE ON public.reembolso_anexos TO authenticated;
GRANT INSERT ON public.reembolso_anexos TO authenticated;
GRANT REFERENCES ON public.reembolso_anexos TO authenticated;
GRANT SELECT ON public.reembolso_anexos TO authenticated;
GRANT TRIGGER ON public.reembolso_anexos TO authenticated;
GRANT TRUNCATE ON public.reembolso_anexos TO authenticated;
GRANT UPDATE ON public.reembolso_anexos TO authenticated;
GRANT DELETE ON public.reembolso_anexos TO service_role;
GRANT INSERT ON public.reembolso_anexos TO service_role;
GRANT REFERENCES ON public.reembolso_anexos TO service_role;
GRANT SELECT ON public.reembolso_anexos TO service_role;
GRANT TRIGGER ON public.reembolso_anexos TO service_role;
GRANT TRUNCATE ON public.reembolso_anexos TO service_role;
GRANT UPDATE ON public.reembolso_anexos TO service_role;
GRANT DELETE ON public.reembolsos TO anon;
GRANT INSERT ON public.reembolsos TO anon;
GRANT REFERENCES ON public.reembolsos TO anon;
GRANT SELECT ON public.reembolsos TO anon;
GRANT TRIGGER ON public.reembolsos TO anon;
GRANT TRUNCATE ON public.reembolsos TO anon;
GRANT UPDATE ON public.reembolsos TO anon;
GRANT DELETE ON public.reembolsos TO authenticated;
GRANT INSERT ON public.reembolsos TO authenticated;
GRANT REFERENCES ON public.reembolsos TO authenticated;
GRANT SELECT ON public.reembolsos TO authenticated;
GRANT TRIGGER ON public.reembolsos TO authenticated;
GRANT TRUNCATE ON public.reembolsos TO authenticated;
GRANT UPDATE ON public.reembolsos TO authenticated;
GRANT DELETE ON public.reembolsos TO service_role;
GRANT INSERT ON public.reembolsos TO service_role;
GRANT REFERENCES ON public.reembolsos TO service_role;
GRANT SELECT ON public.reembolsos TO service_role;
GRANT TRIGGER ON public.reembolsos TO service_role;
GRANT TRUNCATE ON public.reembolsos TO service_role;
GRANT UPDATE ON public.reembolsos TO service_role;
GRANT DELETE ON public.sales_target_monthly TO anon;
GRANT INSERT ON public.sales_target_monthly TO anon;
GRANT REFERENCES ON public.sales_target_monthly TO anon;
GRANT SELECT ON public.sales_target_monthly TO anon;
GRANT TRIGGER ON public.sales_target_monthly TO anon;
GRANT TRUNCATE ON public.sales_target_monthly TO anon;
GRANT UPDATE ON public.sales_target_monthly TO anon;
GRANT DELETE ON public.sales_target_monthly TO authenticated;
GRANT INSERT ON public.sales_target_monthly TO authenticated;
GRANT REFERENCES ON public.sales_target_monthly TO authenticated;
GRANT SELECT ON public.sales_target_monthly TO authenticated;
GRANT TRIGGER ON public.sales_target_monthly TO authenticated;
GRANT TRUNCATE ON public.sales_target_monthly TO authenticated;
GRANT UPDATE ON public.sales_target_monthly TO authenticated;
GRANT DELETE ON public.sales_target_monthly TO service_role;
GRANT INSERT ON public.sales_target_monthly TO service_role;
GRANT REFERENCES ON public.sales_target_monthly TO service_role;
GRANT SELECT ON public.sales_target_monthly TO service_role;
GRANT TRIGGER ON public.sales_target_monthly TO service_role;
GRANT TRUNCATE ON public.sales_target_monthly TO service_role;
GRANT UPDATE ON public.sales_target_monthly TO service_role;
GRANT DELETE ON public.sales_targets TO anon;
GRANT INSERT ON public.sales_targets TO anon;
GRANT REFERENCES ON public.sales_targets TO anon;
GRANT SELECT ON public.sales_targets TO anon;
GRANT TRIGGER ON public.sales_targets TO anon;
GRANT TRUNCATE ON public.sales_targets TO anon;
GRANT UPDATE ON public.sales_targets TO anon;
GRANT DELETE ON public.sales_targets TO authenticated;
GRANT INSERT ON public.sales_targets TO authenticated;
GRANT REFERENCES ON public.sales_targets TO authenticated;
GRANT SELECT ON public.sales_targets TO authenticated;
GRANT TRIGGER ON public.sales_targets TO authenticated;
GRANT TRUNCATE ON public.sales_targets TO authenticated;
GRANT UPDATE ON public.sales_targets TO authenticated;
GRANT DELETE ON public.sales_targets TO service_role;
GRANT INSERT ON public.sales_targets TO service_role;
GRANT REFERENCES ON public.sales_targets TO service_role;
GRANT SELECT ON public.sales_targets TO service_role;
GRANT TRIGGER ON public.sales_targets TO service_role;
GRANT TRUNCATE ON public.sales_targets TO service_role;
GRANT UPDATE ON public.sales_targets TO service_role;
GRANT DELETE ON public.scenarios TO anon;
GRANT INSERT ON public.scenarios TO anon;
GRANT REFERENCES ON public.scenarios TO anon;
GRANT SELECT ON public.scenarios TO anon;
GRANT TRIGGER ON public.scenarios TO anon;
GRANT TRUNCATE ON public.scenarios TO anon;
GRANT UPDATE ON public.scenarios TO anon;
GRANT DELETE ON public.scenarios TO authenticated;
GRANT INSERT ON public.scenarios TO authenticated;
GRANT REFERENCES ON public.scenarios TO authenticated;
GRANT SELECT ON public.scenarios TO authenticated;
GRANT TRIGGER ON public.scenarios TO authenticated;
GRANT TRUNCATE ON public.scenarios TO authenticated;
GRANT UPDATE ON public.scenarios TO authenticated;
GRANT DELETE ON public.scenarios TO service_role;
GRANT INSERT ON public.scenarios TO service_role;
GRANT REFERENCES ON public.scenarios TO service_role;
GRANT SELECT ON public.scenarios TO service_role;
GRANT TRIGGER ON public.scenarios TO service_role;
GRANT TRUNCATE ON public.scenarios TO service_role;
GRANT UPDATE ON public.scenarios TO service_role;
GRANT DELETE ON public.security_scan_status TO anon;
GRANT INSERT ON public.security_scan_status TO anon;
GRANT REFERENCES ON public.security_scan_status TO anon;
GRANT SELECT ON public.security_scan_status TO anon;
GRANT TRIGGER ON public.security_scan_status TO anon;
GRANT TRUNCATE ON public.security_scan_status TO anon;
GRANT UPDATE ON public.security_scan_status TO anon;
GRANT DELETE ON public.security_scan_status TO authenticated;
GRANT INSERT ON public.security_scan_status TO authenticated;
GRANT REFERENCES ON public.security_scan_status TO authenticated;
GRANT SELECT ON public.security_scan_status TO authenticated;
GRANT TRIGGER ON public.security_scan_status TO authenticated;
GRANT TRUNCATE ON public.security_scan_status TO authenticated;
GRANT UPDATE ON public.security_scan_status TO authenticated;
GRANT DELETE ON public.security_scan_status TO service_role;
GRANT INSERT ON public.security_scan_status TO service_role;
GRANT REFERENCES ON public.security_scan_status TO service_role;
GRANT SELECT ON public.security_scan_status TO service_role;
GRANT TRIGGER ON public.security_scan_status TO service_role;
GRANT TRUNCATE ON public.security_scan_status TO service_role;
GRANT UPDATE ON public.security_scan_status TO service_role;
GRANT DELETE ON public.solicitacoes_baixa_cerbro TO anon;
GRANT INSERT ON public.solicitacoes_baixa_cerbro TO anon;
GRANT REFERENCES ON public.solicitacoes_baixa_cerbro TO anon;
GRANT SELECT ON public.solicitacoes_baixa_cerbro TO anon;
GRANT TRIGGER ON public.solicitacoes_baixa_cerbro TO anon;
GRANT TRUNCATE ON public.solicitacoes_baixa_cerbro TO anon;
GRANT UPDATE ON public.solicitacoes_baixa_cerbro TO anon;
GRANT DELETE ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT INSERT ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT REFERENCES ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT SELECT ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT TRIGGER ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT TRUNCATE ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT UPDATE ON public.solicitacoes_baixa_cerbro TO authenticated;
GRANT DELETE ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT INSERT ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT REFERENCES ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT SELECT ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT TRIGGER ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT TRUNCATE ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT UPDATE ON public.solicitacoes_baixa_cerbro TO service_role;
GRANT DELETE ON public.solicitacoes_contrato TO anon;
GRANT INSERT ON public.solicitacoes_contrato TO anon;
GRANT REFERENCES ON public.solicitacoes_contrato TO anon;
GRANT SELECT ON public.solicitacoes_contrato TO anon;
GRANT TRIGGER ON public.solicitacoes_contrato TO anon;
GRANT TRUNCATE ON public.solicitacoes_contrato TO anon;
GRANT UPDATE ON public.solicitacoes_contrato TO anon;
GRANT DELETE ON public.solicitacoes_contrato TO authenticated;
GRANT INSERT ON public.solicitacoes_contrato TO authenticated;
GRANT REFERENCES ON public.solicitacoes_contrato TO authenticated;
GRANT SELECT ON public.solicitacoes_contrato TO authenticated;
GRANT TRIGGER ON public.solicitacoes_contrato TO authenticated;
GRANT TRUNCATE ON public.solicitacoes_contrato TO authenticated;
GRANT UPDATE ON public.solicitacoes_contrato TO authenticated;
GRANT DELETE ON public.solicitacoes_contrato TO service_role;
GRANT INSERT ON public.solicitacoes_contrato TO service_role;
GRANT REFERENCES ON public.solicitacoes_contrato TO service_role;
GRANT SELECT ON public.solicitacoes_contrato TO service_role;
GRANT TRIGGER ON public.solicitacoes_contrato TO service_role;
GRANT TRUNCATE ON public.solicitacoes_contrato TO service_role;
GRANT UPDATE ON public.solicitacoes_contrato TO service_role;
GRANT DELETE ON public.solicitacoes_mensagem TO anon;
GRANT INSERT ON public.solicitacoes_mensagem TO anon;
GRANT REFERENCES ON public.solicitacoes_mensagem TO anon;
GRANT SELECT ON public.solicitacoes_mensagem TO anon;
GRANT TRIGGER ON public.solicitacoes_mensagem TO anon;
GRANT TRUNCATE ON public.solicitacoes_mensagem TO anon;
GRANT UPDATE ON public.solicitacoes_mensagem TO anon;
GRANT DELETE ON public.solicitacoes_mensagem TO authenticated;
GRANT INSERT ON public.solicitacoes_mensagem TO authenticated;
GRANT REFERENCES ON public.solicitacoes_mensagem TO authenticated;
GRANT SELECT ON public.solicitacoes_mensagem TO authenticated;
GRANT TRIGGER ON public.solicitacoes_mensagem TO authenticated;
GRANT TRUNCATE ON public.solicitacoes_mensagem TO authenticated;
GRANT UPDATE ON public.solicitacoes_mensagem TO authenticated;
GRANT DELETE ON public.solicitacoes_mensagem TO service_role;
GRANT INSERT ON public.solicitacoes_mensagem TO service_role;
GRANT REFERENCES ON public.solicitacoes_mensagem TO service_role;
GRANT SELECT ON public.solicitacoes_mensagem TO service_role;
GRANT TRIGGER ON public.solicitacoes_mensagem TO service_role;
GRANT TRUNCATE ON public.solicitacoes_mensagem TO service_role;
GRANT UPDATE ON public.solicitacoes_mensagem TO service_role;
GRANT DELETE ON public.tax_rules TO anon;
GRANT INSERT ON public.tax_rules TO anon;
GRANT REFERENCES ON public.tax_rules TO anon;
GRANT SELECT ON public.tax_rules TO anon;
GRANT TRIGGER ON public.tax_rules TO anon;
GRANT TRUNCATE ON public.tax_rules TO anon;
GRANT UPDATE ON public.tax_rules TO anon;
GRANT DELETE ON public.tax_rules TO authenticated;
GRANT INSERT ON public.tax_rules TO authenticated;
GRANT REFERENCES ON public.tax_rules TO authenticated;
GRANT SELECT ON public.tax_rules TO authenticated;
GRANT TRIGGER ON public.tax_rules TO authenticated;
GRANT TRUNCATE ON public.tax_rules TO authenticated;
GRANT UPDATE ON public.tax_rules TO authenticated;
GRANT DELETE ON public.tax_rules TO service_role;
GRANT INSERT ON public.tax_rules TO service_role;
GRANT REFERENCES ON public.tax_rules TO service_role;
GRANT SELECT ON public.tax_rules TO service_role;
GRANT TRIGGER ON public.tax_rules TO service_role;
GRANT TRUNCATE ON public.tax_rules TO service_role;
GRANT UPDATE ON public.tax_rules TO service_role;
GRANT DELETE ON public.transaction_categories TO anon;
GRANT INSERT ON public.transaction_categories TO anon;
GRANT REFERENCES ON public.transaction_categories TO anon;
GRANT SELECT ON public.transaction_categories TO anon;
GRANT TRIGGER ON public.transaction_categories TO anon;
GRANT TRUNCATE ON public.transaction_categories TO anon;
GRANT UPDATE ON public.transaction_categories TO anon;
GRANT DELETE ON public.transaction_categories TO authenticated;
GRANT INSERT ON public.transaction_categories TO authenticated;
GRANT REFERENCES ON public.transaction_categories TO authenticated;
GRANT SELECT ON public.transaction_categories TO authenticated;
GRANT TRIGGER ON public.transaction_categories TO authenticated;
GRANT TRUNCATE ON public.transaction_categories TO authenticated;
GRANT UPDATE ON public.transaction_categories TO authenticated;
GRANT DELETE ON public.transaction_categories TO service_role;
GRANT INSERT ON public.transaction_categories TO service_role;
GRANT REFERENCES ON public.transaction_categories TO service_role;
GRANT SELECT ON public.transaction_categories TO service_role;
GRANT TRIGGER ON public.transaction_categories TO service_role;
GRANT TRUNCATE ON public.transaction_categories TO service_role;
GRANT UPDATE ON public.transaction_categories TO service_role;
GRANT DELETE ON public.transactions TO anon;
GRANT INSERT ON public.transactions TO anon;
GRANT REFERENCES ON public.transactions TO anon;
GRANT SELECT ON public.transactions TO anon;
GRANT TRIGGER ON public.transactions TO anon;
GRANT TRUNCATE ON public.transactions TO anon;
GRANT UPDATE ON public.transactions TO anon;
GRANT DELETE ON public.transactions TO authenticated;
GRANT INSERT ON public.transactions TO authenticated;
GRANT REFERENCES ON public.transactions TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT TRIGGER ON public.transactions TO authenticated;
GRANT TRUNCATE ON public.transactions TO authenticated;
GRANT UPDATE ON public.transactions TO authenticated;
GRANT DELETE ON public.transactions TO service_role;
GRANT INSERT ON public.transactions TO service_role;
GRANT REFERENCES ON public.transactions TO service_role;
GRANT SELECT ON public.transactions TO service_role;
GRANT TRIGGER ON public.transactions TO service_role;
GRANT TRUNCATE ON public.transactions TO service_role;
GRANT UPDATE ON public.transactions TO service_role;
GRANT DELETE ON public.user_roles TO anon;
GRANT INSERT ON public.user_roles TO anon;
GRANT REFERENCES ON public.user_roles TO anon;
GRANT SELECT ON public.user_roles TO anon;
GRANT TRIGGER ON public.user_roles TO anon;
GRANT TRUNCATE ON public.user_roles TO anon;
GRANT UPDATE ON public.user_roles TO anon;
GRANT DELETE ON public.user_roles TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;
GRANT REFERENCES ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT TRIGGER ON public.user_roles TO authenticated;
GRANT TRUNCATE ON public.user_roles TO authenticated;
GRANT UPDATE ON public.user_roles TO authenticated;
GRANT DELETE ON public.user_roles TO service_role;
GRANT INSERT ON public.user_roles TO service_role;
GRANT REFERENCES ON public.user_roles TO service_role;
GRANT SELECT ON public.user_roles TO service_role;
GRANT TRIGGER ON public.user_roles TO service_role;
GRANT TRUNCATE ON public.user_roles TO service_role;
GRANT UPDATE ON public.user_roles TO service_role;
GRANT DELETE ON public.veiculos TO anon;
GRANT INSERT ON public.veiculos TO anon;
GRANT REFERENCES ON public.veiculos TO anon;
GRANT SELECT ON public.veiculos TO anon;
GRANT TRIGGER ON public.veiculos TO anon;
GRANT TRUNCATE ON public.veiculos TO anon;
GRANT UPDATE ON public.veiculos TO anon;
GRANT DELETE ON public.veiculos TO authenticated;
GRANT INSERT ON public.veiculos TO authenticated;
GRANT REFERENCES ON public.veiculos TO authenticated;
GRANT SELECT ON public.veiculos TO authenticated;
GRANT TRIGGER ON public.veiculos TO authenticated;
GRANT TRUNCATE ON public.veiculos TO authenticated;
GRANT UPDATE ON public.veiculos TO authenticated;
GRANT DELETE ON public.veiculos TO service_role;
GRANT INSERT ON public.veiculos TO service_role;
GRANT REFERENCES ON public.veiculos TO service_role;
GRANT SELECT ON public.veiculos TO service_role;
GRANT TRIGGER ON public.veiculos TO service_role;
GRANT TRUNCATE ON public.veiculos TO service_role;
GRANT UPDATE ON public.veiculos TO service_role;
GRANT DELETE ON public.whatsapp_contatos TO anon;
GRANT INSERT ON public.whatsapp_contatos TO anon;
GRANT REFERENCES ON public.whatsapp_contatos TO anon;
GRANT SELECT ON public.whatsapp_contatos TO anon;
GRANT TRIGGER ON public.whatsapp_contatos TO anon;
GRANT TRUNCATE ON public.whatsapp_contatos TO anon;
GRANT UPDATE ON public.whatsapp_contatos TO anon;
GRANT DELETE ON public.whatsapp_contatos TO authenticated;
GRANT INSERT ON public.whatsapp_contatos TO authenticated;
GRANT REFERENCES ON public.whatsapp_contatos TO authenticated;
GRANT SELECT ON public.whatsapp_contatos TO authenticated;
GRANT TRIGGER ON public.whatsapp_contatos TO authenticated;
GRANT TRUNCATE ON public.whatsapp_contatos TO authenticated;
GRANT UPDATE ON public.whatsapp_contatos TO authenticated;
GRANT DELETE ON public.whatsapp_contatos TO service_role;
GRANT INSERT ON public.whatsapp_contatos TO service_role;
GRANT REFERENCES ON public.whatsapp_contatos TO service_role;
GRANT SELECT ON public.whatsapp_contatos TO service_role;
GRANT TRIGGER ON public.whatsapp_contatos TO service_role;
GRANT TRUNCATE ON public.whatsapp_contatos TO service_role;
GRANT UPDATE ON public.whatsapp_contatos TO service_role;
GRANT DELETE ON public.whatsapp_conversa_estado TO anon;
GRANT INSERT ON public.whatsapp_conversa_estado TO anon;
GRANT REFERENCES ON public.whatsapp_conversa_estado TO anon;
GRANT SELECT ON public.whatsapp_conversa_estado TO anon;
GRANT TRIGGER ON public.whatsapp_conversa_estado TO anon;
GRANT TRUNCATE ON public.whatsapp_conversa_estado TO anon;
GRANT UPDATE ON public.whatsapp_conversa_estado TO anon;
GRANT DELETE ON public.whatsapp_conversa_estado TO authenticated;
GRANT INSERT ON public.whatsapp_conversa_estado TO authenticated;
GRANT REFERENCES ON public.whatsapp_conversa_estado TO authenticated;
GRANT SELECT ON public.whatsapp_conversa_estado TO authenticated;
GRANT TRIGGER ON public.whatsapp_conversa_estado TO authenticated;
GRANT TRUNCATE ON public.whatsapp_conversa_estado TO authenticated;
GRANT UPDATE ON public.whatsapp_conversa_estado TO authenticated;
GRANT DELETE ON public.whatsapp_conversa_estado TO service_role;
GRANT INSERT ON public.whatsapp_conversa_estado TO service_role;
GRANT REFERENCES ON public.whatsapp_conversa_estado TO service_role;
GRANT SELECT ON public.whatsapp_conversa_estado TO service_role;
GRANT TRIGGER ON public.whatsapp_conversa_estado TO service_role;
GRANT TRUNCATE ON public.whatsapp_conversa_estado TO service_role;
GRANT UPDATE ON public.whatsapp_conversa_estado TO service_role;
GRANT DELETE ON public.whatsapp_conversas TO anon;
GRANT INSERT ON public.whatsapp_conversas TO anon;
GRANT REFERENCES ON public.whatsapp_conversas TO anon;
GRANT SELECT ON public.whatsapp_conversas TO anon;
GRANT TRIGGER ON public.whatsapp_conversas TO anon;
GRANT TRUNCATE ON public.whatsapp_conversas TO anon;
GRANT UPDATE ON public.whatsapp_conversas TO anon;
GRANT DELETE ON public.whatsapp_conversas TO authenticated;
GRANT INSERT ON public.whatsapp_conversas TO authenticated;
GRANT REFERENCES ON public.whatsapp_conversas TO authenticated;
GRANT SELECT ON public.whatsapp_conversas TO authenticated;
GRANT TRIGGER ON public.whatsapp_conversas TO authenticated;
GRANT TRUNCATE ON public.whatsapp_conversas TO authenticated;
GRANT UPDATE ON public.whatsapp_conversas TO authenticated;
GRANT DELETE ON public.whatsapp_conversas TO service_role;
GRANT INSERT ON public.whatsapp_conversas TO service_role;
GRANT REFERENCES ON public.whatsapp_conversas TO service_role;
GRANT SELECT ON public.whatsapp_conversas TO service_role;
GRANT TRIGGER ON public.whatsapp_conversas TO service_role;
GRANT TRUNCATE ON public.whatsapp_conversas TO service_role;
GRANT UPDATE ON public.whatsapp_conversas TO service_role;
GRANT DELETE ON public.whatsapp_envios TO anon;
GRANT INSERT ON public.whatsapp_envios TO anon;
GRANT REFERENCES ON public.whatsapp_envios TO anon;
GRANT SELECT ON public.whatsapp_envios TO anon;
GRANT TRIGGER ON public.whatsapp_envios TO anon;
GRANT TRUNCATE ON public.whatsapp_envios TO anon;
GRANT UPDATE ON public.whatsapp_envios TO anon;
GRANT DELETE ON public.whatsapp_envios TO authenticated;
GRANT INSERT ON public.whatsapp_envios TO authenticated;
GRANT REFERENCES ON public.whatsapp_envios TO authenticated;
GRANT SELECT ON public.whatsapp_envios TO authenticated;
GRANT TRIGGER ON public.whatsapp_envios TO authenticated;
GRANT TRUNCATE ON public.whatsapp_envios TO authenticated;
GRANT UPDATE ON public.whatsapp_envios TO authenticated;
GRANT DELETE ON public.whatsapp_envios TO service_role;
GRANT INSERT ON public.whatsapp_envios TO service_role;
GRANT REFERENCES ON public.whatsapp_envios TO service_role;
GRANT SELECT ON public.whatsapp_envios TO service_role;
GRANT TRIGGER ON public.whatsapp_envios TO service_role;
GRANT TRUNCATE ON public.whatsapp_envios TO service_role;
GRANT UPDATE ON public.whatsapp_envios TO service_role;
GRANT DELETE ON public.whatsapp_instancias TO anon;
GRANT INSERT ON public.whatsapp_instancias TO anon;
GRANT REFERENCES ON public.whatsapp_instancias TO anon;
GRANT SELECT ON public.whatsapp_instancias TO anon;
GRANT TRIGGER ON public.whatsapp_instancias TO anon;
GRANT TRUNCATE ON public.whatsapp_instancias TO anon;
GRANT UPDATE ON public.whatsapp_instancias TO anon;
GRANT DELETE ON public.whatsapp_instancias TO authenticated;
GRANT INSERT ON public.whatsapp_instancias TO authenticated;
GRANT REFERENCES ON public.whatsapp_instancias TO authenticated;
GRANT SELECT ON public.whatsapp_instancias TO authenticated;
GRANT TRIGGER ON public.whatsapp_instancias TO authenticated;
GRANT TRUNCATE ON public.whatsapp_instancias TO authenticated;
GRANT UPDATE ON public.whatsapp_instancias TO authenticated;
GRANT DELETE ON public.whatsapp_instancias TO service_role;
GRANT INSERT ON public.whatsapp_instancias TO service_role;
GRANT REFERENCES ON public.whatsapp_instancias TO service_role;
GRANT SELECT ON public.whatsapp_instancias TO service_role;
GRANT TRIGGER ON public.whatsapp_instancias TO service_role;
GRANT TRUNCATE ON public.whatsapp_instancias TO service_role;
GRANT UPDATE ON public.whatsapp_instancias TO service_role;
GRANT DELETE ON public.whatsapp_mensagens TO anon;
GRANT INSERT ON public.whatsapp_mensagens TO anon;
GRANT REFERENCES ON public.whatsapp_mensagens TO anon;
GRANT SELECT ON public.whatsapp_mensagens TO anon;
GRANT TRIGGER ON public.whatsapp_mensagens TO anon;
GRANT TRUNCATE ON public.whatsapp_mensagens TO anon;
GRANT UPDATE ON public.whatsapp_mensagens TO anon;
GRANT DELETE ON public.whatsapp_mensagens TO authenticated;
GRANT INSERT ON public.whatsapp_mensagens TO authenticated;
GRANT REFERENCES ON public.whatsapp_mensagens TO authenticated;
GRANT SELECT ON public.whatsapp_mensagens TO authenticated;
GRANT TRIGGER ON public.whatsapp_mensagens TO authenticated;
GRANT TRUNCATE ON public.whatsapp_mensagens TO authenticated;
GRANT UPDATE ON public.whatsapp_mensagens TO authenticated;
GRANT DELETE ON public.whatsapp_mensagens TO service_role;
GRANT INSERT ON public.whatsapp_mensagens TO service_role;
GRANT REFERENCES ON public.whatsapp_mensagens TO service_role;
GRANT SELECT ON public.whatsapp_mensagens TO service_role;
GRANT TRIGGER ON public.whatsapp_mensagens TO service_role;
GRANT TRUNCATE ON public.whatsapp_mensagens TO service_role;
GRANT UPDATE ON public.whatsapp_mensagens TO service_role;
GRANT DELETE ON public.whatsapp_numeros_autorizados TO anon;
GRANT INSERT ON public.whatsapp_numeros_autorizados TO anon;
GRANT REFERENCES ON public.whatsapp_numeros_autorizados TO anon;
GRANT SELECT ON public.whatsapp_numeros_autorizados TO anon;
GRANT TRIGGER ON public.whatsapp_numeros_autorizados TO anon;
GRANT TRUNCATE ON public.whatsapp_numeros_autorizados TO anon;
GRANT UPDATE ON public.whatsapp_numeros_autorizados TO anon;
GRANT DELETE ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT INSERT ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT REFERENCES ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT SELECT ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT TRIGGER ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT TRUNCATE ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT UPDATE ON public.whatsapp_numeros_autorizados TO authenticated;
GRANT DELETE ON public.whatsapp_numeros_autorizados TO service_role;
GRANT INSERT ON public.whatsapp_numeros_autorizados TO service_role;
GRANT REFERENCES ON public.whatsapp_numeros_autorizados TO service_role;
GRANT SELECT ON public.whatsapp_numeros_autorizados TO service_role;
GRANT TRIGGER ON public.whatsapp_numeros_autorizados TO service_role;
GRANT TRUNCATE ON public.whatsapp_numeros_autorizados TO service_role;
GRANT UPDATE ON public.whatsapp_numeros_autorizados TO service_role;

-- ===== RLS =====
ALTER TABLE public.automacoes_execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automacoes_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_data_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobranca_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesa_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucao_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.director_bonus_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamento_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubla_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamento_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marvee_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marvee_extrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marvee_extrato_consolidated_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marvee_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marvee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_fiscal_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelamento_dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrencia_geracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrencias_lancamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reembolso_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reembolsos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_target_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_scan_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_baixa_cerbro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversa_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_numeros_autorizados ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES (public) =====
CREATE POLICY auto_exec_select ON public.automacoes_execucoes AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY auto_regras_manage ON public.automacoes_regras AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY auto_regras_select ON public.automacoes_regras AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins can delete automations" ON public.automation_config AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert automations" ON public.automation_config AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update automations" ON public.automation_config AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins e viewers podem ver automations" ON public.automation_config AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Finance roles can read cash flow categories" ON public.cash_flow_categories AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Users with finance access can delete cash flow data" ON public.cash_flow_data AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can insert cash flow data" ON public.cash_flow_data AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can read cash flow data" ON public.cash_flow_data AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role]))))));
CREATE POLICY "Users with finance access can update cash flow data" ON public.cash_flow_data AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can delete detailed data" ON public.cash_flow_data_detailed AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can insert detailed data" ON public.cash_flow_data_detailed AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can read detailed data" ON public.cash_flow_data_detailed AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role]))))));
CREATE POLICY "Users with finance access can update detailed data" ON public.cash_flow_data_detailed AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Finance users can delete expenses" ON public.cash_flow_expenses AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Finance users can insert expenses" ON public.cash_flow_expenses AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Finance users can read expenses" ON public.cash_flow_expenses AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role]))))));
CREATE POLICY "Finance users can update expenses" ON public.cash_flow_expenses AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Finance users can delete revenues" ON public.cash_flow_revenues AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Finance users can insert revenues" ON public.cash_flow_revenues AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Finance users can read revenues" ON public.cash_flow_revenues AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role]))))));
CREATE POLICY "Finance users can update revenues" ON public.cash_flow_revenues AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY centros_custo_manage ON public.centros_custo AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY centros_custo_select ON public.centros_custo AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins e viewers podem ver centros de custo" ON public.centros_custo_ferramentas AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar centros de custo" ON public.centros_custo_ferramentas AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem criar centros de custo" ON public.centros_custo_ferramentas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir centros de custo" ON public.centros_custo_ferramentas AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY cliente_contratos_manage ON public.cliente_contratos AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY cliente_contratos_select ON public.cliente_contratos AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY clientes_manage ON public.clientes AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY clientes_select ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY cobranca_historico_insert ON public.cobranca_historico AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY cobranca_historico_select ON public.cobranca_historico AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins e viewers podem ver documentos" ON public.colaborador_documentos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem criar documentos" ON public.colaborador_documentos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir documentos" ON public.colaborador_documentos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins e viewers podem ver notas" ON public.colaborador_notas AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar notas" ON public.colaborador_notas AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem criar notas" ON public.colaborador_notas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir notas" ON public.colaborador_notas AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins e viewers podem ver todos os colaboradores" ON public.colaboradores AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar colaboradores" ON public.colaboradores AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem criar colaboradores" ON public.colaboradores AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir colaboradores" ON public.colaboradores AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Colaboradores podem ver o próprio cadastro" ON public.colaboradores AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY contas_pagar_manage ON public.contas_pagar AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY contas_pagar_select ON public.contas_pagar AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY contas_receber_manage ON public.contas_receber AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY contas_receber_select ON public.contas_receber AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY contratos_itens_manage ON public.contratos_itens AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY contratos_itens_select ON public.contratos_itens AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY despesa_categorias_manage ON public.despesa_categorias AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY despesa_categorias_select ON public.despesa_categorias AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins podem excluir anexos de devoluções" ON public.devolucao_anexos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem criar anexos para suas devoluções" ON public.devolucao_anexos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((devolucao_id IN ( SELECT devolucoes.id
   FROM devolucoes
  WHERE (devolucoes.user_id = auth.uid()))));
CREATE POLICY "Usuários podem ver anexos das suas devoluções" ON public.devolucao_anexos AS PERMISSIVE FOR SELECT TO authenticated USING (((devolucao_id IN ( SELECT devolucoes.id
   FROM devolucoes
  WHERE (devolucoes.user_id = auth.uid()))) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar devoluções" ON public.devolucoes AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir devoluções" ON public.devolucoes AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem criar devoluções" ON public.devolucoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Usuários podem ver suas próprias devoluções" ON public.devolucoes AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins can delete director_bonus_config" ON public.director_bonus_config AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert director_bonus_config" ON public.director_bonus_config AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update director_bonus_config" ON public.director_bonus_config AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Finance users can view director_bonus_config" ON public.director_bonus_config AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Users can create own drafts" ON public.drafts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own drafts" ON public.drafts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own drafts" ON public.drafts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own drafts" ON public.drafts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY empresa_usuarios_manage ON public.empresa_usuarios AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY empresa_usuarios_select ON public.empresa_usuarios AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR can_view_finance(auth.uid())));
CREATE POLICY empresas_manage_admin ON public.empresas AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY empresas_select_finance ON public.empresas AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins can delete equipamento_fotos" ON public.equipamento_fotos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert equipamento_fotos" ON public.equipamento_fotos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update equipamento_fotos" ON public.equipamento_fotos AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins ou dono podem ver fotos de equipamentos" ON public.equipamento_fotos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role) OR (EXISTS ( SELECT 1
   FROM (equipamentos e
     JOIN colaboradores c ON ((c.id = e.colaborador_id)))
  WHERE ((e.id = equipamento_fotos.equipamento_id) AND (c.user_id = auth.uid()))))));
CREATE POLICY "Admins e viewers podem ver equipamentos" ON public.equipamentos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar equipamentos" ON public.equipamentos AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem criar equipamentos" ON public.equipamentos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir equipamentos" ON public.equipamentos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins e viewers podem ver ferramentas" ON public.ferramentas AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar ferramentas" ON public.ferramentas AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem criar ferramentas" ON public.ferramentas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir ferramentas" ON public.ferramentas AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar financial_config" ON public.financial_config AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir financial_config" ON public.financial_config AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver financial_config" ON public.financial_config AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir financial_config" ON public.financial_config AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar financial_periods" ON public.financial_periods AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir financial_periods" ON public.financial_periods AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver financial_periods" ON public.financial_periods AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir financial_periods" ON public.financial_periods AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY fornecedores_manage ON public.fornecedores AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY fornecedores_select ON public.fornecedores AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admin e Finance podem atualizar goals" ON public.goals AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir goals" ON public.goals AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver goals" ON public.goals AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir goals" ON public.goals AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY hist_alt_select ON public.historico_alteracoes AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins podem atualizar eventos Hubla" ON public.hubla_webhook_events AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir eventos Hubla" ON public.hubla_webhook_events AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem ver eventos Hubla" ON public.hubla_webhook_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Finance can delete lancamento anexos" ON public.lancamento_anexos AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Finance can insert lancamento anexos" ON public.lancamento_anexos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Finance can view lancamento anexos" ON public.lancamento_anexos AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Finance can view audit log" ON public.lancamentos_auditoria AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY lancamentos_delete_finance ON public.lancamentos_empresa AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY lancamentos_insert_finance ON public.lancamentos_empresa AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY lancamentos_select_finance ON public.lancamentos_empresa AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY lancamentos_update_finance ON public.lancamentos_empresa AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem atualizar mapeamentos" ON public.marvee_category_mapping AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir mapeamentos" ON public.marvee_category_mapping AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver mapeamentos" ON public.marvee_category_mapping AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir mapeamentos" ON public.marvee_category_mapping AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users with finance access can delete extrato" ON public.marvee_extrato AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can insert extrato" ON public.marvee_extrato AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can read extrato" ON public.marvee_extrato AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role]))))));
CREATE POLICY "Users with finance access can update extrato" ON public.marvee_extrato AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can delete consolidated months" ON public.marvee_extrato_consolidated_months AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can insert consolidated months" ON public.marvee_extrato_consolidated_months AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Users with finance access can read consolidated months" ON public.marvee_extrato_consolidated_months AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role]))))));
CREATE POLICY "Admin e Finance podem ver sync logs" ON public.marvee_sync_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin e Finance podem ver marvee_transactions" ON public.marvee_transactions AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Finance users can manage transactions" ON public.marvee_transactions AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role]))))));
CREATE POLICY "Admins podem excluir materiais" ON public.materiais AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Aprovadores podem atualizar materiais" ON public.materiais AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'approver_materiais'::app_role)));
CREATE POLICY "Usuários podem criar materiais" ON public.materiais AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Usuários podem ver seus próprios materiais" ON public.materiais AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role) OR has_role(auth.uid(), 'approver_materiais'::app_role)));
CREATE POLICY "Admins can delete material items" ON public.material_itens AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all material items" ON public.material_itens AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Users can insert material items" ON public.material_itens AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM materiais m
  WHERE ((m.id = material_itens.material_id) AND (m.user_id = auth.uid())))));
CREATE POLICY "Users can view own material items" ON public.material_itens AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM materiais m
  WHERE ((m.id = material_itens.material_id) AND (m.user_id = auth.uid())))));
CREATE POLICY "Admins can manage contract templates" ON public.modelos_contrato AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar monthly_planning" ON public.monthly_planning AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir monthly_planning" ON public.monthly_planning AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver monthly_planning" ON public.monthly_planning AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir monthly_planning" ON public.monthly_planning AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar monthly_targets" ON public.monthly_targets AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir monthly_targets" ON public.monthly_targets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver monthly_targets" ON public.monthly_targets AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir monthly_targets" ON public.monthly_targets AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir anexos de notas fiscais" ON public.nota_fiscal_anexos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem criar anexos para suas notas fiscais" ON public.nota_fiscal_anexos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((nota_fiscal_id IN ( SELECT notas_fiscais.id
   FROM notas_fiscais
  WHERE (notas_fiscais.user_id = auth.uid()))));
CREATE POLICY "Usuários podem ver anexos das suas notas fiscais" ON public.nota_fiscal_anexos AS PERMISSIVE FOR SELECT TO authenticated USING (((nota_fiscal_id IN ( SELECT notas_fiscais.id
   FROM notas_fiscais
  WHERE (notas_fiscais.user_id = auth.uid()))) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar notas fiscais" ON public.notas_fiscais AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir notas fiscais" ON public.notas_fiscais AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem criar notas fiscais" ON public.notas_fiscais AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Usuários podem ver suas próprias notas fiscais" ON public.notas_fiscais AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Users can insert own notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admin/finance can read parcelamento data" ON public.parcelamento_dashboard_data AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin/finance can write parcelamento data" ON public.parcelamento_dashboard_data AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY produtos_manage ON public.produtos_servicos AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY produtos_select ON public.produtos_servicos AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY recebimentos_manage ON public.recebimentos AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY recebimentos_select ON public.recebimentos AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Admins and finance can manage geracoes" ON public.recorrencia_geracoes AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admins and finance can manage recorrencias" ON public.recorrencias_lancamento AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admins podem excluir anexos de reembolsos" ON public.reembolso_anexos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem criar anexos para seus reembolsos" ON public.reembolso_anexos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((reembolso_id IN ( SELECT reembolsos.id
   FROM reembolsos
  WHERE (reembolsos.user_id = auth.uid()))));
CREATE POLICY "Usuários podem ver anexos dos seus reembolsos" ON public.reembolso_anexos AS PERMISSIVE FOR SELECT TO authenticated USING (((reembolso_id IN ( SELECT reembolsos.id
   FROM reembolsos
  WHERE (reembolsos.user_id = auth.uid()))) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admins podem atualizar reembolsos" ON public.reembolsos AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem excluir reembolsos" ON public.reembolsos AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem criar reembolsos" ON public.reembolsos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Usuários podem ver seus próprios reembolsos" ON public.reembolsos AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY "Admin e Finance podem atualizar sales_target_monthly" ON public.sales_target_monthly AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir sales_target_monthly" ON public.sales_target_monthly AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver sales_target_monthly" ON public.sales_target_monthly AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir sales_target_monthly" ON public.sales_target_monthly AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar sales_targets" ON public.sales_targets AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir sales_targets" ON public.sales_targets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver sales_targets" ON public.sales_targets AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir sales_targets" ON public.sales_targets AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar scenarios" ON public.scenarios AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir scenarios" ON public.scenarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver scenarios" ON public.scenarios AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir scenarios" ON public.scenarios AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can read scan status" ON public.security_scan_status AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY baixa_cerbro_delete ON public.solicitacoes_baixa_cerbro AS PERMISSIVE FOR DELETE TO authenticated USING ((((user_id = auth.uid()) AND (status = 'pendente'::text)) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY baixa_cerbro_insert_own ON public.solicitacoes_baixa_cerbro AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY baixa_cerbro_select_own ON public.solicitacoes_baixa_cerbro AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY baixa_cerbro_update ON public.solicitacoes_baixa_cerbro AS PERMISSIVE FOR UPDATE TO authenticated USING ((((user_id = auth.uid()) AND (status = 'pendente'::text)) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((((user_id = auth.uid()) AND (status = 'pendente'::text)) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Authenticated users can create contract requests" ON public.solicitacoes_contrato AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Only admins can update contract requests" ON public.solicitacoes_contrato AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM colaboradores
  WHERE ((colaboradores.user_id = auth.uid()) AND (colaboradores.is_admin = true)))));
CREATE POLICY "Users can view own contract requests" ON public.solicitacoes_contrato AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM colaboradores
  WHERE ((colaboradores.user_id = auth.uid()) AND (colaboradores.is_admin = true))))));
CREATE POLICY solic_mensagem_delete ON public.solicitacoes_mensagem AS PERMISSIVE FOR DELETE TO authenticated USING ((((user_id = auth.uid()) AND (status = 'pendente'::text)) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY solic_mensagem_insert_own ON public.solicitacoes_mensagem AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY solic_mensagem_select_own ON public.solicitacoes_mensagem AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role)));
CREATE POLICY solic_mensagem_update ON public.solicitacoes_mensagem AS PERMISSIVE FOR UPDATE TO authenticated USING ((((user_id = auth.uid()) AND (status = 'pendente'::text)) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((((user_id = auth.uid()) AND (status = 'pendente'::text)) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admin e Finance podem atualizar tax_rules" ON public.tax_rules AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir tax_rules" ON public.tax_rules AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver tax_rules" ON public.tax_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir tax_rules" ON public.tax_rules AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar transaction_categories" ON public.transaction_categories AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir transaction_categories" ON public.transaction_categories AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver transaction_categories" ON public.transaction_categories AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir transaction_categories" ON public.transaction_categories AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin e Finance podem atualizar transactions" ON public.transactions AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem inserir transactions" ON public.transactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Admin e Finance podem ver transactions" ON public.transactions AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role)));
CREATE POLICY "Admin pode excluir transactions" ON public.transactions AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem ver todas as roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Usuários podem ver suas próprias roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY veiculos_manage ON public.veiculos AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY veiculos_select ON public.veiculos AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY wa_contatos_manage ON public.whatsapp_contatos AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY wa_contatos_select ON public.whatsapp_contatos AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY wa_conversas_manage ON public.whatsapp_conversas AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY wa_conversas_select ON public.whatsapp_conversas AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY wa_envios_insert ON public.whatsapp_envios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY wa_envios_select ON public.whatsapp_envios AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY wa_inst_manage ON public.whatsapp_instancias AS PERMISSIVE FOR ALL TO authenticated USING (can_manage_finance(auth.uid())) WITH CHECK (can_manage_finance(auth.uid()));
CREATE POLICY wa_inst_select ON public.whatsapp_instancias AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_finance(auth.uid()));
CREATE POLICY "Finance can read whatsapp messages" ON public.whatsapp_mensagens AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));
CREATE POLICY "Finance can manage whatsapp numbers" ON public.whatsapp_numeros_autorizados AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role)));

-- ===== STORAGE BUCKETS (criar via ferramenta de storage) =====
-- bucket: id=colaboradores-docs name=colaboradores-docs public=f file_size_limit=default
-- bucket: id=contratos-docs name=contratos-docs public=f file_size_limit=default
-- bucket: id=devolucoes name=devolucoes public=f file_size_limit=10485760
-- bucket: id=equipamentos-fotos name=equipamentos-fotos public=t file_size_limit=default
-- bucket: id=lancamentos-anexos name=lancamentos-anexos public=f file_size_limit=default
-- bucket: id=notas-fiscais name=notas-fiscais public=f file_size_limit=10485760
-- bucket: id=reembolsos name=reembolsos public=f file_size_limit=10485760

-- ===== POLICIES (storage.objects) =====
CREATE POLICY "Admins can delete contratos-docs" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'contratos-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can delete equipamentos-fotos" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'equipamentos-fotos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can read contratos-docs" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'contratos-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can update contratos-docs" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'contratos-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can update equipamentos-fotos" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'equipamentos-fotos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can upload contratos-docs" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'contratos-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can upload equipamentos-fotos" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'equipamentos-fotos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem excluir documentos de colaboradores" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'colaboradores-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem fazer upload de documentos de colaboradores" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'colaboradores-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem ver documentos de colaboradores" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (((bucket_id = 'colaboradores-docs'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem ver todos os arquivos de devoluções" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'devolucoes'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem ver todos os arquivos de notas fiscais" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'notas-fiscais'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem ver todos os arquivos de reembolsos" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'reembolsos'::text) AND has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Finance can delete lancamento files" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'lancamentos-anexos'::text) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))));
CREATE POLICY "Finance can read lancamento files" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'lancamentos-anexos'::text) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role) OR has_role(auth.uid(), 'admin_viewer'::app_role))));
CREATE POLICY "Finance can upload lancamento files" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'lancamentos-anexos'::text) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role))));
CREATE POLICY "Usuários autenticados podem fazer upload de devoluções" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'devolucoes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuários autenticados podem fazer upload de notas fiscais" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'notas-fiscais'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuários autenticados podem fazer upload de reembolsos" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'reembolsos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuários podem ver seus arquivos de devoluções" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'devolucoes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuários podem ver seus arquivos de notas fiscais" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'notas-fiscais'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
CREATE POLICY "Usuários podem ver seus arquivos de reembolsos" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'reembolsos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
