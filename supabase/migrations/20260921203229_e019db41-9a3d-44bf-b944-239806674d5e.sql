
-- =============== desfazer_lote ===============
CREATE OR REPLACE FUNCTION public.desfazer_lote(p_batch_id uuid)
RETURNS TABLE(apagados integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mes date;
  v_fechado boolean;
  v_apagados integer;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para desfazer lotes';
  END IF;

  SELECT mes_referencia INTO v_mes FROM public.import_batches WHERE id = p_batch_id;
  IF v_mes IS NULL THEN
    RAISE EXCEPTION 'Lote não encontrado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.financial_periods
    WHERE status = 'closed'
      AND date_trunc('month', make_date(year, month, 1)) = date_trunc('month', v_mes)
  ) INTO v_fechado;

  IF v_fechado THEN
    RAISE EXCEPTION 'O mês deste lote já está fechado';
  END IF;

  DELETE FROM public.lancamentos WHERE import_batch_id = p_batch_id;
  GET DIAGNOSTICS v_apagados = ROW_COUNT;

  UPDATE public.import_batches
     SET desfeito_em = now(), updated_at = now()
   WHERE id = p_batch_id;

  RETURN QUERY SELECT v_apagados;
END;
$$;

GRANT EXECUTE ON FUNCTION public.desfazer_lote(uuid) TO authenticated;

-- =============== conciliar_faturas_cartao ===============
CREATE OR REPLACE FUNCTION public.conciliar_faturas_cartao(p_mes date)
RETURNS TABLE(fatura_id uuid, cartao text, valor_total numeric, pago numeric, diferenca numeric, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  f RECORD;
  v_pag RECORD;
  v_soma numeric;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  FOR f IN
    SELECT fc.*, c.nome AS cartao_nome, c.conta_pagamento_id
      FROM public.faturas_cartao fc
      JOIN public.contas_financeiras c ON c.id = fc.cartao_id
     WHERE date_trunc('month', fc.vencimento) = date_trunc('month', p_mes)
  LOOP
    SELECT COALESCE(SUM(-l.valor_original), 0) INTO v_soma
      FROM public.lancamentos l
     WHERE l.fatura_id = f.id;

    v_pag := NULL;
    IF f.conta_pagamento_id IS NOT NULL THEN
      SELECT l.* INTO v_pag
        FROM public.lancamentos l
       WHERE l.conta_id = f.conta_pagamento_id
         AND l.valor_original < 0
         AND abs(abs(l.valor_original) - f.valor_total) <= 1
         AND l.data_caixa BETWEEN f.vencimento - 5 AND f.vencimento + 5
         AND NOT EXISTS (
           SELECT 1 FROM public.faturas_cartao x
            WHERE x.lancamento_pagamento_id = l.id AND x.id <> f.id
         )
       ORDER BY abs(l.data_caixa - f.vencimento)
       LIMIT 1;
    END IF;

    UPDATE public.faturas_cartao fc
       SET lancamento_pagamento_id = COALESCE(v_pag.id, fc.lancamento_pagamento_id),
           diferenca = ROUND(v_soma - fc.valor_total, 2),
           status = CASE
                      WHEN abs(v_soma - fc.valor_total) > 1 THEN 'divergente'
                      WHEN v_pag.id IS NOT NULL THEN 'paga'
                      ELSE 'aberta'
                    END,
           updated_at = now()
     WHERE fc.id = f.id;

    RETURN QUERY
      SELECT f.id, f.cartao_nome, f.valor_total, v_soma,
             ROUND(v_soma - f.valor_total, 2),
             (SELECT status FROM public.faturas_cartao WHERE id = f.id);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.conciliar_faturas_cartao(date) TO authenticated;

-- =============== emparelhar_transferencias ===============
CREATE OR REPLACE FUNCTION public.emparelhar_transferencias(p_mes date)
RETURNS TABLE(pares integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  e RECORD;
  v_cat uuid;
  v_pares integer := 0;
  v_par uuid;
BEGIN
  IF NOT public.can_manage_finance(auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT id INTO v_cat FROM public.categorias_financeiras
   WHERE nome = 'Transferência entre contas' LIMIT 1;

  FOR s IN
    SELECT l.id, l.conta_id, l.data_caixa, l.valor_original, l.moeda_original
      FROM public.lancamentos l
     WHERE date_trunc('month', l.data_caixa) = date_trunc('month', p_mes)
       AND l.valor_original < 0
       AND l.par_transferencia_id IS NULL
     ORDER BY l.data_caixa
  LOOP
    SELECT l.id INTO e
      FROM public.lancamentos l
     WHERE l.par_transferencia_id IS NULL
       AND l.id <> s.id
       AND l.conta_id IS DISTINCT FROM s.conta_id
       AND l.valor_original > 0
       AND l.moeda_original = s.moeda_original
       AND abs(l.valor_original + s.valor_original) <= 0.01
       AND abs(l.data_caixa - s.data_caixa) <= 3
     ORDER BY abs(l.data_caixa - s.data_caixa)
     LIMIT 1;

    IF e.id IS NOT NULL THEN
      v_par := gen_random_uuid();
      UPDATE public.lancamentos
         SET par_transferencia_id = v_par,
             tipo = 'transferencia',
             categoria_id = COALESCE(categoria_id, v_cat),
             status_classificacao = CASE WHEN status_classificacao = 'pendente'
                                         THEN 'regra' ELSE status_classificacao END,
             updated_at = now()
       WHERE id IN (s.id, e.id);
      v_pares := v_pares + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_pares;
END;
$$;

GRANT EXECUTE ON FUNCTION public.emparelhar_transferencias(date) TO authenticated;
