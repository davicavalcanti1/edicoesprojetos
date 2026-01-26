
-- 1. Create ocorrencias_adm if missing (defensive)
CREATE TABLE IF NOT EXISTS public.ocorrencias_adm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id),
    criado_por UUID REFERENCES public.profiles(id),
    titulo TEXT,
    descricao TEXT,
    categoria TEXT,
    prioridade TEXT,
    status TEXT DEFAULT 'pendente',
    protocolo TEXT -- Should be handled by trigger, but ensure column exists
);

-- 2. Drop potential ghost triggers that might reference 'occurrences_administrative'
DROP TRIGGER IF EXISTS on_auth_user_created ON public.occurrences;
DROP TRIGGER IF EXISTS handle_new_occurrence ON public.occurrences;
DROP TRIGGER IF EXISTS notify_admin ON public.occurrences;

-- 3. Create a READ-ONLY View for maintenance_records to prevent 404s on Selects
-- This helps if the browser is caching old code that tries to LOAD data from here.
-- Note: Inserts will still fail if passing wrong columns, but Selects will work.
CREATE OR REPLACE VIEW public.maintenance_records AS
SELECT 
    id, 
    criado_em as created_at, 
    'ar_condicionado'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    null::text as responsavel -- Placeholder
FROM public.chamados_ar_condicionado
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'banheiro'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    problema as descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    null::text as responsavel
FROM public.chamados_banheiro
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'dispenser'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    observacao as descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    null::text as responsavel
FROM public.chamados_dispenser;

-- 4. Permissions
GRANT SELECT ON public.maintenance_records TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.ocorrencias_adm TO postgres, anon, authenticated, service_role;

-- 5. Refresh Cache
NOTIFY pgrst, 'reload config';
