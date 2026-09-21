-- ============ 1. CÂMBIO ============
CREATE TABLE public.cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  moeda text NOT NULL CHECK (moeda IN ('EUR','USD')),
  taxa_brl numeric(18,6) NOT NULL CHECK (taxa_brl > 0),
  fonte text NOT NULL DEFAULT 'bcb_ptax' CHECK (fonte IN ('bcb_ptax','wise','manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (data, moeda, fonte)
);
CREATE INDEX idx_cotacoes_moeda_data ON public.cotacoes (moeda, data DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT ALL ON public.cotacoes TO service_role;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotacoes_select" ON public.cotacoes FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "cotacoes_write" ON public.cotacoes FOR ALL TO authenticated USING (public.can_manage_finance(auth.uid())) WITH CHECK (public.can_manage_finance(auth.uid()));
CREATE TRIGGER trg_cotacoes_updated BEFORE UPDATE ON public.cotacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.financial_config ADD COLUMN IF NOT EXISTS value_text text;
ALTER TABLE public.financial_config ALTER COLUMN value DROP NOT NULL;
INSERT INTO public.financial_config (key, value, value_text, description)
VALUES ('fonte_cambio_padrao', NULL, 'bcb_ptax', 'Fonte de câmbio usada quando o extrato não traz cotação própria')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.cotacao_do_dia(p_moeda text, p_data date)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT taxa_brl FROM public.cotacoes
  WHERE moeda = p_moeda AND data <= p_data
  ORDER BY data DESC,
    CASE fonte WHEN 'manual' THEN 0 WHEN 'bcb_ptax' THEN 1 ELSE 2 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cotacao_ultimo_dia_mes(p_moeda text, p_ano integer, p_mes integer)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.cotacao_do_dia(
    p_moeda,
    (make_date(p_ano, p_mes, 1) + interval '1 month - 1 day')::date
  );
$$;

REVOKE ALL ON FUNCTION public.cotacao_do_dia(text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cotacao_ultimo_dia_mes(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cotacao_do_dia(text, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cotacao_ultimo_dia_mes(text, integer, integer) TO authenticated, service_role;

-- ============ 2. MODELOS DE IMPORTAÇÃO ============
CREATE TABLE public.modelos_importacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  conta_id uuid NOT NULL REFERENCES public.contas_financeiras(id) ON DELETE CASCADE,
  formato text NOT NULL CHECK (formato IN ('ofx','csv','xlsx','wise_csv','fatura_csv','fatura_pdf')),
  nome text,
  mapeamento jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (conta_id, formato)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modelos_importacao TO authenticated;
GRANT ALL ON public.modelos_importacao TO service_role;
ALTER TABLE public.modelos_importacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modelos_importacao_select" ON public.modelos_importacao FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "modelos_importacao_write" ON public.modelos_importacao FOR ALL TO authenticated USING (public.can_manage_finance(auth.uid())) WITH CHECK (public.can_manage_finance(auth.uid()));
CREATE TRIGGER trg_modelos_importacao_updated BEFORE UPDATE ON public.modelos_importacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. LOTES DE IMPORTAÇÃO ============
CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  conta_id uuid NOT NULL REFERENCES public.contas_financeiras(id),
  mes_referencia date NOT NULL,
  formato text NOT NULL,
  nome_ficheiro text,
  linhas_total integer NOT NULL DEFAULT 0,
  linhas_gravadas integer NOT NULL DEFAULT 0,
  linhas_duplicadas integer NOT NULL DEFAULT 0,
  total_entradas numeric(18,2) NOT NULL DEFAULT 0,
  total_saidas numeric(18,2) NOT NULL DEFAULT 0,
  saldo_final_extrato numeric(18,2),
  desfeito_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_import_batches_conta_mes ON public.import_batches (conta_id, mes_referencia DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_batches_select" ON public.import_batches FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "import_batches_write" ON public.import_batches FOR ALL TO authenticated USING (public.can_manage_finance(auth.uid())) WITH CHECK (public.can_manage_finance(auth.uid()));
CREATE TRIGGER trg_import_batches_updated BEFORE UPDATE ON public.import_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 4. FATURAS DE CARTÃO ============
CREATE TABLE public.faturas_cartao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  cartao_id uuid NOT NULL REFERENCES public.contas_financeiras(id) ON DELETE CASCADE,
  mes_referencia date NOT NULL,
  vencimento date NOT NULL,
  valor_total numeric(18,2) NOT NULL DEFAULT 0,
  lancamento_pagamento_id uuid REFERENCES public.lancamentos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','paga','divergente')),
  diferenca numeric(18,2) NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (cartao_id, mes_referencia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturas_cartao TO authenticated;
GRANT ALL ON public.faturas_cartao TO service_role;
ALTER TABLE public.faturas_cartao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faturas_cartao_select" ON public.faturas_cartao FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "faturas_cartao_write" ON public.faturas_cartao FOR ALL TO authenticated USING (public.can_manage_finance(auth.uid())) WITH CHECK (public.can_manage_finance(auth.uid()));
CREATE TRIGGER trg_faturas_cartao_updated BEFORE UPDATE ON public.faturas_cartao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 5. SALDOS BANCÁRIOS ============
CREATE TABLE public.saldos_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id),
  conta_id uuid NOT NULL REFERENCES public.contas_financeiras(id) ON DELETE CASCADE,
  data date NOT NULL,
  saldo_original numeric(18,2) NOT NULL,
  moeda text NOT NULL DEFAULT 'BRL',
  saldo_brl numeric(18,2),
  origem text NOT NULL DEFAULT 'extrato' CHECK (origem IN ('extrato','manual','calculado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (conta_id, data, origem)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saldos_bancarios TO authenticated;
GRANT ALL ON public.saldos_bancarios TO service_role;
ALTER TABLE public.saldos_bancarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saldos_bancarios_select" ON public.saldos_bancarios FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "saldos_bancarios_write" ON public.saldos_bancarios FOR ALL TO authenticated USING (public.can_manage_finance(auth.uid())) WITH CHECK (public.can_manage_finance(auth.uid()));
CREATE TRIGGER trg_saldos_bancarios_updated BEFORE UPDATE ON public.saldos_bancarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. LANÇAMENTOS: FATURA E PAR DE TRANSFERÊNCIA ============
ALTER TABLE public.lancamentos
  ADD COLUMN IF NOT EXISTS fatura_id uuid REFERENCES public.faturas_cartao(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS par_transferencia_id uuid REFERENCES public.lancamentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lancamentos_fatura ON public.lancamentos (fatura_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_batch ON public.lancamentos (import_batch_id);

-- ============ 7. CATEGORIA NOVA ============
INSERT INTO public.categorias_financeiras (nome, grupo_dre, entra_no_dre, ordem, ativo)
SELECT 'Projetos antigos (Luciano)', 'fora_dre', false, 360, true
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_financeiras WHERE nome = 'Projetos antigos (Luciano)');

-- ============ 8. MOTOR: ESTORNOS DE CARTÃO ============
CREATE OR REPLACE FUNCTION public.classificar_lancamento(p_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  v_lanc public.lancamentos%ROWTYPE;
  v_conta public.contas_financeiras%ROWTYPE;
  v_regra public.regras_classificacao%ROWTYPE;
  v_alvo text;
  v_padrao text;
  v_match boolean;
  v_cartao boolean := false;
BEGIN
  SELECT * INTO v_lanc FROM public.lancamentos WHERE id = p_id;
  IF NOT FOUND OR v_lanc.categoria_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  IF v_lanc.conta_id IS NOT NULL THEN
    SELECT * INTO v_conta FROM public.contas_financeiras WHERE id = v_lanc.conta_id;
    v_cartao := coalesce(v_conta.tipo, '') = 'cartao';
  END IF;

  FOR v_regra IN
    SELECT * FROM public.regras_classificacao
    WHERE ativo = true
    ORDER BY prioridade ASC, created_at ASC
  LOOP
    IF v_regra.empresa_id IS NOT NULL AND v_regra.empresa_id <> v_lanc.empresa_id THEN
      CONTINUE;
    END IF;
    IF v_regra.conta_id IS NOT NULL AND v_regra.conta_id IS DISTINCT FROM v_lanc.conta_id THEN
      CONTINUE;
    END IF;
    IF v_regra.tipo_conta IS NOT NULL AND v_regra.tipo_conta IS DISTINCT FROM v_conta.tipo THEN
      CONTINUE;
    END IF;
    IF v_regra.sinal = 'entrada' AND coalesce(v_lanc.valor_original, 0) <= 0 THEN
      CONTINUE;
    END IF;
    -- Em cartões, as regras de saída apanham também os estornos (valores positivos)
    IF v_regra.sinal = 'saida' AND coalesce(v_lanc.valor_original, 0) >= 0 AND NOT v_cartao THEN
      CONTINUE;
    END IF;
    IF v_regra.valor_min IS NOT NULL AND abs(coalesce(v_lanc.valor_original, 0)) < v_regra.valor_min THEN
      CONTINUE;
    END IF;
    IF v_regra.valor_max IS NOT NULL AND abs(coalesce(v_lanc.valor_original, 0)) > v_regra.valor_max THEN
      CONTINUE;
    END IF;

    IF v_regra.campo = 'descricao' THEN
      v_alvo := public.fin_normalize_text(v_lanc.descricao);
    ELSE
      v_alvo := public.fin_normalize_text(coalesce(v_lanc.contraparte, v_lanc.descricao));
    END IF;
    v_padrao := public.fin_normalize_text(v_regra.padrao);

    v_match := CASE v_regra.operador
      WHEN 'igual' THEN v_alvo = v_padrao
      WHEN 'contem' THEN position(v_padrao IN v_alvo) > 0
      WHEN 'comeca_com' THEN v_alvo LIKE v_padrao || '%'
      WHEN 'regex' THEN v_alvo ~ v_padrao
      ELSE false
    END;

    IF v_match THEN
      UPDATE public.lancamentos
      SET categoria_id = coalesce(v_regra.categoria_id, categoria_id),
          centro_custo_id = coalesce(v_regra.centro_custo_id, centro_custo_id),
          tipo = coalesce(v_regra.tipo, tipo),
          empresa_id = coalesce(v_regra.empresa_id_destino, empresa_id),
          status_classificacao = 'regra',
          regra_id = v_regra.id
      WHERE id = p_id;

      UPDATE public.regras_classificacao
      SET vezes_aplicada = vezes_aplicada + 1
      WHERE id = v_regra.id;

      RETURN v_regra.id;
    END IF;
  END LOOP;

  UPDATE public.lancamentos
  SET status_classificacao = 'pendente'
  WHERE id = p_id AND status_classificacao <> 'manual';

  RETURN NULL;
END;
$function$;

-- ============ 9. TRÊS REGRAS NOVAS ============
INSERT INTO public.regras_classificacao
  (prioridade, nome, conta_id, campo, operador, padrao, sinal, categoria_id, centro_custo_id, tipo, ativo)
SELECT 4, 'Santander — pagamento de fatura do cartão',
  (SELECT id FROM public.contas_financeiras WHERE nome = 'Santander' AND tipo = 'banco' LIMIT 1),
  'descricao', 'contem', 'CARTAO', 'saida',
  (SELECT id FROM public.categorias_financeiras WHERE nome = 'Pagamento de fatura de cartão' LIMIT 1),
  NULL, 'transferencia', true
WHERE NOT EXISTS (SELECT 1 FROM public.regras_classificacao WHERE nome = 'Santander — pagamento de fatura do cartão');

INSERT INTO public.regras_classificacao
  (prioridade, nome, conta_id, campo, operador, padrao, sinal, categoria_id, centro_custo_id, tipo, ativo)
SELECT 4, 'Santander — transferência LL MIDIA',
  (SELECT id FROM public.contas_financeiras WHERE nome = 'Santander' AND tipo = 'banco' LIMIT 1),
  'contraparte', 'contem', 'LL MIDIA', 'ambos',
  (SELECT id FROM public.categorias_financeiras WHERE nome = 'Transferência entre contas' LIMIT 1),
  NULL, 'transferencia', true
WHERE NOT EXISTS (SELECT 1 FROM public.regras_classificacao WHERE nome = 'Santander — transferência LL MIDIA');

INSERT INTO public.regras_classificacao
  (prioridade, nome, conta_id, campo, operador, padrao, sinal, categoria_id, centro_custo_id, tipo, ativo)
SELECT 5, 'Santander — entrada DESCONHECIDO (projetos antigos)',
  (SELECT id FROM public.contas_financeiras WHERE nome = 'Santander' AND tipo = 'banco' LIMIT 1),
  'contraparte', 'igual', 'DESCONHECIDO', 'entrada',
  (SELECT id FROM public.categorias_financeiras WHERE nome = 'Projetos antigos (Luciano)' LIMIT 1),
  NULL, 'transferencia', true
WHERE NOT EXISTS (SELECT 1 FROM public.regras_classificacao WHERE nome = 'Santander — entrada DESCONHECIDO (projetos antigos)');