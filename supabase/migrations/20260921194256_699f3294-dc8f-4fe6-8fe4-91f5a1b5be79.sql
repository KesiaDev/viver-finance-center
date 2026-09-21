REVOKE ALL ON FUNCTION public.classificar_lancamento(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reclassificar_pendentes(uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fin_normalize_text(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.classificar_lancamento(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reclassificar_pendentes(uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fin_normalize_text(text) TO authenticated, service_role;