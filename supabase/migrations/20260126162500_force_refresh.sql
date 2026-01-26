
-- Tentar remover a tabela occurrences_administrative forçando refresh
DROP TABLE IF EXISTS public.occurrences_administrative CASCADE;

-- Grant permissions again just to be safe
GRANT ALL ON TABLE public.chamados_ar_condicionado TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.chamados_banheiro TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.chamados_dispenser TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.ocorrencias_adm TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.protocol_sequences TO postgres, anon, authenticated, service_role;

-- Ensure triggers exist for protocols (if not already handled by schema.sql)
-- If schema.sql handles them, this is just a permissions refresh.

NOTIFY pgrst, 'reload config';
