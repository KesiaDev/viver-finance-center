-- ============================================================
-- FASE A: contas, categorias, lançamentos e motor de classificação
-- ============================================================

-- ---------- helper: normalização de texto (sem acentos, maiúsculas) ----------
CREATE OR REPLACE FUNCTION public.fin_normalize_text(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT upper(
    btrim(
      regexp_replace(
        translate(
          coalesce(_txt, ''),
          'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑýÿÝ',
          'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnNyyY'
        ),
        '\s+', ' ', 'g'
      )
    )
  )
$$;

-- ============================================================
-- 1. contas_financeiras
-- ============================================================
CREATE TABLE public.contas_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('banco','cartao','plataforma','investimento','socio')),
  moeda text NOT NULL DEFAULT 'BRL' CHECK (moeda IN ('BRL','EUR','USD')),
  conta_no_disponivel boolean NOT NULL DEFAULT true,
  final_cartao text,
  dia_vencimento integer CHECK (dia_vencimento IS NULL OR (dia_vencimento BETWEEN 1 AND 31)),
  conta_pagamento_id uuid REFERENCES public.contas_financeiras(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_financeiras TO authenticated;
GRANT ALL ON public.contas_financeiras TO service_role;
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contas_financeiras_select" ON public.contas_financeiras
  FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "contas_financeiras_manage" ON public.contas_financeiras
  FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

CREATE TRIGGER trg_upd_contas_financeiras BEFORE UPDATE ON public.contas_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contas_financeiras_empresa ON public.contas_financeiras(empresa_id);

-- ============================================================
-- 2. categorias_financeiras
-- ============================================================
CREATE TABLE public.categorias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  grupo_dre text NOT NULL CHECK (grupo_dre IN ('receita','deducao','despesa_operacional','fora_dre')),
  entra_no_dre boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE UNIQUE INDEX idx_categorias_financeiras_nome ON public.categorias_financeiras(lower(nome));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_financeiras TO authenticated;
GRANT ALL ON public.categorias_financeiras TO service_role;
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_financeiras_select" ON public.categorias_financeiras
  FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "categorias_financeiras_manage" ON public.categorias_financeiras
  FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

CREATE TRIGGER trg_upd_categorias_financeiras BEFORE UPDATE ON public.categorias_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. lancamentos
-- ============================================================
CREATE TABLE public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
  conta_id uuid REFERENCES public.contas_financeiras(id) ON DELETE SET NULL,

  data_caixa date,
  data_competencia date,

  descricao text NOT NULL DEFAULT '',
  contraparte text,

  valor_original numeric(18,2) NOT NULL DEFAULT 0,
  moeda_original text NOT NULL DEFAULT 'BRL' CHECK (moeda_original IN ('BRL','EUR','USD')),
  cotacao numeric(18,6),
  valor_brl numeric(18,2),

  categoria_id uuid REFERENCES public.categorias_financeiras(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  produto text,
  tipo text CHECK (tipo IS NULL OR tipo IN ('receita','despesa','transferencia')),

  pago_por_socio text,

  status text NOT NULL DEFAULT 'realizado' CHECK (status IN ('previsto','realizado','conciliado','cancelado')),
  status_classificacao text NOT NULL DEFAULT 'pendente' CHECK (status_classificacao IN ('pendente','regra','manual')),
  regra_id uuid,

  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('itau','wise','santander','cartao','hotmart','import','manual')),
  external_id text,
  hash_dedup text,
  import_batch_id uuid,
  observacao text,
  raw jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE UNIQUE INDEX idx_lancamentos_hash_dedup ON public.lancamentos(hash_dedup) WHERE hash_dedup IS NOT NULL;
CREATE INDEX idx_lancamentos_empresa_data ON public.lancamentos(empresa_id, data_caixa);
CREATE INDEX idx_lancamentos_categoria ON public.lancamentos(categoria_id);
CREATE INDEX idx_lancamentos_status_classificacao ON public.lancamentos(status_classificacao);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lancamentos_select" ON public.lancamentos
  FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "lancamentos_manage" ON public.lancamentos
  FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

CREATE TRIGGER trg_upd_lancamentos BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. regras_classificacao
-- ============================================================
CREATE TABLE public.regras_classificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  prioridade integer NOT NULL DEFAULT 100,
  nome text NOT NULL,
  conta_id uuid REFERENCES public.contas_financeiras(id) ON DELETE CASCADE,
  tipo_conta text CHECK (tipo_conta IS NULL OR tipo_conta IN ('banco','cartao','plataforma','investimento','socio')),
  campo text NOT NULL DEFAULT 'contraparte' CHECK (campo IN ('contraparte','descricao')),
  operador text NOT NULL DEFAULT 'contem' CHECK (operador IN ('igual','contem','comeca_com','regex')),
  padrao text NOT NULL,
  valor_min numeric(18,2),
  valor_max numeric(18,2),
  sinal text NOT NULL DEFAULT 'ambos' CHECK (sinal IN ('entrada','saida','ambos')),
  categoria_id uuid REFERENCES public.categorias_financeiras(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL,
  empresa_id_destino uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  tipo text CHECK (tipo IS NULL OR tipo IN ('receita','despesa','transferencia')),
  ativo boolean NOT NULL DEFAULT true,
  vezes_aplicada integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX idx_regras_classificacao_prioridade ON public.regras_classificacao(ativo, prioridade);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_classificacao TO authenticated;
GRANT ALL ON public.regras_classificacao TO service_role;
ALTER TABLE public.regras_classificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_classificacao_select" ON public.regras_classificacao
  FOR SELECT TO authenticated USING (public.can_view_finance(auth.uid()));
CREATE POLICY "regras_classificacao_manage" ON public.regras_classificacao
  FOR ALL TO authenticated
  USING (public.can_manage_finance(auth.uid()))
  WITH CHECK (public.can_manage_finance(auth.uid()));

CREATE TRIGGER trg_upd_regras_classificacao BEFORE UPDATE ON public.regras_classificacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_regra_id_fkey
  FOREIGN KEY (regra_id) REFERENCES public.regras_classificacao(id) ON DELETE SET NULL;

-- ============================================================
-- hash de deduplicação
-- ============================================================
CREATE OR REPLACE FUNCTION public.lancamentos_set_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base text;
  v_hash text;
  v_try integer := 0;
BEGIN
  IF NEW.hash_dedup IS NULL THEN
    v_base := md5(
      coalesce(NEW.conta_id::text, '') || '|' ||
      coalesce(NEW.data_caixa::text, '') || '|' ||
      coalesce(NEW.valor_original::text, '') || '|' ||
      lower(btrim(coalesce(NEW.descricao, '')))
    );
    v_hash := v_base;
    WHILE EXISTS (SELECT 1 FROM public.lancamentos l WHERE l.hash_dedup = v_hash AND l.id <> NEW.id) LOOP
      v_try := v_try + 1;
      v_hash := v_base || ':' || v_try::text;
    END LOOP;
    NEW.hash_dedup := v_hash;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lancamentos_hash BEFORE INSERT ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.lancamentos_set_hash();

-- ============================================================
-- auditoria de lançamentos
-- ============================================================
CREATE OR REPLACE FUNCTION public.lancamentos_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.historico_alteracoes (tabela, registro_id, acao, valor_anterior, valor_novo, changed_by)
    VALUES ('lancamentos', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.historico_alteracoes (tabela, registro_id, acao, valor_anterior, valor_novo, changed_by)
    VALUES ('lancamentos', OLD.id, 'DELETE', to_jsonb(OLD), NULL, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_lancamentos_audit
  AFTER UPDATE OR DELETE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.lancamentos_audit();

-- ============================================================
-- 5. motor de classificação
-- ============================================================
CREATE OR REPLACE FUNCTION public.classificar_lancamento(p_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lanc public.lancamentos%ROWTYPE;
  v_conta public.contas_financeiras%ROWTYPE;
  v_regra public.regras_classificacao%ROWTYPE;
  v_alvo text;
  v_padrao text;
  v_match boolean;
BEGIN
  SELECT * INTO v_lanc FROM public.lancamentos WHERE id = p_id;
  IF NOT FOUND OR v_lanc.categoria_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  IF v_lanc.conta_id IS NOT NULL THEN
    SELECT * INTO v_conta FROM public.contas_financeiras WHERE id = v_lanc.conta_id;
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
    IF v_regra.sinal = 'saida' AND coalesce(v_lanc.valor_original, 0) >= 0 THEN
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
$$;

CREATE OR REPLACE FUNCTION public.lancamentos_auto_classificar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.categoria_id IS NULL THEN
    PERFORM public.classificar_lancamento(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_lancamentos_auto_classificar
  AFTER INSERT ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.lancamentos_auto_classificar();

CREATE OR REPLACE FUNCTION public.reclassificar_pendentes(p_empresa_id uuid DEFAULT NULL, p_mes date DEFAULT NULL)
RETURNS TABLE(total integer, classificados integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_total integer := 0;
  v_ok integer := 0;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para reclassificar lançamentos';
  END IF;

  FOR r IN
    SELECT id FROM public.lancamentos
    WHERE status_classificacao = 'pendente'
      AND categoria_id IS NULL
      AND (p_empresa_id IS NULL OR empresa_id = p_empresa_id)
      AND (p_mes IS NULL OR (data_caixa >= date_trunc('month', p_mes)::date
           AND data_caixa < (date_trunc('month', p_mes) + interval '1 month')::date))
  LOOP
    v_total := v_total + 1;
    IF public.classificar_lancamento(r.id) IS NOT NULL THEN
      v_ok := v_ok + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_total, v_ok;
END;
$$;

-- ============================================================
-- SEEDS
-- ============================================================

-- centros de custo
INSERT INTO public.centros_custo (nome, codigo, ativo)
SELECT v.nome, v.nome, true
FROM (VALUES ('ADM'),('CS'),('MARKETING'),('COMERCIAL'),('PROJETOS'),('AGENCIA'),('INFOEDITORA'),('CONSULTORIAS'),('FREELANCER')) AS v(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.centros_custo c WHERE public.fin_normalize_text(c.nome) = public.fin_normalize_text(v.nome)
);

-- categorias
INSERT INTO public.categorias_financeiras (nome, grupo_dre, entra_no_dre, ordem)
VALUES
  ('FGRS','receita',true,10),
  ('Traffic Master','receita',true,20),
  ('Accelerator','receita',true,30),
  ('Mentoria','receita',true,40),
  ('Imersão Presencial','receita',true,50),
  ('Master and Scale','receita',true,60),
  ('Estrategista de Infoprodutos','receita',true,70),
  ('Reset Relacional','receita',true,80),

  ('Comissões','deducao',true,110),
  ('Taxa da Hotmart','deducao',true,120),
  ('Impostos','deducao',true,130),
  ('Reembolsos','deducao',true,140),
  ('Eventos','deducao',true,150),
  ('Tráfego','deducao',true,160),

  ('Salários','despesa_operacional',true,210),
  ('Ferramentas','despesa_operacional',true,220),
  ('Mentorias','despesa_operacional',true,230),
  ('Consultorias ACC','despesa_operacional',true,240),
  ('Indominus','despesa_operacional',true,250),
  ('Agência LAD Scale','despesa_operacional',true,260),
  ('All in Media','despesa_operacional',true,270),
  ('Outras despesas','despesa_operacional',true,280),

  ('Transferência entre contas','fora_dre',false,310),
  ('Pagamento de fatura de cartão','fora_dre',false,320),
  ('Antecipação de lucros','fora_dre',false,330),
  ('Rendimentos','fora_dre',false,340),
  ('Aporte/Resgate de investimento','fora_dre',false,350)
ON CONFLICT DO NOTHING;

-- contas financeiras da LL Mídia
DO $seed$
DECLARE
  v_empresa uuid;
  v_itau uuid;
  v_santander uuid;
BEGIN
  SELECT id INTO v_empresa FROM public.empresas WHERE slug = 'll-midia';
  IF v_empresa IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.contas_financeiras (empresa_id, nome, tipo, moeda, conta_no_disponivel)
  VALUES
    (v_empresa,'Itaú','banco','BRL',true),
    (v_empresa,'Wise','banco','EUR',true),
    (v_empresa,'Santander','banco','BRL',true),
    (v_empresa,'Payoneer','plataforma','USD',true),
    (v_empresa,'Hotmart','plataforma','USD',false),
    (v_empresa,'XP','investimento','BRL',false),
    (v_empresa,'Saldo Alan','socio','BRL',false),
    (v_empresa,'Caixa Luciano','socio','BRL',false);

  SELECT id INTO v_itau FROM public.contas_financeiras WHERE empresa_id = v_empresa AND nome = 'Itaú';
  SELECT id INTO v_santander FROM public.contas_financeiras WHERE empresa_id = v_empresa AND nome = 'Santander';

  INSERT INTO public.contas_financeiras (empresa_id, nome, tipo, moeda, conta_no_disponivel, final_cartao, conta_pagamento_id)
  VALUES
    (v_empresa,'Cartão Azul','cartao','BRL',false,'5219',v_itau),
    (v_empresa,'Cartão Itaú Empresa','cartao','BRL',false,'3416, 0224',v_itau),
    (v_empresa,'Cartão The One','cartao','BRL',false,NULL,v_itau),
    (v_empresa,'Cartão Santander','cartao','BRL',false,NULL,v_santander);
END;
$seed$;

-- regras fixas de prioridade alta
DO $regras$
DECLARE
  v_empresa uuid;
  v_itau uuid;
  v_cat_fatura uuid;
  v_cat_transf uuid;
  v_cat_impostos uuid;
BEGIN
  SELECT id INTO v_empresa FROM public.empresas WHERE slug = 'll-midia';
  SELECT id INTO v_itau FROM public.contas_financeiras WHERE empresa_id = v_empresa AND nome = 'Itaú';
  SELECT id INTO v_cat_fatura FROM public.categorias_financeiras WHERE nome = 'Pagamento de fatura de cartão';
  SELECT id INTO v_cat_transf FROM public.categorias_financeiras WHERE nome = 'Transferência entre contas';
  SELECT id INTO v_cat_impostos FROM public.categorias_financeiras WHERE nome = 'Impostos';

  INSERT INTO public.regras_classificacao (prioridade, nome, conta_id, campo, operador, padrao, sinal, categoria_id, tipo)
  VALUES
    (1,'Itaú: fatura de cartão (Itau Unibanco Holding)', v_itau, 'descricao','contem','Itau Unibanco Holding','saida', v_cat_fatura,'transferencia'),
    (1,'Itaú: fatura de cartão (Business 4004)', v_itau, 'descricao','contem','Business 4004','saida', v_cat_fatura,'transferencia');

  INSERT INTO public.regras_classificacao (prioridade, nome, campo, operador, padrao, sinal, categoria_id, tipo)
  VALUES
    (2,'Transferência entre contas (TRANSF ENTRE CONTAS)','descricao','contem','TRANSF ENTRE CONTAS','ambos', v_cat_transf,'transferencia'),
    (2,'Transferência entre contas','descricao','contem','Transferencia entre contas','ambos', v_cat_transf,'transferencia'),
    (3,'Receita Federal → Impostos','contraparte','contem','Receita Federal','saida', v_cat_impostos,'despesa'),
    (3,'Município → Impostos','contraparte','contem','Municipio de','saida', v_cat_impostos,'despesa');
END;
$regras$;