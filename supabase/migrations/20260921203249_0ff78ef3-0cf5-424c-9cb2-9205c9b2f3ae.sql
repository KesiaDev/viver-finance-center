
REVOKE ALL ON FUNCTION public.desfazer_lote(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.conciliar_faturas_cartao(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.emparelhar_transferencias(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.desfazer_lote(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.conciliar_faturas_cartao(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.emparelhar_transferencias(date) TO authenticated, service_role;
