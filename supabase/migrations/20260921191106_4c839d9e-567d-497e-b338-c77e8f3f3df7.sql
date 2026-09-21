
-- 1) Feature flag para integrações legadas (Hubla/Marvee/Metabase). 0 = desligado
INSERT INTO public.financial_config (key, value, description)
VALUES ('legacy_integrations_enabled', 0, 'Integrações legadas (Hubla/Marvee/Metabase). 0 = desligado, 1 = ligado')
ON CONFLICT (key) DO NOTHING;

-- 2) Empresas do grupo
INSERT INTO public.empresas (nome, slug, ativo, ordem, cor)
VALUES ('LL Mídia', 'll-midia', true, 1, '#2563eb')
ON CONFLICT DO NOTHING;

INSERT INTO public.empresas (nome, slug, ativo, ordem, cor)
VALUES ('Infoeditora', 'infoeditora', true, 2, '#16a34a')
ON CONFLICT DO NOTHING;

-- 3) Escrita em empresas apenas para admin
DROP POLICY IF EXISTS empresas_manage_admin ON public.empresas;
CREATE POLICY empresas_manage_admin ON public.empresas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Função temporária de exportação do schema (removida na migração seguinte)
CREATE OR REPLACE FUNCTION public.dump_schema_ddl()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $dump$
DECLARE
  out text := '';
  r record;
  cols text;
BEGIN
  out := out || E'-- Snapshot completo do schema public (gerado automaticamente)\n';
  out := out || E'-- Objetivo: permitir recriar a base do zero a partir do repositorio.\n\n';

  out := out || E'-- ===== ENUMS =====\n';
  FOR r IN
    SELECT t.typname, string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname ORDER BY t.typname
  LOOP
    out := out || format(E'CREATE TYPE public.%I AS ENUM (%s);\n', r.typname, r.labels);
  END LOOP;

  out := out || E'\n-- ===== TABELAS =====\n';
  FOR r IN
    SELECT c.oid, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname
  LOOP
    SELECT string_agg(
      format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
        CASE WHEN ad.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid) ELSE '' END,
        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END),
      E',\n' ORDER BY a.attnum)
    INTO cols
    FROM pg_attribute a
    LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    WHERE a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped;
    out := out || format(E'\nCREATE TABLE IF NOT EXISTS public.%I (\n%s\n);\n', r.relname, cols);
  END LOOP;

  out := out || E'\n-- ===== CONSTRAINTS =====\n';
  FOR r IN
    SELECT con.conname, cl.relname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE n.nspname = 'public'
    ORDER BY cl.relname, con.contype DESC, con.conname
  LOOP
    out := out || format(E'ALTER TABLE public.%I ADD CONSTRAINT %I %s;\n', r.relname, r.conname, r.def);
  END LOOP;

  out := out || E'\n-- ===== INDICES =====\n';
  FOR r IN
    SELECT i.indexdef FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class cl ON cl.oid = c.conrelid
                      JOIN pg_namespace n ON n.oid = cl.relnamespace
                      WHERE n.nspname = 'public' AND c.conname = i.indexname)
    ORDER BY i.tablename, i.indexname
  LOOP
    out := out || r.indexdef || E';\n';
  END LOOP;

  out := out || E'\n-- ===== FUNCOES =====\n';
  FOR r IN
    SELECT pg_get_functiondef(p.oid) AS def FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p') AND p.proname <> 'dump_schema_ddl'
    ORDER BY p.proname
  LOOP
    out := out || E'\n' || r.def || E';\n';
  END LOOP;

  out := out || E'\n-- ===== VIEWS =====\n';
  FOR r IN
    SELECT c.relname, pg_get_viewdef(c.oid, true) AS def FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v','m') ORDER BY c.relname
  LOOP
    out := out || format(E'\nCREATE OR REPLACE VIEW public.%I AS\n%s\n', r.relname, r.def);
  END LOOP;

  out := out || E'\n-- ===== TRIGGERS =====\n';
  FOR r IN
    SELECT pg_get_triggerdef(t.oid) AS def FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  LOOP
    out := out || r.def || E';\n';
  END LOOP;

  out := out || E'\n-- ===== GRANTS =====\n';
  FOR r IN
    SELECT grantee, privilege_type, table_name FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role')
    ORDER BY table_name, grantee, privilege_type
  LOOP
    out := out || format(E'GRANT %s ON public.%I TO %I;\n', r.privilege_type, r.table_name, r.grantee);
  END LOOP;

  out := out || E'\n-- ===== RLS =====\n';
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity ORDER BY c.relname
  LOOP
    out := out || format(E'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;\n', r.relname);
  END LOOP;

  out := out || E'\n-- ===== POLICIES (public) =====\n';
  FOR r IN
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
  LOOP
    out := out || format(E'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;\n',
      r.policyname, r.tablename, r.permissive, r.cmd, array_to_string(r.roles, ', '),
      CASE WHEN r.qual IS NOT NULL THEN ' USING (' || r.qual || ')' ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN ' WITH CHECK (' || r.with_check || ')' ELSE '' END);
  END LOOP;

  out := out || E'\n-- ===== STORAGE BUCKETS (criar via ferramenta de storage) =====\n';
  FOR r IN SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY id LOOP
    out := out || format(E'-- bucket: id=%s name=%s public=%s file_size_limit=%s\n',
      r.id, r.name, r.public, coalesce(r.file_size_limit::text, 'default'));
  END LOOP;

  out := out || E'\n-- ===== POLICIES (storage.objects) =====\n';
  FOR r IN
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies WHERE schemaname = 'storage' ORDER BY tablename, policyname
  LOOP
    out := out || format(E'CREATE POLICY %I ON storage.%I AS %s FOR %s TO %s%s%s;\n',
      r.policyname, r.tablename, r.permissive, r.cmd, array_to_string(r.roles, ', '),
      CASE WHEN r.qual IS NOT NULL THEN ' USING (' || r.qual || ')' ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN ' WITH CHECK (' || r.with_check || ')' ELSE '' END);
  END LOOP;

  RETURN out;
END;
$dump$;

GRANT EXECUTE ON FUNCTION public.dump_schema_ddl() TO anon;
